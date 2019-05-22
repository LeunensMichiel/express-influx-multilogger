let data = [];
let databaseMetrics = [];
let performanceMetrics = [];

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
    } = {},
    performance = true
  }) => {
    return databaseInitializer.initializer(
      server,
      name,
      password,
      port,
      username,
      type,
      interval,
      performance
    );
  },
  log: ({ extended = true, development = false }) => {
    return logger.log(extended, development);
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
  insertDatabaseCallSpeed: object => {
    return logger.addToDbMetricsObject(object);
  },
  pushToDatabaseMetrics: object => {
    return databaseMetrics.push(object);
  },
  getDatabaseMetrics: () => {
    return databaseMetrics;
  },
  emptyDatabaseMetrics: () => {
    return (databaseMetrics = []);
  },
  pushToPerformanceMetrics: object => {
    return performanceMetrics.push(object);
  },
  getPerformanceMetrics: () => {
    return performanceMetrics;
  },
  emptyPerformanceMetrics: () => {
    return (performanceMetrics = []);
  }
};

const logger = require("./lib/Logger");
const multiError = require("./lib/MultiError");
const databaseInitializer = require("./lib/DatabaseInitializer");
