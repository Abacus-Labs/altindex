const getAccounts = require('./getAccounts');
const getDecimalPrecisions = require('./getDecimalPrecisions');
const rebalance = require('../rebalance');
const gasUtils = require('../utils/gas');
const logger = require('../utils/logger');

const { addSpentGas, getGasPrice } = gasUtils;
const { setRebalanceMetadata } = rebalance.methods;
const gas = '1000000';

const fetchCurrentRebalanceMetadata = async () => {
  // Stub for future API integration
}

const rebalanceMetadata = {
  inceptionTimestamp: 1483228800000,
  priceCloseTimestamp: 1527724800000,
  rebalanceTimestamp: 1527811200000,
  modelVersion: 0,
  inceptionValue: 10.0000,
  modelValue: 110.2934,
  totalMarketCap: 316429365885,
  marketCapCoverage: 90.29,
};

module.exports = async () => {
  const accounts = await getAccounts();
  const PRECISIONS = await getDecimalPrecisions();
  const gasPrice = await getGasPrice();

  const {
    inceptionTimestamp,
    priceCloseTimestamp,
    rebalanceTimestamp,
    modelVersion,
    inceptionValue,
    modelValue,
    totalMarketCap,
    marketCapCoverage,
  } = rebalanceMetadata;

  const {
    INCEPTION_VALUE_DECIMALS,
    MODEL_VALUE_DECIMALS,
    MARKET_CAP_COVERAGE_DECIMALS,
  } = PRECISIONS;

  logger.info('Setting rebalance metadata');

  let error;
  try {
    tx = await setRebalanceMetadata(
      inceptionTimestamp,
      priceCloseTimestamp,
      rebalanceTimestamp,
      modelVersion,
      inceptionValue * 10**INCEPTION_VALUE_DECIMALS,
      modelValue * 10**MODEL_VALUE_DECIMALS,
      totalMarketCap,
      marketCapCoverage * 10**MARKET_CAP_COVERAGE_DECIMALS,
    ).send({
      from: accounts[0],
      gas,
      gasPrice,
    })
  } catch (err) {
    logger.error(err);
    error = err;
    await addSpentGas(tx);
  }

  if (error) return error;
  await addSpentGas(tx);

  logger.info(`Rebalance metadata successfully set. ${tx.transactionHash}`);
}