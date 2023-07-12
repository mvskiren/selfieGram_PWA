const CACHE_STATIC_NAME = "static-v28",
  CACHE_DYNAMIC_NAME = "dynamic-v17",
  self = this;

("use strict");

(function () {
  function toArray(arr) {
    return Array.prototype.slice.call(arr);
  }

  function promisifyRequest(request) {
    return new Promise(function (resolve, reject) {
      request.onsuccess = function () {
        resolve(request.result);
      };

      request.onerror = function () {
        reject(request.error);
      };
    });
  }

  function promisifyRequestCall(obj, method, args) {
    var request;
    var p = new Promise(function (resolve, reject) {
      request = obj[method].apply(obj, args);
      promisifyRequest(request).then(resolve, reject);
    });

    p.request = request;
    return p;
  }

  function promisifyCursorRequestCall(obj, method, args) {
    var p = promisifyRequestCall(obj, method, args);
    return p.then(function (value) {
      if (!value) return;
      return new Cursor(value, p.request);
    });
  }

  function proxyProperties(ProxyClass, targetProp, properties) {
    properties.forEach(function (prop) {
      Object.defineProperty(ProxyClass.prototype, prop, {
        get: function () {
          return this[targetProp][prop];
        },
        set: function (val) {
          this[targetProp][prop] = val;
        },
      });
    });
  }

  function proxyRequestMethods(
    ProxyClass,
    targetProp,
    Constructor,
    properties
  ) {
    properties.forEach(function (prop) {
      if (!(prop in Constructor.prototype)) return;
      ProxyClass.prototype[prop] = function () {
        return promisifyRequestCall(this[targetProp], prop, arguments);
      };
    });
  }

  function proxyMethods(ProxyClass, targetProp, Constructor, properties) {
    properties.forEach(function (prop) {
      if (!(prop in Constructor.prototype)) return;
      ProxyClass.prototype[prop] = function () {
        return this[targetProp][prop].apply(this[targetProp], arguments);
      };
    });
  }

  function proxyCursorRequestMethods(
    ProxyClass,
    targetProp,
    Constructor,
    properties
  ) {
    properties.forEach(function (prop) {
      if (!(prop in Constructor.prototype)) return;
      ProxyClass.prototype[prop] = function () {
        return promisifyCursorRequestCall(this[targetProp], prop, arguments);
      };
    });
  }

  function Index(index) {
    this._index = index;
  }

  proxyProperties(Index, "_index", ["name", "keyPath", "multiEntry", "unique"]);

  proxyRequestMethods(Index, "_index", IDBIndex, [
    "get",
    "getKey",
    "getAll",
    "getAllKeys",
    "count",
  ]);

  proxyCursorRequestMethods(Index, "_index", IDBIndex, [
    "openCursor",
    "openKeyCursor",
  ]);

  function Cursor(cursor, request) {
    this._cursor = cursor;
    this._request = request;
  }

  proxyProperties(Cursor, "_cursor", [
    "direction",
    "key",
    "primaryKey",
    "value",
  ]);

  proxyRequestMethods(Cursor, "_cursor", IDBCursor, ["update", "delete"]);

  // proxy 'next' methods
  ["advance", "continue", "continuePrimaryKey"].forEach(function (methodName) {
    if (!(methodName in IDBCursor.prototype)) return;
    Cursor.prototype[methodName] = function () {
      var cursor = this;
      var args = arguments;
      return Promise.resolve().then(function () {
        cursor._cursor[methodName].apply(cursor._cursor, args);
        return promisifyRequest(cursor._request).then(function (value) {
          if (!value) return;
          return new Cursor(value, cursor._request);
        });
      });
    };
  });

  function ObjectStore(store) {
    this._store = store;
  }

  ObjectStore.prototype.createIndex = function () {
    return new Index(this._store.createIndex.apply(this._store, arguments));
  };

  ObjectStore.prototype.index = function () {
    return new Index(this._store.index.apply(this._store, arguments));
  };

  proxyProperties(ObjectStore, "_store", [
    "name",
    "keyPath",
    "indexNames",
    "autoIncrement",
  ]);

  proxyRequestMethods(ObjectStore, "_store", IDBObjectStore, [
    "put",
    "add",
    "delete",
    "clear",
    "get",
    "getAll",
    "getKey",
    "getAllKeys",
    "count",
  ]);

  proxyCursorRequestMethods(ObjectStore, "_store", IDBObjectStore, [
    "openCursor",
    "openKeyCursor",
  ]);

  proxyMethods(ObjectStore, "_store", IDBObjectStore, ["deleteIndex"]);

  function Transaction(idbTransaction) {
    this._tx = idbTransaction;
    this.complete = new Promise(function (resolve, reject) {
      idbTransaction.oncomplete = function () {
        resolve();
      };
      idbTransaction.onerror = function () {
        reject(idbTransaction.error);
      };
      idbTransaction.onabort = function () {
        reject(idbTransaction.error);
      };
    });
  }

  Transaction.prototype.objectStore = function () {
    return new ObjectStore(this._tx.objectStore.apply(this._tx, arguments));
  };

  proxyProperties(Transaction, "_tx", ["objectStoreNames", "mode"]);

  proxyMethods(Transaction, "_tx", IDBTransaction, ["abort"]);

  function UpgradeDB(db, oldVersion, transaction) {
    this._db = db;
    this.oldVersion = oldVersion;
    this.transaction = new Transaction(transaction);
  }

  UpgradeDB.prototype.createObjectStore = function () {
    return new ObjectStore(
      this._db.createObjectStore.apply(this._db, arguments)
    );
  };

  proxyProperties(UpgradeDB, "_db", ["name", "version", "objectStoreNames"]);

  proxyMethods(UpgradeDB, "_db", IDBDatabase, ["deleteObjectStore", "close"]);

  function DB(db) {
    this._db = db;
  }

  DB.prototype.transaction = function () {
    return new Transaction(this._db.transaction.apply(this._db, arguments));
  };

  proxyProperties(DB, "_db", ["name", "version", "objectStoreNames"]);

  proxyMethods(DB, "_db", IDBDatabase, ["close"]);

  // Add cursor iterators
  // TODO: remove this once browsers do the right thing with promises
  ["openCursor", "openKeyCursor"].forEach(function (funcName) {
    [ObjectStore, Index].forEach(function (Constructor) {
      Constructor.prototype[funcName.replace("open", "iterate")] = function () {
        var args = toArray(arguments);
        var callback = args[args.length - 1];
        var nativeObject = this._store || this._index;
        var request = nativeObject[funcName].apply(
          nativeObject,
          args.slice(0, -1)
        );
        request.onsuccess = function () {
          callback(request.result);
        };
      };
    });
  });

  // polyfill getAll
  [Index, ObjectStore].forEach(function (Constructor) {
    if (Constructor.prototype.getAll) return;
    Constructor.prototype.getAll = function (query, count) {
      var instance = this;
      var items = [];

      return new Promise(function (resolve) {
        instance.iterateCursor(query, function (cursor) {
          if (!cursor) {
            resolve(items);
            return;
          }
          items.push(cursor.value);

          if (count !== undefined && items.length == count) {
            resolve(items);
            return;
          }
          cursor.continue();
        });
      });
    };
  });

  var exp = {
    open: function (name, version, upgradeCallback) {
      var p = promisifyRequestCall(indexedDB, "open", [name, version]);
      var request = p.request;

      request.onupgradeneeded = function (event) {
        if (upgradeCallback) {
          upgradeCallback(
            new UpgradeDB(request.result, event.oldVersion, request.transaction)
          );
        }
      };

      return p.then(function (db) {
        return new DB(db);
      });
    },
    delete: function (name) {
      return promisifyRequestCall(indexedDB, "deleteDatabase", [name]);
    },
  };

  if (typeof module !== "undefined") {
    module.exports = exp;
    module.exports.default = module.exports;
  } else {
    self.idb = exp;
  }
})();

