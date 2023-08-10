const { ethers } = require("hardhat");
const dotenv = require("dotenv");

dotenv.config();

const main = async () => {
  // Deploy the SuiteContract contract
  const SuiteContract = await ethers.getContractFactory("SuiteContract");
  const SuiteContract2 = await ethers.getContractFactory("SuiteContract2");
  const contractId = 1;
  const contractId2 = 2;
  const suiteContract = await SuiteContract.deploy(contractId);
  const suiteContract2 = await SuiteContract2.deploy(contractId2);
  console.log("SuiteContract deployed to:", suiteContract);
  console.log("SuiteContract2 deployed to:", suiteContract2);
};

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
