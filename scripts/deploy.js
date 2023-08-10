const { ethers, upgrades } = require("hardhat");
const hre = require("hardhat");
const dotenv = require("dotenv");
const sqlCon = require("../db/sqlCon.js");
const fs = require("fs");
const path = require("path");
const cmd = require("node-cmd");
const contractWriter = require("../controller/contract_writer.js");

dotenv.config();
const conn = sqlCon();

const SUITE_CONTRACT = "SuiteContract";

const writeFileSync = (filePath, content) => {
  try {
    filePath = path.join(__dirname, filePath);
    console.log(filePath);
    fs.writeFileSync(filePath, content, "utf-8");
    console.log("File written successfully");
  } catch (e) {
    console.log(e);
    return e;
  }
};

const main = async () => {
  try {
    // Deploy the SuiteContract contract
    const [result] = await conn.execute("SELECT * FROM CONTRACT_INFO");
    let contract_id = result.length;
    let contract_factory_name;
    let contract_address;

    contract_id += 1;
    contract_factory_name = SUITE_CONTRACT + contract_id;
    writeFileSync(
      `../contracts/${contract_factory_name}.sol`,
      contractWriter(contract_factory_name)
    );
    cmd.runSync(
      "npx hardhat compile --network polygon_testnet",
      async (err, data, stterr) => {
        if (err) return err;
      }
    );

    const SuiteContract = await ethers.getContractFactory(
      contract_factory_name
    );
    const suiteContract = await SuiteContract.deploy(contract_id);

    const contract_ABI = require(`../artifacts/contracts/${contract_factory_name}.sol/${contract_factory_name}.json`);

    contract_address = suiteContract.target;

    packagedDatas = [
      null,
      contract_id,
      contract_factory_name,
      contract_address,
      contract_ABI,
    ];
    await conn.execute(
      "INSERT INTO CONTRACT_INFO VALUES (?,?,?,?,?)",
      packagedDatas
    );
    return packagedDatas;
  } catch (e) {
    console.log(e);
  }
};

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
