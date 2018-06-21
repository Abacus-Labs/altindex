const fs = require('fs-extra');
const path = require('path');
const HDWalletProvider = require('truffle-hdwallet-provider');
const Web3 = require('web3');
const compiledRebalance = require('../build/CurrentRebalance.json');
const logger = require('../utils/logger');
const network = require('../constants/network');
const addresses = require('../constants/addresses');

const provider = new HDWalletProvider(
  process.env.WALLET_MNEMONIC,
  `https://${network}.infura.io/${process.env.INFURA_ID}`
);

const web3 = new Web3(provider);

const deploy = async () => {
  const { interface, bytecode } = compiledRebalance;
  const accounts = await web3.eth.getAccounts();

  logger.info(`Attempting to deploy to ${network.toUpperCase()} from account ${accounts[0]}`);

  // Deploy contract
  let result;
  try {
    result = await new web3.eth.Contract(JSON.parse(interface))
      .deploy({ data: bytecode })
      .send({ gas: '2000000', from: accounts[0] });
  } catch (err) {
    logger.error(err);
    return;
  }

  // Get new address
  const { address } = result.options;

  // Assign new address for current network
  addresses[network] = address;

  const addressPath = path.resolve(__dirname, '..', 'constants', 'addresses.js');
  fs.removeSync(addressPath);

  // Write new address file
  fs.writeFileSync(addressPath, `module.exports = ${JSON.stringify(addresses)}`);

  logger.info(`Contract deployed to ${address}`);
};

deploy();
