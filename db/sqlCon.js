module.exports = () => {
  // get the client
  require("dotenv").config({ path: "../.env" });
  const mysql = require("mysql2/promise");
  // get the promise implementation, we will use bluebird
  const bluebird = require("bluebird");

  // create the connectionPool, specify bluebird as Promise
  const connection = mysql.createPool({
    host: process.env.HOST,
    user: process.env.DBUSER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
    Promise: bluebird,
  });
  return connection;
};
