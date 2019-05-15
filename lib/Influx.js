const Influx = require("influx");
const _ = require("lodash");
const multilog = require("../multilogger");

const influx = {
  intializeInflux: (server, name, password, port, username) => {
    return new Influx.InfluxDB({
      host: server,
      database: name,
      port,
      password,
      username,
      schema: [
        {
          measurement: "number_of_requests",
          fields: {
            requests: Influx.FieldType.INTEGER,
            amountOf1xx: Influx.FieldType.INTEGER,
            amountOf2xx: Influx.FieldType.INTEGER,
            amountOf3xx: Influx.FieldType.INTEGER,
            amountOf4xx: Influx.FieldType.INTEGER,
            amountOf5xx: Influx.FieldType.INTEGER
          },
          tags: []
        },
        {
          measurement: "multilogger",
          fields: {
            responseTime: Influx.FieldType.FLOAT,
            cpuUsage: Influx.FieldType.FLOAT,
            memoryUsage: Influx.FieldType.FLOAT,
            requests: Influx.FieldType.INTEGER,
            host: Influx.FieldType.STRING,
            ip: Influx.FieldType.STRING
          },
          tags: [
            "statusCode",
            "statusMessage",
            "method",
            "path",
            "url",
            "ip",
            "country",
            "geohash",
            "client",
            "body",
            "query",
            "params",
            "auth",
            "errorMessage",
            "errorStack"
          ]
        }
      ]
    });
  },

  writeToDatabase: async (influx, name) => {
    influx
      .getDatabaseNames()
      .then(names => {
        if (!names.includes(name)) {
          return influx.createDatabase(name);
        }
      })
      .catch(err => {
        console.error(`Error creating Influx database!`);
      });

    if (_.size(multilog.getData()) > 0) {
      await influx
        .writePoints([
          {
            measurement: "number_of_requests",
            fields: {
              requests: multilog.getData().length,
              amountOf1xx: _.size(
                _.filter(multilog.getData(), object => {
                  return _.startsWith(object.statusCode, "1");
                })
              ),
              amountOf2xx: _.size(
                _.filter(multilog.getData(), object => {
                  return _.startsWith(object.statusCode, "2");
                })
              ),
              amountOf3xx: _.size(
                _.filter(multilog.getData(), object => {
                  return _.startsWith(object.statusCode, "3");
                })
              ),
              amountOf4xx: _.size(
                _.filter(multilog.getData(), object => {
                  return _.startsWith(object.statusCode, "4");
                })
              ),
              amountOf5xx: _.size(
                _.filter(multilog.getData(), object => {
                  return _.startsWith(object.statusCode, "5");
                })
              )
            },
            tags: {}
          }
        ])
        .catch(err => {
          console.error(`Error saving data to InfluxDB! ${err.stack}`);
        });
    }

    if (_.size(multilog.getData()) > 0) {
      for (const object of multilog.getData()) {
        await influx
          .writePoints([
            {
              measurement: "multilogger",
              tags: {
                statusCode: object.statusCode,
                statusMessage: object.statusMessage,
                method: object.method,
                path: object.path,
                url: object.url,
                ip: object.ip,
                country: _.isEmpty(object.location)
                  ? object.location.country || " "
                  : " ",
                geohash: _.isEmpty(object.location)
                  ? object.location.geohash
                  : " ",
                client: object.clientInfo,
                auth: object.auth,
                body: object.body,
                query: object.query,
                params: object.params,
                errorMessage:
                  JSON.stringify(object.errorMessage.errorMessage) || " ",
                errorStack:
                  JSON.stringify(object.errorMessage.errorStack) || " "
              },
              fields: {
                responseTime: object.responseTime,
                cpuUsage: object.cpuUsage.avg,
                memoryUsage: object.memoryUsage.used,
                requests: multilog.getData().length,
                host: object.hostname,
                ip: object.ip
              }
            }
          ])
          .catch(err => {
            console.error(`Error saving data to InfluxDB! ${err.stack}`);
          });

        //  Database measurements
        if (object.databaseMetrics && object.databaseMetrics !== []) {
          _.forEach(object.databaseMetrics, async metric => {
            await influx.writeMeasurement("databaseMetrics", [
              {
                tags: metric,
                fields: { timing: metric.timing }
              }
            ]);
          });
        }
      }
    }

    multilog.emptyData();
  }
};

module.exports = influx;
