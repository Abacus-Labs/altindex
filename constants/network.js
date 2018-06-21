// Default to test network.
module.exports = (process.argv[2] === 'mainnet') ? 'mainnet' : 'ropsten';
