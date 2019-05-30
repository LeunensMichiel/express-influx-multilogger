const influx = require('./Influx');
const logger = require('./Logger');

module.exports = {
  initializer: (server, name, password, port, username, type, interval, performance) => {
    let database;
    switch (type) {
      case 'influx': {
        database = influx.intializeInflux(server, name, password, port, username);
        setInterval(async () => {
          if (performance) {
            await logger.addToPerformanceObject();
          }
          influx.writeToDatabase(database, name);
        }, interval);
        break;
      }
    }
  },
};