var dbPromise = idb.open("posts-store", 3, function (db) {
  if (!db.objectStoreNames.contains("posts")) {
    db.createObjectStore("posts", { keyPath: "id" });
  }
  if (!db.objectStoreNames.contains("sync-posts")) {
    db.createObjectStore("sync-posts", { keyPath: "id" });
  }
});

function writeData(st, data) {
  return dbPromise.then(function (db) {
    var tx = db.transaction(st, "readwrite");
    var store = tx.objectStore(st);
    store.put(data);
    return tx.complete;
  });
}

function readAllData(st) {
  return dbPromise.then(function (db) {
    var tx = db.transaction(st, "readonly");
    var store = tx.objectStore(st);
    return store.getAll();
  });
}

function deleteItemFromData(st, id) {
  dbPromise
    .then(function (db) {
      var tx = db.transaction(st, "readwrite");
      var store = tx.objectStore(st);
      store.delete(id);
      return tx.complete;
    })
    .then(function () {
      console.log("Item deleted!");
    });
}

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(CACHE_STATIC_NAME)
      .then((e) =>
        e.addAll([
          "/bundle.js",
          "/index.html",
          "/favicon.ico",
          "/manifest.json",
          "/offline.html",
          "/sw.js",
          "/idb.js",
          "/",
        ])
      )
  );
}),
  self.addEventListener("activate", function (e) {
    console.log("Activated", e),
      e.waitUntil(
        caches.keys().then((e) =>
          Promise.all(
            e.map((e) => {
              if (CACHE_STATIC_NAME !== e && CACHE_DYNAMIC_NAME !== e)
                return caches.delete(e);
            })
          )
        )
      );
  }),
  self.addEventListener("fetch", (e) => {
    var url =
      "https://offline-app-732aa-default-rtdb.asia-southeast1.firebasedatabase.app/posts.json";
    if (e.request.url.indexOf(url) > -1) {
      e.respondWith(
        fetch(e.request).then(function (res) {
          var clonedRes = res.clone();
          clonedRes.json().then(function (data) {
            for (var key in data) {
              writeData("posts", data[key]);
            }
          });
          return res;
        })
      );
    } else {
      e.respondWith(
        caches
          .match(e.request)
          .then(
            (t) =>
              t ||
              fetch(e.request).then((t) =>
                caches
                  .open(CACHE_DYNAMIC_NAME)
                  .then((s) => (s.put(e.request.url, t.clone()), t))
              )
          )
          .catch((e) =>
            caches.open(CACHE_STATIC_NAME).then((e) => e.match("/offline.html"))
          )
      );
    }
  }),
  self.addEventListener("sync", (event) => {
    console.log("Background sync event activated");
    console.log(event.tag, "event tag");
    if (event.tag === "sync-new-post") {
      event.waitUntil(
        readAllData("sync-posts").then((data) => {
          console.log(data, "test data..");
          for (let dt of data) {
            let postData = new FormData();
            postData.append("date", dt.date);
            postData.append("handle", dt.handle);
            postData.append("id", dt.id);
            postData.append("likeCount", dt.likeCount);
            postData.append("message", dt.message);
            postData.append("name", dt.name);
            postData.append(
              "profileImage",
              "https://xsgames.co/randomusers/avatar.php?g=male"
            );
            postData.append("replyCount", dt.replyCount);
            postData.append("tweetCount", dt.tweetCount);
            postData.append("file", dt.picture, dt.id + ".png");
            fetch(
              "https://us-central1-offline-app-732aa.cloudfunctions.net/storePostData",
              {
                method: "POST",
                body: postData,
              }
            )
              .then(function (res) {
                console.log("Sent data", res);
                if (res.ok) {
                  res.json().then(resData, () => {
                    deleteItemFromData("sync-posts", resData.id);
                    console.log("item deleted");
                  });
                }
              })
              .catch((err) => console.log("Error while sending data.."));
          }
        })
      );
    }
  });

self.addEventListener("notificationclick", function (event) {
  var notification = event.notification;
  var action = event.action;

  console.log(notification);

  if (action === "confirm") {
    console.log("Confirm was chosen");
    notification.close();
  } else {
    console.log(action);
    event.waitUntil(
      clients.matchAll().then(function (clis) {
        var client = clis.find(function (c) {
          return c.visibilityState === "visible";
        });

        if (client !== undefined) {
          client.navigate(notification.data.url);
          client.focus();
        } else {
          clients.openWindow(notification.data.url);
        }
        notification.close();
      })
    );
  }
});

self.addEventListener("notificationclose", function (event) {
  console.log("Notification was closed", event);
});

self.addEventListener("push", function (event) {
  console.log("Push Notification received", event);

  var data = {
    title: "New!",
    content: "Something new happened!",
    openUrl: "/",
  };

  if (event.data) {
    data = JSON.parse(event.data.text());
  }

  var options = {
    body: data.content,
    // icon: '/src/images/icons/app-icon-96x96.png',
    // badge: '/src/images/icons/app-icon-96x96.png',
    data: {
      url: data.openUrl,
    },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});
