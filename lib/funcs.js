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

// 타임아웃 이벤트 핸들러
export const handleTimeoutWithAccountDisable = async (conn) => {
  await conn.execute("UPDATE ACCOUNT_INFO SET alive = ? WHERE id = ?", [
    false,
    accountRndId,
  ]);
  // 에러 발생
  throw new Error("요청이 시간 초과되었습니다. 계좌를 불용처리했습니다.");
  // 에러를 처리하거나 적절히 처리할 수 있도록 로직을 추가하세요.
};
