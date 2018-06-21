const rebalance = require('../rebalance');
const logger = require('../utils/logger');
const FLOATING_POINT_NAMES = require('../constants/floatingPointNames');

const PRECISIONS = {};
module.exports = async () => {
  logger.info('Getting decimal precisions');

  // Returned cached values if already retrieved.
  if (Object.keys(PRECISIONS).length) return PRECISIONS;

  // Query the contract to get current decimal precision values
  let wasError = false;
  let result;
  for (let i = 0; i < FLOATING_POINT_NAMES.length; i++) {
    const name = FLOATING_POINT_NAMES[i];

    logger.info(`Getting precision for field ${name}`);

    try {
      // First .call() here is for the dynamic function name,
      // second is the web3 .call() to built-in contract getter.
      result = await rebalance.methods[name].call().call();
    } catch (err) {
      logger.error(err)
      wasError = true;
      break;
    }

    PRECISIONS[name] = result;
  }

  if (wasError) return false;

  logger.info('Successfully retrieved precision values');

  for (const prop in PRECISIONS) {
    logger.info(`${prop}: ${PRECISIONS[prop]}`);
  }

  return PRECISIONS;
}