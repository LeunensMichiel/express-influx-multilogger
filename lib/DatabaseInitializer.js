const influx = require("./Influx");

module.exports = {
  initializer: (server, name, password, port, username, type, interval) => {
    let database;
    switch (type) {
      case "influx": {
        database = influx.intializeInflux(
          server,
          name,
          password,
          port,
          username
        );
        setInterval(async () => {
          influx.writeToDatabase(database, name);
        }, interval);
        break;
      }
    }
  }
};
