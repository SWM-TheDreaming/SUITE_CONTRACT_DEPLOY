import sqlCon from "../../configs/sqlCon.js";
import moment from "moment-timezone";
import dotenv from "dotenv";

dotenv.config();
moment.tz.setDefault("Asia/Seoul");

const conn = sqlCon();

export const userRregistrationService = async (data) => {
  const nowTime = moment().format("YYYY-M-D H:m:s");

  try {
    await conn.execute("INSERT INTO USER_AUTH_INFO VALUES (?,?,?,?,?)", [
      null,
      data.memberId,
      data.accountStatus,
      nowTime,
      nowTime,
    ]);
    console.log("----------------Finish Consuming-------------------");
    console.log("----------------Consumed Data Info-------------------");

    return {
      type: "Success",
      message: "성공적으로 유저 정보를 저장했습니다.",
      data,
    };
  } catch (err) {
    console.error(err);
    return {
      type: "Error",
      message: err.reason,
    };
  }
};
