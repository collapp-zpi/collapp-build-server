import React from "react";
import Plugin from "./plugin/components/client.jsx";
import { useWebsockets } from "./useWebsockets";

export const App = ({ url, ids, size, users, ...props }) => {
  return (
    <Plugin
      {...{
        ...props,
        useWebsockets: () =>
          useWebsockets(`${url}/?id=${ids.space}_${ids.plugin}`),
        ids,
        size,
        users,
      }}
    />
  );
};
