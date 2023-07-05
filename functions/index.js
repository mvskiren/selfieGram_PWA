var functions = require("firebase-functions");
var admin = require("firebase-admin");
var cors = require("cors")({ origin: true });
var webpush = require("web-push");

var serviceAccount = require("./pwafunctionsKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL:
    "https://offline-app-732aa-default-rtdb.asia-southeast1.firebasedatabase.app/",
});

exports.storePostData = functions.https.onRequest(function (request, response) {
  cors(request, response, function () {
    admin
      .database()
      .ref("posts")
      .push({
        date: request.body.date,
        handle: request.body.handle,
        id: request.body.id,
        likeCount: request.body.likeCount,
        message: request.body.message,
        name: request.body.name,
        profileImage: request.body.profileImage,
        replyCount: request.body.replyCount,
        tweetCount: request.body.tweetCount,
      })
      .then(function () {
        webpush.setVapidDetails(
          "mailto:kiranmvs07@gmail.com",
          "BAxGEioEcwqjkuojJOgqMjAIsLRg_GwcQeysG0ZjtAt-sTdvbyOUef8li6Fdvs6p6upDmGezrcAMFUM0LPK8RPg",
          "0lYvImD63Qs8C1S__pZFPNh9NU4RdP8NwIKLLEKY2wM"
        );
        return admin.database().ref("subscriptions").once("value");
      })
      .then(function (subscriptions) {
        subscriptions.forEach(function (sub) {
          var pushConfig = {
            endpoint: sub.val().endpoint,
            keys: {
              auth: sub.val().keys.auth,
              p256dh: sub.val().keys.p256dh,
            },
          };
          webpush
            .sendNotification(
              pushConfig,
              JSON.stringify({
                title: "New Post",
                content: "New Post added!",
                body: "Notified by Celala",
              })
            )
            .catch(function (err) {
              console.log(err, "error catcH");
            });
        });
        response
          .status(201)
          .json({ message: "Data stored", id: request.body.id });
      })
      .catch(function (err) {
        response.status(500).json({ error: err });
      });
  });
});
