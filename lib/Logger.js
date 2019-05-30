const si = require("systeminformation");
const iplocation = require("iplocation").default;
const geohash = require("ngeohash");
const _ = require("lodash");

const multilog = require("../multilogger");

let logObject = {};
let dbMetricsObject = {};
let perfMetricsObject = {};

// Creates a log object
const log = (extended, development) => {
  return async (req, res, next) => {
    const startHrTime = process.hrtime();

    res.on("finish", async () => {
      const elapsedHrTime = process.hrtime(startHrTime);
      const elapsedTimeInMs = elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1e6;

      const realBody = _.isEmpty(req.body) ? " " : JSON.stringify(req.body);
      const cpuUsage = await getCpuInfo();
      const memoryUsage = await getMemInfo();
      const hostInfo = await getHostInfo();

      const location = await iplocation(req.connection.remoteAddress)
        .then(result => {
          result.geohash = geohash.encode(result.latitude, result.longitude);
          return result;
        })
        .catch(err => {});

      if (extended) {
        getBasic(req, res, hostInfo, elapsedTimeInMs);
        getParameters(req, realBody);
        getAuth(req);
        getPerformance(cpuUsage, memoryUsage);
      }

      logObject.method = req.method || " ";
      logObject.statusCode = res.statusCode || " ";
      logObject.statusMessage = res.statusMessage || " ";
      logObject.date = new Date().toUTCString();
      logObject.responseTime = elapsedTimeInMs;
      logObject.contentType = req.header("Content-Type") || " ";
      logObject.hostname = req.hostname || " ";
      logObject.osHost = hostInfo.hostname || " ";
      logObject.url = req.originalUrl || req.url || " ";
      logObject.path =
        res.statusCode !== 404 && req.route && req.route.path
          ? req.route.path
          : " ";
      logObject.body = req.method === "POST" ? realBody : " ";
      logObject.params = _.isEmpty(req.params)
        ? " "
        : JSON.stringify(req.params);
      logObject.query = _.isEmpty(req.query) ? " " : JSON.stringify(req.query);
      logObject.cookies = _.isEmpty(req.cookies)
        ? " "
        : JSON.stringify(req.cookies);
      logObject.auth =
        req.header("Authorization") || req.header("x-access-token") || " ";
      logObject.ip = req.connection.remoteAddress || req.ip || " ";
      logObject.location = location || " ";
      logObject.clientInfo = req.header("User-Agent") || " ";
      logObject.errorMessage = res.locals.multiError || " ";

      if (development) {
        console.log(logObject);
      }

      multilog.pushToData(logObject);
      logObject = {};
    });
    next();
  };
};

const addToDbMetricsObject = ({ name, timing, ...custom } = {}) => {
  dbMetricsObject = {
    name,
    timing
  };
  _.flatMap(custom, param => {
    return _.map(param, (value, key) => {
      return (dbMetricsObject[key] = value);
    });
  });
  multilog.pushToDatabaseMetrics(dbMetricsObject);
  dbMetricsObject = {};
};

const addToPerformanceObject = async () => {
  perfMetricsObject = {
    memoryUsage: await getMemInfo(),
    cpuUsage: await getCpuInfo(),
    osHost: await getHostInfo(),
  };
  await multilog.pushToPerformanceMetrics(perfMetricsObject);
  perfMetricsObject = {};
};

const getBasic = (req, res, hostinfo, elapsed) => {
  console.log("\n=====- Multilogger v1.0.11 -=====");
  console.log("--- Basic ---\n");
  console.info(
    `${req.method} ––– ${res.statusCode} –––  ${
      res.statusMessage
    } at ${new Date().toLocaleString()}`
  );
  console.info(`Response-time: ${elapsed}`);
  console.info(
    `Content Type: ${req.header("Content-Type") || "No content type given"}`
  );
  console.info(`Hostname: ${req.hostname}`);
  console.info(`OS hostname: ${hostinfo.hostname}`);
  console.info(
    `Path & URL: ${(req.route && req.route.path) ||
      "No Path"} ––– ${req.originalUrl || req.url || "No Url"}`
  );
};

const getParameters = (req, realBody) => {
  console.log("\n--- Parameters ---\n");
  if (realBody) {
    console.info(`Request body: ${realBody}`);
  } else {
    console.info(`Request body: Body was empty`);
  }
  if (req.params && Object.keys(req.params).length !== 0) {
    console.info(`Parameters: ${JSON.stringify(req.params)}`);
  } else {
    console.info("Parameters: No parameters given");
  }
  if (req.query && Object.keys(req.query).length !== 0) {
    console.info(`Query: ${JSON.stringify(req.query)}`);
  } else {
    console.info("Query: No query given ❓");
  }
  console.info(
    `Cookies & Storage: ${JSON.stringify(req.cookies) || "No tasty cookies 🍪"}`
  );
};

const getAuth = req => {
  console.log("\n--- Authorization ---\n");
  console.info(
    `Authorization: ${req.header("Authorization") ||
      req.header("x-access-token") ||
      "No authorization tokens ⛔"}`
  );
  console.info(
    `Client: ${req.connection.remoteAddress ||
      req.ip ||
      "No IP found"} ––– ${req.header("User-Agent")}`
  );
};

const getPerformance = (cpuInfo, memoryInfo) => {
  console.log("\n--- Performance ---\n");

  console.info(`Memory Usage: ${JSON.stringify(memoryInfo)}`);
  console.info(`CPU Usage: ${JSON.stringify(cpuInfo)}`);
};

//  GET CPU INFO
const getCpuInfo = () => {
  return si.currentLoad();
};

//  GET MEMORY INFO
const getMemInfo = async () => {
  const mem = await si.mem();
  return {
    free: mem.free,
    used: mem.active,
    total: (mem.total / Math.pow(1024, 3)).toFixed(2)
  };
};

//  GET HOST INFO
const getHostInfo = () => {
  return si.osInfo();
};

module.exports = {
  log,
  addToDbMetricsObject,
  addToPerformanceObject,
};
