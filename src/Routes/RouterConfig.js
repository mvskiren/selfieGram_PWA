import React from "react";
import { useRoutes } from "react-router-dom";
//const Home = lazy(() => import("../Components/Dashboard"));
import Home from "../Components/Home/Home";
// import Hooks from "../Components/Dashboard/Hooks";
// import Router from "../Components/Dashboard/Router";

const RouterConfig = () => {
  let routes = useRoutes([
    { path: "/", element: <Home /> },

    // {
    //   path: "/dashboard",
    //   element: <Dashboard />,
    //   children: [
    //     { path: "overview", element: <Hooks /> },
    //     { path: "hooks", element: <Hooks /> },
    //     { path: "hooks/*", element: <h1>Hooks</h1> },
    //     { path: "router", element: <Router /> },
    //     { path: "contextApi", element: <h1>Hooks</h1> },
    //     { path: "customHooks", element: <h1>Hooks</h1> },
    //     { path: "Contest", element: <h1>Hooks</h1> },
    //     { path: "360", element: <h1>Hooks</h1> },
    //   ],
    // },

    // { path: "challenge", element: <Challenge /> },
    // { path: "/add", element: <UpdateChallenges /> },
    // ...
  ]);
  return routes;
};

export default RouterConfig;
