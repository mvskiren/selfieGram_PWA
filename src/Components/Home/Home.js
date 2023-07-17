import React, { useState, useEffect } from "react";
import "./Home.scss";
import { homepageLogo } from "../../Assets/Images/index";
import { useNavigate } from "react-router-dom";
import Tweet from "../Post/Post.jsx";
import TweetCreate from "../Tweet/Tweet.jsx";
import idb from "../../../src/idb.js";

function Home() {
  const navigate = useNavigate();

  const [postData, setPostData] = useState([]);

  const [loading, setLoading] = useState(false);

  const [networkData, setNetworkData] = useState(false);

  function compareDates(a, b) {
    const dateA = new Date(
      a.date.replace(/(\d{4})\/(\d{2})\/(\d{2})/, "$2/$3/$1")
    );
    const dateB = new Date(
      b.date.replace(/(\d{4})\/(\d{2})\/(\d{2})/, "$2/$3/$1")
    );

    return dateB - dateA; // Sort in descending order
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let resp = await fetch(
          "https://offline-app-732aa-default-rtdb.asia-southeast1.firebasedatabase.app/posts.json"
        );
        let data = await resp.json();
        let tempData = [];
        let tempDataSorted = [];
        for (let key in data) {
          tempData.push(data[key]);
        }
        tempDataSorted = tempData.sort(compareDates);
        setNetworkData(true);
        setPostData(tempDataSorted);
        setLoading(false);
        console.log("from network..");
      } catch (err) {
        console.log(err);
        setLoading(false);
      }
    };
    fetchData();
    // test
    var dbPromise = idb.open("posts-store", 3, function (db) {
      if (!db.objectStoreNames.contains("posts")) {
        db.createObjectStore("posts", { keyPath: "id" });
      }
    });

    function readAllData(st) {
      return dbPromise.then(function (db) {
        var tx = db.transaction(st, "readonly");
        var store = tx.objectStore(st);
        return store.getAll();
      });
    }
    if ("indexedDB" in window) {
      readAllData("posts").then(function (data) {
        if (!networkData) {
          console.log("From cache", data);
          setPostData(data);
          setLoading(false);
        }
      });
    }
  }, []);

  return (
    <div className="homePageContainer">
      <header className="homePageContainer__header">Navbar</header>
      <main className="homePageContainer__wrapper">
        <div className="homePageContainer__left">Left..</div>
        <div className="homePageContainer__middle">
          <div className="homePageContainer__middle__left">
            <div className="homePageContainer__middle__left__createPost">
              <TweetCreate />
            </div>
            <hr />
            <div className="tweet-list">
              {loading ? (
                <p>Loading...</p>
              ) : (
                postData.map((post) => <Tweet {...post} />)
              )}
            </div>
          </div>
          <div className="homePageContainer__middle__right">Right</div>
        </div>
      </main>
    </div>
  );
}

export default Home;
