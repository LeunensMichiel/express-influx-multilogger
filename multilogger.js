let data = [];

module.exports = {
  init: ({
    interval = 1000,
    database: {
      type = "influx",
      server = "127.0.0.1",
      name = "myMultilogDb",
      password = "",
      port = 3000,
      username = ""
    } = {}
  }) => {
    return databaseInitializer.initializer(
      server,
      name,
      password,
      port,
      username,
      type,
      interval
    );
  },
  log: ({ extended = true, development = false }) => {
    return logger(extended, development);
  },
  error: () => {
    return multiError();
  },
  pushToData: object => {
    return data.push(object);
  },
  emptyData: () => {
    return (data = []);
  },
  getData: () => {
    return data;
  },
};

const logger = require("./lib/Logger");
const multiError = require("./lib/MultiError");
const databaseInitializer = require("./lib/DatabaseInitializer");
