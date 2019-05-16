const si = require("systeminformation");
const iplocation = require("iplocation").default;
const geohash = require("ngeohash");
const _ = require("lodash");

const multilog = require("../multilogger");

let object = {};
object.databaseMetrics = [];

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
        getBasic(req, res);
        getParameters(req, realBody);
        getAuth(req);
        getPerformance(cpuUsage, memoryUsage);
      }

      object.method = req.method;
      object.statusCode = res.statusCode;
      object.statusMessage = res.statusMessage;
      object.date = new Date().toUTCString();
      object.responseTime = elapsedTimeInMs;
      object.contentType = req.header("Content-Type") || " ";
      object.hostname = req.hostname;
      object.osHost = hostInfo.hostname;
      object.url = req.url;
      object.path =
        res.statusCode !== 404 && req.route && req.route.path
          ? req.route.path
          : "No Path";
      object.body = req.method === "POST" ? realBody : " ";
      object.params = _.isEmpty(req.params) ? " " : JSON.stringify(req.params);
      object.query = _.isEmpty(req.query) ? " " : JSON.stringify(req.query);
      object.cookies = _.isEmpty(req.cookies)
        ? " "
        : JSON.stringify(req.cookies);
      object.auth =
        req.header("Authorization") || req.header("x-access-token") || " ";
      object.ip = req.connection.remoteAddress;
      object.location = location;
      object.clientInfo = req.header("User-Agent") || " ";
      object.memoryUsage = memoryUsage;
      object.cpuUsage = cpuUsage;
      object.errorMessage = res.locals.multiError || " ";

      if (development) {
        console.log(object);
      }
      multilog.pushToData(object);
      object = {};
      object.databaseMetrics = [];
    });
    next();
  };
};

const getBasic = (req, res) => {
  console.log("\n=====- Multilogger v0.1 -=====");
  console.log("--- Basic ---\n");
  console.info(
    `${req.method} ––– ${res.statusCode} –––  ${
      res.statusMessage
    } at ${new Date().toLocaleString()}`
  );
  console.info(`Response-time: ${res.getHeader("X-Response-Time")}`);
  console.info(
    `Content Type: ${req.header("Content-Type") || "No content type given"}`
  );
  console.info(`Hostname: ${req.hostname}`);
  console.info(
    `Path & URL: ${(req.route && req.route.path) || "No Path"} ––– ${req.url}`
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
      "No authorization given ⛔"}`
  );
  console.info(
    `Client: ${req.ip || "No IP found"} ––– ${req.header("User-Agent")}`
  );
};

const getPerformance = (cpuInfo, memoryInfo) => {
  console.log("\n--- Performance ---\n");

  console.info(`Memory Usage: ${JSON.stringify(memoryInfo)}`);
  console.info(`CPU Usage: ${JSON.stringify(cpuInfo)}`);
};

//  GET CPU INFO
const getCpuInfo = () => {
  return si.cpuCurrentspeed();
};

//  GET MEMORY INFO
const getMemInfo = async () => {
  const mem = await si.mem();
  return {
    free: mem.free,
    used: mem.used,
    total: mem.total / Math.pow(1024, 3)
  };
};

//  GET HOST INFO
const getHostInfo = () => {
  return si.osInfo();
};

const addToObject = ({ name, timing, ...custom } = {}) => {
  let databaseMetrics = {
    name,
    timing
  };
  _.flatMap(custom, param => {
    return _.map(param, (value, key) => {
      return (databaseMetrics[key] = value);
    });
  });
  object.databaseMetrics.push(databaseMetrics);
};

module.exports = {
  log,
  addToObject
};
