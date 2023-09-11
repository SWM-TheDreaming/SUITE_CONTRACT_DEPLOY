import express from "express";
import verifyToken from "../middlewares/accessControl.js";
import { signup, start, stop, updateAccount } from "../service/manager.js";

const router = express.Router();

/* GET home page. */
router.post("/signup", signup);
router.post("/start", verifyToken, start);
router.post("/stop", verifyToken, stop);
router.post("/update/account", verifyToken, updateAccount);

export default router;
