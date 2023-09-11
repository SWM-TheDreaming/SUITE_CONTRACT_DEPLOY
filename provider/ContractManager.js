import sqlCon from "../db/sqlCon.js";
import moment from "moment-timezone";
import { ethers } from "ethers";
import dotenv from "dotenv";
import provider from "./provider.js";

dotenv.config();
moment.tz.setDefault("Asia/Seoul");
const conn = sqlCon();

class ContractManager {
  constructor(wallet_private_key) {
    this.provider = provider;
    this.wallet = new ethers.Wallet(wallet_private_key, this.provider);
  }

  async getContract(_hashed_key) {
    const [contractJoinResult] = await conn.execute(
      "SELECT cmi.hashed_key as hashed_key, ci.contract_id as contract_id, ci.contract_address as contract_address, ci.contractABI as abi  FROM CONTRACT_INFO ci JOIN CONTRACT_META_INFO cmi ON ci.contract_id = cmi.contract_id WHERE cmi.hashed_key = ?",
      [_hashed_key]
    );

    const selectABIResult = contractJoinResult[0].abi;
    const contractAddress = contractJoinResult[0].contract_address;
    this.contractAddress = contractAddress;

    const contract = new ethers.Contract(
      contractAddress,
      selectABIResult.abi,
      this.wallet
    );

    return contract;
  }
}

export default ContractManager;
