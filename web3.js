const Web3 = require('web3');
const HDWalletProvider = require('truffle-hdwallet-provider');
const network = require('./constants/network');
const NonceSubprovider = require("web3-provider-engine/subproviders/nonce-tracker");

const provider = new HDWalletProvider(
  process.env.WALLET_MNEMONIC,
  `https://${network}.infura.io/${process.env.INFURA_ID}`,
);
// Added to try getting around issue with Infura not correctly keeping track
// of nonces between load-balancers on mainnet.
provider.engine.addProvider(new NonceSubprovider());

module.exports = new Web3(provider);
