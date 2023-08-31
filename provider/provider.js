import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" });

const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_API_URL);

export default provider;
