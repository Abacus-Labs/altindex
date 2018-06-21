const getAccounts = require('./getAccounts');
const rebalance = require('../rebalance');
const gasUtils = require('../utils/gas');
const logger = require('../utils/logger');

const { addSpentGas, getGasPrice } = gasUtils;
const { concludeSuccessfulUpdate } = rebalance.methods;
const gas = '1000000';

let tx;
module.exports = async () => {
  const accounts = await getAccounts();
  const gasPrice = await getGasPrice();

  logger.info('All data set, marking update as successful...')

  try {
    tx = await concludeSuccessfulUpdate().send({
      from: accounts[0],
      gas,
      gasPrice,
    });
  } catch (err) {
    logger.error(err);
    return err;
  }

  await addSpentGas(tx);

  logger.info(`Rebalance successfully updated!: ${tx.transactionHash}`);
}
