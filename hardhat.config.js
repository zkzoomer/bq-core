
require("@nomiclabs/hardhat-waffle");
require('@nomiclabs/hardhat-truffle5');
require("@nomiclabs/hardhat-etherscan");
require('hardhat-contract-sizer');
require('hardhat-gas-reporter');
require('./src/utils/create_test')

const fs = require('fs');
const mnemonic = fs.readFileSync(".secret").toString().trim();
const apiKey = fs.readFileSync(".apiscan").toString().trim();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.9",
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true
    },
    mumbai_testnet: {
      url: 'https://rpc-mumbai.maticvigil.com',  // RPC used just for deploying
      accounts: {
        mnemonic: mnemonic
      }
    },
    dev: {
      url: 'HTTP://127.0.0.1:7545'
    }
  },
  gasReporter: {
    enabled: true,
    token: 'MATIC',
    currency: 'USD',
    coinmarketcap: '7b5edf80-0e66-464e-81f2-a07fcc725a4b',  // Keys in production 🤯?????
    gasPrice: 1000,  // Absolute worst case scenario sizing
  },
  mocha: {
    timeout: 100000000  // proof generation done all in one batch, can be slow
  },
  etherscan: {
    apiKey: apiKey
  },
};