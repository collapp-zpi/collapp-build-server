import React from "react";
import Plugin from "./plugin/components/client.jsx";

export const App = ({ websockets, ids, size }) => {
  return <Plugin websockets={websockets} ids={ids} size={size} />;
};
