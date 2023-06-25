import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";

export interface Websocket {
  loading: Boolean;
  connected: Boolean;
  room: string;
  state: object;
  send: (fun: string, data: object) => Boolean;
  socket: Socket;
  errors: string[];
  functions: string[];
}

export function useWebsockets(url: string): Websocket {
  const [state, setState] = useState({});
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [room, setRoom] = useState("");
  const [functions, setFunctions] = useState([]);
  const [errors, setErrors] = useState([]);

  const send = (fun: string, data: object): Boolean => {
    if (functions.includes(fun)) {
      socket.emit(fun, data);
      return true;
    } else {
      return false;
    }
  };

  useEffect(() => {
    const newSocket = io(url);
    newSocket.on("connect", () => {
      setLoading(false);
      setConnected(newSocket.connected);
      setSocket(newSocket);

      newSocket.on("room", (data) => {
        setRoom(data);
      });
      newSocket.on("functions", (data) => {
        setFunctions(data);
      });
      newSocket.on("update", (data) => {
        setState(data);
      });
      newSocket.on("errors", (data) => {
        setErrors((e) => [...e, data]);
      });
    });

    return () => {
      newSocket.close()
    };
  }, []);

  return { loading, connected, socket, state, send, errors, room, functions };
}
