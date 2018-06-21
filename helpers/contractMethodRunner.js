const gasUtils = require('../utils/gas');
const logger = require('../utils/logger');

const { logTotalEtherSpent } = gasUtils;

const concludeUnsuccessfulUpdate = require('../contract-methods/concludeUnsuccessfulUpdate');

// Abstraction for calling each transaction and handling error state.
let error;
module.exports = async methodsToCall => {
  // Check if each transaction completed successfully; mark contract as invalid if not.
  for (let i = 0, j = methodsToCall.length; i < j; i++) {
    error = await methodsToCall[i].call();

    // Workaround for Infura issue
    // https://github.com/trufflesuite/truffle/issues/763
    logger.info('Waiting for Infura...')
    await new Promise(resolve => setTimeout(() => resolve(), 60000));
    logger.info('Finished waiting')

    if (error) {
      await concludeUnsuccessfulUpdate();
      logTotalEtherSpent();
      break;
    }
  }

  if (error) return error;

  logTotalEtherSpent();
}
