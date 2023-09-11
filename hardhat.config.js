require("@nomicfoundation/hardhat-toolbox");

const dotenv = require("dotenv");

dotenv.config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  defaultNetwork: "polygon_mumbai",
  networks: {
    // hardhat: {
    //   chainId: 1337,
    //   accounts: [
    //     {
    //       privateKey: process.env.WALLET_PRIVATE_KEY,
    //       balance: "10000000000000000000000",
    //     },
    //   ],
    // },
    // sepolia: {
    //   // Polygon (Matic) 테스트넷 설정
    //   url: process.env.SEPOLIA_API_URL,
    //   accounts: [process.env.WALLET_PRIVATE_KEY], // 지갑 pk 주소
    // },

    // polygon_mainnet: {
    //   // Polygon (Matic) 메인넷 설정
    //   url: process.env.POLYGON_MAIN_NET_RPC_PROVIDER_URL,
    //   accounts: [process.env.WALLET_PRIVATE_KEY], // 지갑 pk 주소 // 지갑 pk 주소
    // },
    polygon_mumbai: {
      url: process.env.POLYGON_TEST_NET_RPC_PROVIDER_URL,
      accounts: [
        process.env.POLOYGON_MUMBAI_WALLET_PRIVATE_KEY,
        process.env.POLOYGON_MUMBAI_WALLET_PRIVATE_KEY2,
        process.env.POLOYGON_MUMBAI_WALLET_PRIVATE_KEY3,
        process.env.POLOYGON_MUMBAI_WALLET_PRIVATE_KEY4,
        process.env.POLOYGON_MUMBAI_WALLET_PRIVATE_KEY5,
      ],
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
