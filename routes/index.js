import express from "express";
import { elbHealthCheckService } from "../service/healthCheck.js";
const router = express.Router();

/* GET home page. */
router.get("/", elbHealthCheckService);

export default router;
