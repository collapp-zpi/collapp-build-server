const set = ({ broadcast }, input) => {
  broadcast("state", input);
  return input;
};

const open = ({ send, state }) => {
  send("state", state);
};

const events = {
  set,
  __OPEN: open,
};

export default events;
