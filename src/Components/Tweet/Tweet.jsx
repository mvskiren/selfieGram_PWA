import React, { useState, useRef } from "react";
import "./Tweet.scss";
import idb from "../../../src/idb.js";

const Tweet = () => {
  // const [tweetText, setTweetText] = useState("");
  const inputRef = useRef("");
  const [image, setImage] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const picture = useRef(null);

  const handleTextChange = (event) => {
    setTweetText(event.target.value);
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    setImage(URL.createObjectURL(file));
  };

  function dataURItoBlob(dataURI) {
    var byteString = atob(dataURI.split(",")[1]);
    var mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    var blob = new Blob([ab], { type: mimeString });
    return blob;
  }

  function sendData() {
    const id = new Date().toISOString();
    let postData = new FormData();
    postData.append("date", "Dec 25");
    postData.append("handle", "mvskiran");
    postData.append("id", id);
    postData.append("likeCount", 123);
    postData.append("message", "This post is synced from service worker.");
    postData.append("name", inputRef.current.value);
    postData.append(
      "profileImage",
      "https://xsgames.co/randomusers/avatar.php?g=male"
    );
    postData.append("replyCount", 321);
    postData.append("tweetCount", 12);
    postData.append("file", picture.current, id + ".png");
    fetch(
      "https://us-central1-offline-app-732aa.cloudfunctions.net/storePostData",
      {
        method: "POST",
        body: postData,
      }
    ).then(function (res) {
      console.log("Sent data", res);
    });
  }
  function displayConfirmNotification() {
    if ("serviceWorker" in navigator) {
      var options = {
        body: "You successfully subscribed to our Notification service!",
        // icon: '/src/images/icons/app-icon-96x96.png',
        // image: '/src/images/sf-boat.jpg',
        dir: "ltr",
        lang: "en-US", // BCP 47,
        vibrate: [100, 50, 200],
        // badge: '/src/images/icons/app-icon-96x96.png',
        tag: "confirm-notification",
        renotify: true,
        // actions: [
        //   { action: 'confirm', title: 'Okay', icon: '/src/images/icons/app-icon-96x96.png' },
        //   { action: 'cancel', title: 'Cancel', icon: '/src/images/icons/app-icon-96x96.png' }
        // ]
      };

      navigator.serviceWorker.ready.then(function (swreg) {
        swreg.showNotification("Successfully subscribed (from SW)!");
      });
    }
  }
  function urlBase64ToUint8Array(base64String) {
    var padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    var base64 = (base64String + padding)
      .replace(/\-/g, "+")
      .replace(/_/g, "/");

    var rawData = window.atob(base64);
    var outputArray = new Uint8Array(rawData.length);

    for (var i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
  function configurePushSub() {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    var reg;
    navigator.serviceWorker.ready
      .then(function (swreg) {
        reg = swreg;
        return swreg.pushManager.getSubscription();
      })
      .then(function (sub) {
        if (sub === null) {
          // Create a new subscription
          //           Private Key:
          // bllOFUIbTsJmuqYA2_dzdjMkedXCBUzzOakMJpvXCDI
          var vapidPublicKey =
            "BAxGEioEcwqjkuojJOgqMjAIsLRg_GwcQeysG0ZjtAt-sTdvbyOUef8li6Fdvs6p6upDmGezrcAMFUM0LPK8RPg";
          var convertedVapidPublicKey = urlBase64ToUint8Array(vapidPublicKey);
          return reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedVapidPublicKey,
          });
        } else {
          // We have a subscription
        }
      })
      .then(function (newSub) {
        return fetch(
          "https://offline-app-732aa-default-rtdb.asia-southeast1.firebasedatabase.app/subscriptions.json",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify(newSub),
          }
        );
      })
      .then(function (res) {
        if (res.ok) {
          displayConfirmNotification();
        }
      })
      .catch(function (err) {
        console.log(err);
      });
  }

  const handleShowNotification = () => {
    if ("Notification" in window) {
      Notification.requestPermission((res) => {
        if (res !== "granted") {
          console.log("Permission in not granted!");
        } else {
          console.log("Permission is granted");
          // displayConfirmNotification();
          configurePushSub();
        }
      });
    }
  };
  const handleSubmit = () => {
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
        console.log(db, "test");
        var tx = db.transaction(st, "readwrite");
        console.log(tx, "tx");
        var store = tx.objectStore(st);
        store.put(data);
        console.log(store, "store");
        return tx.complete;
      });
    }

    if ("serviceWorker" in navigator && "SyncManager" in window) {
      navigator.serviceWorker.ready.then(function (sw) {
        var post = {
          date: "Dec 25",
          handle: "BackgroundSync",
          id: `${inputRef.current.value}`,
          likeCount: 123,
          message: "This post is synced from service worker.",
          name: inputRef.current.value,
          profileImage: "https://xsgames.co/randomusers/avatar.php?g=male",
          replyCount: 343,
          tweetCount: 23,
          picture: picture.current,
        };
        writeData("sync-posts", post)
          .then(function () {
            return sw.sync.register("sync-new-post");
          })
          .then(function () {
            console.log("Your Post was saved for syncing!");
          })
          .catch(function (err) {
            console.log(err);
          });
      });
    } else {
      sendData();
    }
    // console.log("Tweet submitted:", tweetText);
    // setTweetText("");
    // setImage(null);
    // if ("serviceWorker" in navigator) {
    //   navigator.serviceWorker.getRegistrations().then(function (registrations) {
    //     for (var i = 0; i < registrations.length; i++) {
    //       registrations[i].unregister();
    //     }
    //   });
    // }
  };
  const handleShowImage = () => {
    if (!("mediaDevices" in navigator)) {
      navigator.mediaDevices = {};
    }

    if (!("getUserMedia" in navigator.mediaDevices)) {
      navigator.mediaDevices.getUserMedia = function (constraints) {
        var getUserMedia =
          navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

        if (!getUserMedia) {
          return Promise.reject(new Error("getUserMedia is not implemented!"));
        }

        return new Promise(function (resolve, reject) {
          getUserMedia.call(navigator, constraints, resolve, reject);
        });
      };
    }
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(function (stream) {
        videoRef.current.srcObject = stream;
        videoRef.current.style.display = "block";
      })
      .catch(function (err) {
        alert("error");
        console.log(err);
        // imagePickerArea.style.display = 'block';
      });
  };
  const handleCapture = (event) => {
    canvasRef.current.style.display = "block";
    videoRef.current.style.display = "none";
    // captureButton.style.display = 'none';
    var context = canvasRef.current.getContext("2d");
    context.drawImage(
      videoRef.current,
      0,
      0,
      canvas.width,
      videoRef.current.videoHeight /
        (videoRef.current.videoWidth / canvas.width)
    );
    videoRef.current.srcObject.getVideoTracks().forEach(function (track) {
      track.stop();
    });
    picture.current = dataURItoBlob(canvasRef.current.toDataURL());
  };

  return (
    <div className="tweet-container">
      {/* <img
        className="tweet-author-thumbnail"
        src="https://xsgames.co/randomusers/avatar.php?g=female"
      /> */}
      <div className="body">
        <textarea
          className="tweet-textarea"
          placeholder="What's happening?"
          ref={inputRef}
          // onChange={handleTextChange}
        />
        {image && <img src={image} alt="Uploaded" className="uploaded-image" />}
      </div>
      <div className="OptionsWrapper">
        <div className="header">
          <span className="icon icon-picture"></span>
          <span className="icon icon-gif"></span>
          <span className="icon icon-poll"></span>
          <span className="icon icon-emoji"></span>
        </div>
        <div className="footer">
          <input
            type="file"
            accept="image/*"
            // onChange={handleImageUpload}
            className="upload-input"
          />
          <button className="submit-button" onClick={handleSubmit}>
            upload
          </button>
          <button className="submit-button" onClick={handleShowNotification}>
            Request Permission
          </button>
        </div>
      </div>
      <video ref={videoRef} id="player" autoPlay playsInline muted></video>
      <canvas ref={canvasRef} id="canvas" width="320px" height="240px"></canvas>
      <button
        className="mdl-button mdl-js-button mdl-button--raised mdl-button--colored"
        id="capture-btn"
        onClick={handleShowImage}
      >
        Show Player
      </button>
      <button onClick={handleCapture}>Capture</button>
    </div>
  );
};

export default Tweet;
