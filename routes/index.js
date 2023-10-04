import express from "express";
import sqlCon from "../configs/sqlCon.js";
const conn = sqlCon();
const router = express.Router();

/* GET home page. */
router.get("/", async function (req, res, next) {
  const DBSearchResult = await conn.execute("SELECT * FROM user_auth_info");
  console.log(DBSearchResult[0]);
  return res.send(DBSearchResult[0]);
});

router.post("/initialization", async (req, res, next) => {});

export default router;
