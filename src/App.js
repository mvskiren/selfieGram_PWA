import React from "react";
import "./App.scss";
import RouterConfig from "./Routes/RouterConfig";
import { BrowserRouter as Router, Link, Routes, Route } from "react-router-dom";
// import { db } from "./Database/Firebases";
// import {
//   collection,
//   getDocs,
//   addDoc,
//   updateDoc,
//   deleteDoc
//   doc,
// } from "@firebase/firestore";

function App() {
  // const usersCollectionRef = collection(db, "useState");

  // React.useEffect(() => {
  //   const getUsers = async () => {
  //     const data = await getDocs(usersCollectionRef);
  //     console.log(data, "hi");
  //     console.log(data.docs.map((doc) => ({ ...doc.data(), id: doc.title })));
  //   };

  //   getUsers();
  // }, []);

  return (
    <div className="app">
      {/* <Dashboard /> */}
      <Router>
        <RouterConfig />
      </Router>

      {/* <Router>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route exact path="/hello" element={<Dashboard />} />
          <Route exact path="/challenge" element={<ChallengePage />} />
        </Routes>
      </Router> */}
    </div>
  );
}

export default App;
