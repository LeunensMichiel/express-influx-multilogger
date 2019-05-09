# Multilogger

An Express middleware for better monitoring of your Node.js apps.
Parse important req, res and header objects to Influx and Grafana. Get an easier insight of your API without any costs.

## Getting started

### Installation

1. Install package
   ```
   npm install multilogger
   ```
2. Initialize database in app.js
   ```
   multilogger.init({
    database: {
        server: "127.0.0.1",
        name: "myMultilogDb",
        port: 8086
         },
    interval: 10000 //  Write to Influx every 10 seconds
   });
    ```

### Example

```
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const multilogger = require("./logger/MultiloggerWare"); // Add multilogger

const indexRouter = require("./routes/index");
multilogger.init({
    database: {
        server: "127.0.0.1",
        name: "myMultilogDb",
        port: 8086
         },
    interval: 10000 //  Write to Influx every 10 seconds
}); // Initialize your DB. This will write data to influx at a given interval in ms

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

// Make your log objects to console.log and/or write to Influx
app.use(multilogger.log({ development: false, extended: false }));

app.use("/", indexRouter); // Your router

app.use(multilogger.error()); // To catch errors and send it to Influx as well

module.exports = app;

```
### Parameters

1. Extended: Logs a pretty view of req, res and headers (defaults false)
2. Development: Logs the object that Influx will recieve
3. Database:
    *   server: The address of your Influx database. _(defaults: 127.0.0.1)_
    *   name: Name of your Influx database. _(defaults: myMultilogDb)_
    *   port: Port of your Influx database. _(defaults: 3000)_
    *   username: Login credentials of your Influx database. _(defaults: '')_
    *   password: Password of your Influx database. _(defaults: '')_
4. Interval: Defines the rate in ms of the interval you want to write your data to your Influx database

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Dependencies
This middleware has a dependency on systeminformation, lodash and influx

*   [systeminformation](https://github.com/sebhildebrandt/systeminformation)
*   [lodash](https://lodash.com/)
*   [node-influx](https://www.npmjs.com/package/influx)

## Contributors
*   [Michiel Cuvelier](https://github.com/cuvelierm)