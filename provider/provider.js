import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" });

const provider = new ethers.JsonRpcProvider(
  process.env.POLYGON_MAIN_NET_RPC_PROVIDER_URL
);

export default provider;
