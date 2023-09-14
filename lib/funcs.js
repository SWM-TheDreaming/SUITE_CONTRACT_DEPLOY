import crypto from "crypto";
import dotenv from "dotenv";
import sqlCon from "../db/sqlCon.js";
dotenv.config({ path: "../.env" });
const conn = sqlCon();
export const makeGroupHashedID = (group_plain_id, group_plain_title) =>
  new Promise(async (resolve, reject) => {
    const salt = process.env.SALT;
    crypto.pbkdf2(
      String(group_plain_id) + group_plain_title,
      salt,
      9999,
      32,
      "sha512",
      (err, key) => {
        if (err) reject(err);
        resolve({ crypt: key.toString("hex") });
      }
    );
  });
