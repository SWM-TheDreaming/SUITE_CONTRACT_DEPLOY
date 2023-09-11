import express from "express";
import verifyToken from "../middlewares/accessControl.js";

import {
  getGroupContract,
  getTransactionRead,
  getTransactionTx,
} from "../service/user.js";
const router = express.Router();

/* GET home page. */
router.post("/get/group-contract", verifyToken, getGroupContract);
router.post("/get/group-transaction-read", verifyToken, getTransactionRead);
router.post("/get/group-transaction-tx", verifyToken, getTransactionTx);

export default router;
