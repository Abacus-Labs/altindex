const web3 = require('../web3');
const getAccounts = require('./getAccounts');
const getDecimalPrecisions = require('./getDecimalPrecisions');
const rebalance = require('../rebalance');
const gasUtils = require('../utils/gas');
const logger = require('../utils/logger');

const { addSpentGas, getGasPrice } = gasUtils;
const { fromAscii } = web3.utils;
const { setAssetDistributionRow } = rebalance.methods;
const gas = '1000000';

const fetchCurrentAssetDistribution = async () => {
  // Stub for future API integration
}

const assetDistribution = [
    {
      name: 'Bitcoin',
      ticker: 'BTC',
      marketCap: 126386000000,
      weight: 44.23,
    },
    {
      name: 'Ethereum',
      ticker: 'ETH',
      marketCap: 55720800000,
      weight: 19.50,
    },
    {
      name: 'Litecoin',
      ticker: 'LTC',
      marketCap: 6659590000,
      weight: 2.33,
    },
    {
      name: 'Monero',
      ticker: 'XMR',
      marketCap: 2485950000,
      weight: 0.87,
    },
    {
      name: 'Ripple',
      ticker: 'XRP',
      marketCap: 23649300000,
      weight: 8.28,
    },
    {
      name: 'Dash',
      ticker: 'DASH',
      marketCap: 2457790000,
      weight: 0.86,
    },
    {
      name: 'Ethereum Classic',
      ticker: 'ETC',
      marketCap: 1552140000,
      weight: 0.54,
    },
    {
      name: 'Lisk',
      ticker: 'LSK',
      marketCap: 898716000,
      weight: 0.31,
    },
    {
      name: 'Neo',
      ticker: 'NEO',
      marketCap: 3343510000,
      weight: 1.17,
    },
    {
      name: 'Zcash',
      ticker: 'ZEC',
      marketCap: 985956000,
      weight: 0.35,
    },
    {
      name: 'Bitshares',
      ticker: 'BTS',
      marketCap: 515494000,
      weight: 0.18,
    },
    {
      name: 'Stratis',
      ticker: 'STRAT',
      marketCap: 427484000,
      weight: 0.15,
    },
    {
      name: 'Nem',
      ticker: 'XEM',
      marketCap: 2174150000,
      weight: 0.76,
    },
    {
      name: 'Qtum',
      ticker: 'QTUM',
      marketCap: 1160130000,
      weight: 0.41,
    },
    {
      name: 'Stellar',
      ticker: 'XLM',
      marketCap: 5173720000,
      weight: 1.81,
    },
    {
      name: 'Siacoin',
      ticker: 'SC',
      marketCap: 520533000,
      weight: 0.18,
    },
    {
      name: 'Steem',
      ticker: 'STEEM',
      marketCap: 599757000,
      weight: 0.21,
    },
    {
      name: 'Bitcoin Cash',
      ticker: 'BCH',
      marketCap: 16874900000,
      weight: 5.91,
    },
    {
      name: 'EOS',
      ticker: 'EOS',
      marketCap: 10653300000,
      weight: 3.73,
    },
    {
      name: 'Iota',
      ticker: 'MIOTA',
      marketCap: 4372520000,
      weight: 1.53,
    },
    {
      name: 'OmiseGO',
      ticker: 'OMG',
      marketCap: 1051800000,
      weight: 0.37,
    },
    {
      name: 'Cardano',
      ticker: 'ADA',
      marketCap: 5454880000,
      weight: 1.91,
    },
    {
      name: 'Bitcoin Gold',
      ticker: 'BTG',
      marketCap: 717878000,
      weight: 0.25,
    },
    {
      name: 'ICON',
      ticker: 'ICX',
      marketCap: 1030270000,
      weight: 0.36,
    },
    {
      name: 'TRON',
      ticker: 'TRX',
      marketCap: 4105060000,
      weight: 1.44,
    },
    {
      name: 'VeChain',
      ticker: 'VEN',
      marketCap: 1779050000,
      weight: 0.62,
    },
    {
      name: 'Waves',
      ticker: 'WAVES',
      marketCap: 402016000,
      weight: 0.14,
    },
    {
      name: 'Nano',
      ticker: 'NANO',
      marketCap: 538277000,
      weight: 0.19,
    },
    {
      name: 'Verge',
      ticker: 'XVG',
      marketCap: 567928000,
      weight: 0.20,
    },
    {
      name: '0x',
      ticker: 'ZRX',
      marketCap: 653016000,
      weight: 0.23,
    },
    {
      name: 'Bytecoin',
      ticker: 'BCN',
      marketCap: 1195040000,
      weight: 0.42,
    },
    {
      name: 'Bitmark',
      ticker: 'BTM',
      marketCap: 619875000,
      weight: 0.22,
    },

    {
      name: 'Aeternity',
      ticker: 'AE',
      marketCap: 727219000,
      weight: 0.25,
    },
    {
      name: 'DigixDAO',
      ticker: 'DGD',
      marketCap: 261648000,
      weight: 0.09,
    },
];

module.exports = async () => {
  const accounts = await getAccounts();
  const PRECISIONS = await getDecimalPrecisions();
  const gasPrice = await getGasPrice();

  if (!PRECISIONS) return 'getDecimalPrecisions() error: No precisions returned';

  logger.info('Setting asset distribution');

  const { WEIGHT_DECIMALS } = PRECISIONS;

  let tx;
  let error;
  // Set each asset distribution row.
  for (let i = 0; i < assetDistribution.length; i++) {
    const { ticker, name, marketCap, weight } = assetDistribution[i];

    logger.info(`Setting row for asset ${ticker}`);

    try {
      tx = await setAssetDistributionRow(
        i,
        fromAscii(ticker),
        fromAscii(name),
        marketCap,
        weight * 10**WEIGHT_DECIMALS,
      )
        .send({
          from: accounts[0],
          gas,
          gasPrice,
        });
    } catch (err) {
      logger.error(err);
      error = err;
      await addSpentGas(tx);
      break;
    }

    logger.info(`Successfully set asset ${ticker}. ${tx.transactionHash}`);

    // Infura fix
    logger.info('waiting')
    await new Promise(resolve => setTimeout(() => resolve(), 60000));
    logger.info('finished waiting')

    await addSpentGas(tx);
  }

  if (error) return error;
  logger.info('Asset distribution successfully set');
}