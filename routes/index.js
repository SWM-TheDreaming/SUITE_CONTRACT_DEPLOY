import express from "express";
import { elbHealthCheckService } from "../service/healthCheck";
const router = express.Router();

/* GET home page. */
router.post("/", elbHealthCheckService);

export default router;
