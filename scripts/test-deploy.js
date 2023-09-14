const dotenv = require("dotenv");
const sqlCon = require("../db/sqlCon.js");
const fs = require("fs");
const path = require("path");
const cmd = require("node-cmd");
const contractWriter = require("../controller/test_contract_writer.js");
const hre = require("hardhat");
const hreConfig = require("../hardhat.config.js");
const {
  Contract,
} = require("hardhat/internal/hardhat-network/stack-traces/model.js");
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
    const [result] = await conn.execute(
      "SELECT * FROM CONTRACT_INFO WHERE network = ?",
      ["polygon_mumbai"]
    );
    let contract_id = result.length;
    let contract_factory_name;

    contract_id += 1;
    contract_factory_name = SUITE_CONTRACT + contract_id;

    writeFileSync(
      `../contracts/${contract_factory_name}.sol`,
      contractWriter(contract_factory_name)
    );
    console.log("파일 작성을 완료했습니다.");
    cmd.runSync("npx hardhat compile", (err, data, stterr) => {
      console.log(data);
      if (err) return err;
    });
    console.log("컨트랙트 컴파일을 완료했습니다.");

    console.log("지갑 공개 주소를 가져옵니다.");
    const [selectAccountInfoResult] = await conn.execute(
      "SELECT public_key FROM ACCOUNT_INFO WHERE alive = ? and network = ?",
      [1, "mumbai"]
    );
    const publicKeys = selectAccountInfoResult.map((row) => row.public_key);
    console.log(publicKeys);
    const suiteContract = await hre.ethers.deployContract(
      contract_factory_name,
      [contract_id, publicKeys]
    );
    console.log(suiteContract);

    const txResult = await suiteContract.waitForDeployment();

    console.log(`Success!! : ${txResult.target}`);
    const contract_ABI = require(`../artifacts/contracts/${contract_factory_name}.sol/${contract_factory_name}.json`);

    packagedDatas = [
      null,
      contract_id,
      "polygon_mumbai",
      contract_factory_name,
      txResult.target,
      contract_ABI,
    ];
    await conn.execute(
      "INSERT INTO CONTRACT_INFO VALUES (?,?,?,?,?,?)",
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
