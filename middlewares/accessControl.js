import jwt from "jsonwebtoken";
import sqlCon from "../configs/sqlCon.js";
const conn = sqlCon();

const verifyToken = async (req, res, next) => {
  try {
    req.decoded = jwt.verify(
      req.headers.authorization.replace(/^Bearer\s/, ""),
      process.env.SECRET
    );
    if (req.decoded.allowResult) {
      return res.status(403).json({
        error: "403 Forbidden",
        message: "Authorization 토큰이 아닙니다.",
      });
    }

    const [queryResult] = await conn.execute(
      "SELECT * FROM USER_AUTH_INFO WHERE user_id = ?",
      [req.decoded.ID]
    );

    if (queryResult[0] !== null) {
      return next();
    } else {
      throw new Error("TokenExpiredError");
    }
  } catch (err) {
    if (err.name == "TokenExpiredError") {
      return res.status(403).json({
        error: "403 Forbidden",
        message: "토큰이 만료됐습니다.",
      });
    }
    console.log(err);
    return res.status(403).json({
      error: "403 Forbidden",
      message: "유효하지 않은 토큰입니다.",
    });
  }
};

export default verifyToken;
