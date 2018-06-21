const web3 = require('../web3');
const getAccounts = require('./getAccounts');
const superagent = require('superagent');
const fs = require('fs-extra');
const path = require('path');
const md5File = require('md5-file');

const rebalance = require('../rebalance');
const gasUtils = require('../utils/gas');
const logger = require('../utils/logger');

const { addSpentGas, getGasPrice } = gasUtils;
const { fromAscii } = web3.utils;
const { setDocumentHash, setDocumentUrl } = rebalance.methods;
const gas = '1000000';

const getDocumentUrl = () => {
  // TODO: Decide on convention and programatically infer date.
  const filename = 'AltindexIndexationTool-June.xlsx';

  return `${process.env.STATIC_ASSETS_BASEURL}/${filename}`;
}

const getFileFingerprint = async () => {
  let file;

  logger.info('Fetching external document')
  try {
    file = await superagent
      .get(getDocumentUrl())
      // Fetch as Buffer: https://github.com/visionmedia/superagent/issues/871
      .buffer(true).parse(superagent.parse.image)
      .then(res => res.body);
  } catch (err) {
    logger.error(err);
    return;
  }

  logger.info('Fetch successful');

  // Create tmp/ and write file
  const tmpPath = path.resolve(__dirname, '..', 'tmp');
  fs.ensureDirSync(tmpPath);

  const filepath = path.resolve(tmpPath, 'CurrentRebalance.xlsx');
  fs.writeFileSync(filepath, file, null);

  // Get MD5 hash
  const fingerprint = md5File.sync(filepath);

  logger.info(`Fingerprint of external doc: ${fingerprint}`);

  // Remove tmp/
  fs.removeSync(tmpPath);

  return fingerprint;
}

module.exports = async () => {
  const accounts = await getAccounts();
  const gasPrice = await getGasPrice();

  let hash;
  try {
    hash = await getFileFingerprint();
  } catch (err) {
    logger.error(err);
    return err;
  }

  logger.info('Setting document fingerprint');

  try {
    tx = await setDocumentHash(fromAscii(hash)).send({
      from: accounts[0],
      gas,
      gasPrice,
    });
  } catch (err) {
    logger.error(err);
    addSpentGas(tx);
    return err;
  }

  // Workaround for Infura issue
  // https://github.com/trufflesuite/truffle/issues/763
  logger.info('Waiting for Infura...')
  await new Promise(resolve => setTimeout(() => resolve(), 60000));
  logger.info('Finished waiting')

  logger.info(`Document fingerprint set. ${tx.transactionHash}`);
  addSpentGas(tx);

  logger.info('Setting document URL');

  try {
    tx = await setDocumentUrl(fromAscii(getDocumentUrl())).send({
      from: accounts[0],
      gas,
      gasPrice,
    });
  } catch (err) {
    logger.error(err);
    addSpentGas(tx);
    return err;
  }

  // Workaround for Infura issue
  // https://github.com/trufflesuite/truffle/issues/763
  logger.info('Waiting for Infura...')
  await new Promise(resolve => setTimeout(() => resolve(), 60000));
  logger.info('Finished waiting')

  logger.info(`Document URL set. ${tx.transactionHash}`);
  addSpentGas(tx);
}
