const web3 = require('../web3');
const getAccounts = require('./getAccounts');
const rebalance = require('../rebalance');
const network = require('../constants/network');
const addresses = require('../constants/addresses');
const gasUtils = require('../utils/gas');
const logger = require('../utils/logger');

const { addSpentGas, getGasPrice } = gasUtils;
const { initiateUpdate } = rebalance.methods;
const gas = '1000000';

let tx;
module.exports = async () => {
  const accounts = await getAccounts();
  const gasPrice = await getGasPrice();

  logger.info(`Initiating update on ${network.toUpperCase()} at address ${addresses[network]}`);

  try {
    tx = await initiateUpdate().send({
      from: accounts[0],
      gas,
      gasPrice,
    });
  } catch (err) {
    logger.error(err);
    return err;
  }

  await addSpentGas(tx);

  logger.info(`Update initiation successful. ${tx.transactionHash}`);
}
