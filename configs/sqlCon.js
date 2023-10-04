import mysql from "mysql2/promise";
import bluebird from "bluebird";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" });

export default () => {
  const connection = mysql.createPool({
    host: process.env.HOST,
    user: process.env.DBUSER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
    charset: "utf8mb4",
    Promise: bluebird,
  });
  return connection;
};
