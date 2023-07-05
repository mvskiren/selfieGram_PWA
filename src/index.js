import React from "react";
import ReactDom from "react-dom";
import App from "./App";
import "./index.scss";
import "regenerator-runtime/runtime";
import "core-js/modules/es.promise";
// import registerServiceWorker from "./serviceWorkerRegistration";
ReactDom.render(<App />, document.getElementById("app"));

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .then((registration) => {
        console.log("SW registered: ", registration);
      })
      .catch((registrationError) => {
        console.log("SW registration failed: ", registrationError);
      });
  });
}
