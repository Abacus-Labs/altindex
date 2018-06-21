## Motivation
To provide a mechanism to publish to the Ethereum blockchain rebalancing models of an index representing an optimal mix of crypto-currency assets.  Applications of the index include acting as a crypto-market benchmark index similar to fiat indices, which could further be tokenized as an investment vehicle.  Currently no transparency exists regarding what assets in which amounts make up a given index or resulting fund, let alone the process for how these values are derived.  Publishing this information in an unalterable and verifiable medium is the primary motivation for this project.  Only the top-level information is written to the blockchain, while the full supporting document that the published data is derived from is hosted externally.  The URL and MD5 fingerprint of the external file is included in the smart contract.

## Getting started
To use this project as a template for your own model publishing, there are some pre-requisites besides just installing the node dependencies.  The included package-lock was created with npm v6.1.0; you should also be using node v8.5.0 or higher.

### Environment variables
Six environment vars are necessary; place these in your `.bash_profile` or manage with something else and change the relevant part in the code where `process.env.VAR`s are referenced:

```bash
export WALLET_MNEMONIC=(your 12-word wallet mnemonic)
export INFURA_ID=(This project uses [Infura](http://infura.io/) to connect to the Ethereum nodes)
export STATIC_ASSETS_BASEURL=(A base URL to be used wherever your external document is hosted)
# Following three are used to set up the notification mailer.
# If using Gmail, reference this post to configure the Gmail side:
# https://medium.com/@manojsinghnegi/sending-an-email-using-nodemailer-gmail-7cfa0712a799
export MAIL_USER
export MAIL_PASSWORD
export MAIL_RECEIVERS=(should be a comma-seperated string)
```

### External Filename Logic
In addition to the static asset environment variable, the logic to construct the filename to fetch should be defined in `getDocumentUrl()`, located in `setExternalFileMetadata.js`.

### Logging
For now this version of the project logs to `/var/log`; you will need to both create and assign the correct user to a `/var/log/rebalance-ethereum.log` file prior to running the scripts if you want file logs (the same output is also logged to the console).

### Defining your index model/decimal precisions
See [Writing to the smart contract](#writing-to-the-smart-contract).

## Usage

### Compilation
Unless you modify the contract, you don't need to perform this step and can use the version that is already compiled in `build/`.  If the contract is changed, use `npm run compile`.

### Deployment
There are npm scripts setup to deploy to both Ropsten and Mainnet.  Use either `npm run deploy:test` or `npm run deploy:mainnet`.  The addresses of the deployed contracts will be written to `constants/addresses` and the address of the wallet used to be deploy will be set as the contract owner.

### Writing to the smart contract
As v2 of the ABI Encoder is not yet available for production use, this project has been written to work with current Solidity language (v0.4.24)/web3.js (v1.0.0-beta.34) restrictions such as the inability to send/return structs/dynamic-arrays, or define floating-point numbers.

Therefore, it's necessary to define the decimal precisions and property names that correspond to the floating-point numbers in your index model, since they must be converted to integers before writing to the contract.  See the constants defined at the top of `contracts/CurrentRebalance.sol` as well as `constants/floatingPointNames` - there should be a corresponding name in `floatingPointNames` for every constant defined in the contract.  For coverting to integer purposes, remember that plain JS `Number`s are limited to a total of 17 significant digits without introducing rounding errors (this is not currently checked/accounted for).

Strings are defined with the `bytes` type, so be sure to call `web3.utils.fromAscii()` or similar on strings before they are sent into the contract.

Lastly, the integration of your API or hardcoding of the data to provide to the writing methods needs to be added or integrated.  There are stubs for API integration in `setAssetDistributionRows.js` and `setRebalanceMetadata.js`; since our API integration is still in progress, I am hardcoding these values for now.

Once the above is ready and your external file is placed, you can kickoff the update with `npm run update:test` or `npm run update:mainnet` which are just aliases to the update script which performs the network transactions.

### Reading from the smart contract
Reading from the contract is only possible if the contract is in a valid state/not currently updating; all getters restrict read-access to the contract via a modifier.  However, the owner of the contract is not restricted by this modifier for debugging purposes.  There is a public variable `isInValidState` exposed that the client should check before trying to read contract state.  Assuming the contract is in a valid state, the client could then:

- Call the getter for the rebalance metadata
- Call the getter to get the number of constituents in the rebalance
- Call the getters for the URL and md5 fingerprint of the external file
- Iterate over the range of the contituent-count, calling `getAssetDistributionRow()` with each index number to get the full asset distribution out of the (zero-based index) mapping.

Remember that the both `bytes`->string and `uint`->floating-point number conversions (divide by `10**CONSTANT`) should be performed on the values.

Reading the current state of the Altindex model can be done by simply calling the getter methods of the contract at the address as currently defined in `constants/addresses`.

