const web3 = require('../web3');
const logger = require('./logger')

let gas;
let gasTotal = 0; // Running total of wei spent for given process
const getGasCostByTx = async (tx) => {
  const { transactionHash } = tx;
  const a = await web3.eth.getTransaction(transactionHash);
  const b = await web3.eth.getTransactionReceipt(transactionHash);

  // Mainnet block data sometimes not immediately available; will
  // skew gasTotal here.
  // TODO: Shouldn't run into this issue on mainnet while the
  // Infura workarond (1min timeout) is still in place; will
  // need to fix/account for this after that's removed.
  if (!a || !b) {
    logger.info(`Unable to get transaction info for tx ${transactionHash}`);
    return 0;
  }

  return a.gasPrice * b.gasUsed
}

const addSpentGas = async tx => {
  gas = await getGasCostByTx(tx);
  gasTotal += gas;
}

// Return gas spent in units of ether.
const getTotalEtherSpent = () => {
  return web3.utils.fromWei(gasTotal.toString());
}

const logTotalEtherSpent = () => {
  const totalEtherSpent = getTotalEtherSpent();
  logger.info(`Total ether spent was ${totalEtherSpent}`);
}

// web3 is setting gas price too low for mainnet - it's reporting SafeLow
// which isn't enough; bump current oracle price to ~Standard price per
// gas station: https://ethgasstation.info/
const getGasPrice = async () => {
  const oraclePrice = await web3.eth.getGasPrice();

  return (+oraclePrice * 1.3).toString();
}

module.exports = {
  getGasCostByTx,
  addSpentGas,
  getTotalEtherSpent,
  logTotalEtherSpent,
  getGasPrice,
};
