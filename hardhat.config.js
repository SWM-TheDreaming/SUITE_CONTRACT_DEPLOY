require("@nomicfoundation/hardhat-toolbox");

const dotenv = require("dotenv");

dotenv.config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  defaultNetwork: "polygon_testnet",
  networks: {
    hardhat: {
      chainId: 1337,
      accounts: [
        {
          privateKey: process.env.WALLET_PRIVATE_KEY,
          balance: "10000000000000000000000",
        },
      ],
    },
    polygon_testnet: {
      // Polygon (Matic) 테스트넷 설정
      url:
        process.env.POLYGON_TEST_NET_RPC_PROVIDER_URL + process.env.RPC_API_KEY, // Polygon Mumbai Testnet RPC URL
      accounts: [process.env.WALLET_PRIVATE_KEY], // 지갑 pk 주소
    },
    polygon_mainnet: {
      // Polygon (Matic) 메인넷 설정
      url:
        process.env.POLYGON_MAIN_NET_RPC_PROVIDER_URL + process.env.RPC_API_KEY, // Polygon Mainnet RPC URL
      accounts: [process.env.WALLET_PRIVATE_KEY], // 지갑 pk 주소 // 지갑 pk 주소
    },
  },
  solidity: {
    version: "0.8.18", // solidity compiler version
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  mocha: {
    timeout: 40000,
  },
};
