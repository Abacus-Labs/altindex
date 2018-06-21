const contractMethodRunnner = require('../helpers/contractMethodRunner');
const initiateUpdate = require('../contract-methods/initiateUpdate');
const setAssetDistributionRows = require('../contract-methods/setAssetDistributionRows');
const setRebalanceMetadata = require('../contract-methods/setRebalanceMetadata');
const setExternalFileMetadata = require('../contract-methods/setExternalFileMetadata');
const concludeSuccessfulUpdate = require('../contract-methods/concludeSuccessfulUpdate');
const logger = require('../utils/logger');
const mailer = require('../utils/mailer');
const { getTotalEtherSpent } = require('../utils/gas');
const network = require('../constants/network');

// Log stack-trace on error
process.on('unhandledRejection', r => logger.error(r));
process.on('unhandledException', r => logger.error(r));

const sendSuccessEmail = () => {
  mailer(
    `Altindex rebalance update (${network}): success`,
    `<p>All transactions successful; total ether spent was ${getTotalEtherSpent()}</p>`,
  );
}

const sendFailureEmail = err => {
  mailer(
    `Altindex rebalance update (${network}): error`,
    `<p>There was an error while updating the rebalance: ${err}</p>
    <p>Check the logs for more info.</p>
    <p>Total ether spent was ${getTotalEtherSpent()}</p>`,
  );
}

const main = async () => {
  const methodsToCall = [
    initiateUpdate,
    setAssetDistributionRows,
    setRebalanceMetadata,
    setExternalFileMetadata,
    concludeSuccessfulUpdate
  ];

  let error;
  try {
    error = await contractMethodRunnner(methodsToCall);
  } catch (err) {
    sendFailureEmail(err);
    return;
  }

  error ? sendFailureEmail(error) : sendSuccessEmail();
}

main();
