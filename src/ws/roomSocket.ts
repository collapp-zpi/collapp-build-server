const backModules = {
  todo: {
    url: "http://localhost:3003/todo_server.js",
    scope: "todo_server",
    module: "./server",
  },
  notes: {
    url: "http://localhost:3003/notes_server.js",
    scope: "notes_server",
    module: "./server",
  },
};

const frontModules = {
  todo: {
    url: "http://localhost:3003/todo_client.js",
    scope: "todo_client",
    module: "./client",
  },
  notes: {
    url: "http://localhost:3003/notes_client.js",
    scope: "notes_client",
    module: "./client",
  },
};

export const rooms = {
  a: {
    modules: ["todo", "photo"],
    data: {
      todo: [
        {
          text: "default todo",
          isDone: false,
          timestamp: new Date().getTime(),
        },
      ],
      photo: "",
    },
  },
  b: {
    modules: ["todo", "notes"],
    data: {
      todo: [],
      notes: "asd tutaj",
    },
  },
  c: {
    modules: ["notes"],
    data: {
      notes: "asd tutaj",
    },
  },
};

export class RoomSocket {
  static connected = {};
  socket = null;
  __events = {};

  async init(socket, roomId) {
    if (!rooms?.[roomId]) {
      socket.close();
      this.send("GLOBAL", "ERROR", { errorMessage: ":D" });
      return false;
    }

    this.socket = socket;

    socket.on("message", (unparsed) => {
      try {
        const data = JSON.parse(unparsed);
        if (!data?.scope || !data?.message) return;
        if (!this.__events?.[data.scope]?.[data.message]) return;
        const passed = data?.data;
        const newState = this.__events[data.scope][data.message](
          this.getEventParams(data.scope, roomId),
          passed
        );
        if (newState !== undefined) {
          rooms[roomId].data[data.scope] = newState;
        }
      } catch (e) {
        // console.trace(e)
        this.send("GLOBAL", "ERROR", { errorMessage: e.message });
        socket.close();
      }
    });

    socket.on("close", () => {
      RoomSocket.connected[roomId].delete(this);
      for (const [scope, events] of Object.entries(this.__events)) {
        if (events.hasOwnProperty("__CLOSE")) {
          events["__CLOSE"](this.getEventParams(scope, roomId));
        }
      }
    });

    if (!RoomSocket.connected.hasOwnProperty(roomId))
      RoomSocket.connected[roomId] = new Set();

    RoomSocket.connected[roomId].add(this);

    // await this.loadModules(rooms[roomId].modules);
    this.send(
      "GLOBAL",
      "MODULES",
      rooms[roomId].modules
        .filter((module) => !!frontModules?.[module])
        .map((module) => ({ ...frontModules[module], name: module }))
    );
  }

  extend(scope, events) {
    if (!!this.__events?.[scope]) return;
    this.__events[scope] = events;
  }

  getEventParams(scope, roomId) {
    return {
      send: (message, data) => this.send(scope, message, data),
      broadcast: (message, data) => {
        [...RoomSocket.connected[roomId]].forEach((s) => {
          s.send(scope, message, data);
        });
      },
      state: rooms[roomId].data[scope],
    };
  }

  send(scope, message, data) {
    if (typeof scope !== "string") return;
    if (typeof message !== "string") return;
    if (this.socket.readyState !== 1) return;

    try {
      const parsed = JSON.stringify({ message, scope, data });
      this.socket.send(parsed);
    } catch (e) {
      console.error("Error parsing socket message.", e.message);
    }
  }

  //   async loadModules(list) {
  //     const imports = list.filter((scope) => backModules.hasOwnProperty(scope));

  //     const unique = [...new Set(imports)].map((name) => ({
  //       ...backModules[name],
  //       name,
  //     }));

  //     for (const { url, scope, module, name } of unique) {
  //       const events = await loadModule(url, scope, module);
  //       this.extend(name, events);
  //     }
  //   }
}
