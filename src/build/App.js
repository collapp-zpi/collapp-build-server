import React from "react";
import Plugin from "./plugin/components/client.jsx";

export const App = ({ websockets, ids, size, users }) => {
  return <Plugin {...{ websockets, ids, size, users }} />;
};
