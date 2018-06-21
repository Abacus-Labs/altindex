const getAccounts = require('./getAccounts');
const rebalance = require('../rebalance');
const gasUtils = require('../utils/gas');
const logger = require('../utils/logger');

const { addSpentGas, getGasPrice } = gasUtils;
const { concludeUnsuccessfulUpdate } = rebalance.methods;

let tx;
module.exports = async () => {
  const accounts = await getAccounts();
  const gasPrice = await getGasPrice();

  logger.info('Error during update; marking contract invalid');

  try {
    tx = await concludeUnsuccessfulUpdate().send({
      from: accounts[0],
      // If unsuccessful, might be trying to write many tx on same block, so set gas higher.
      gas: '2000000',
      gasPrice,
    });
  } catch (err) {
    logger.error(err);
    logger.info('Error trying to mark contract invalid, nothing else I can do, giving up.');
    return err;
  }

  await addSpentGas(tx);

  logger.info(`Successfully marked contract as invalid. ${tx.transactionHash}`);
}