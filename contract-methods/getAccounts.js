const logger = require('../utils/logger');
const web3 = require('../web3');

let accounts;
module.exports = async () => {
  // Return singleton after accounts fetched.
  if (accounts) return accounts;

  logger.info('Getting wallet accounts');

  try {
    accounts = await web3.eth.getAccounts();
  } catch (err) {
    logger.error(err);
    return Promise.reject(err);
  }

  logger.info(`Retrieved accounts, first one is ${accounts && accounts[0]}, proceeding...`);

  return accounts;
}
