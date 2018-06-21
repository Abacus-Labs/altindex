const path = require('path');
const fs = require('fs-extra');
const network = require('./constants/network');

const web3 = require('./web3');
const address = require('./constants/addresses');

const source = fs.readFileSync(path.resolve(__dirname, 'build', 'CurrentRebalance.json'), 'utf8');
const CurrentRebalance = JSON.parse(source);

const instance = new web3.eth.Contract(
  JSON.parse(CurrentRebalance.interface),
  address[network]
);

module.exports = instance;
