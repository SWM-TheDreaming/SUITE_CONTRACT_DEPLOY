import express from "express";
import verifyToken from "../middlewares/accessControl.js";
import {
  signup,
  start,
  getGroupContract,
  stop,
  getTransactionRead,
  getTransactionTx,
} from "../service/manager.js";
const router = express.Router();

/* GET home page. */
router.post("/signup", signup);
router.post("/start", verifyToken, start);
router.post("/get/group-contract", verifyToken, getGroupContract);
router.post("/get/group-transaction-read", verifyToken, getTransactionRead);
router.post("/get/group-transaction-tx", verifyToken, getTransactionTx);
router.post("/stop", verifyToken, stop);

export default router;
