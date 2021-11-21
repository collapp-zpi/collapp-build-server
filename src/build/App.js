import React from "react";
import Plugin from "./plugin/components/client.jsx";
import { useWebsockets } from "./useWebsockets";

export const App = ({ websockets, ids, size, users }) => {
  return (
    <Plugin
      {...{
        useWebsockets: () =>
          useWebsockets(`${websockets}/?id=${ids.space}_${ids.plugin}`),
        ids,
        size,
        users,
      }}
    />
  );
};
