const fs = require('fs');
const path = require('path');
const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());

// See open issue for more info on the .replace() getting called on the .toAscii()s here
// https://github.com/ethereum/web3.js/issues/337#issuecomment-197750774
const { toAscii, fromAscii } = web3.utils;

const gas = '1000000';
const source = fs.readFileSync(path.resolve(__dirname, '..', 'build', 'CurrentRebalance.json'), 'utf8');
const CurrentRebalance = JSON.parse(source);
let rebalance;
let accounts;
let methods;
beforeEach(async () => {
  accounts = await web3.eth.getAccounts();

  rebalance = await new web3.eth.Contract(JSON.parse(CurrentRebalance.interface))
    .deploy({ data: CurrentRebalance.bytecode })
    .send({ from: accounts[0], gas: '5000000' });

  methods = rebalance.methods;
});

describe('CurrentRebalance Contract', () => {
  it('deploys a contract', () => {
    assert.ok(rebalance.options.address);
  });

  describe('constructor()', () => {
    it('sets the owner of the contract correctly', async () => {
      const owner = await methods.owner().call();

      assert.equal(accounts[0], owner);
    });

    it('defaults to the correct contract state', async () => {
      const isInValidState = await methods.isInValidState().call();

      assert.equal(isInValidState, false);
    });
  });

  describe('initiateUpdate()', () => {
    describe('modifiers', () => {
      it('is only callable by the owner', async () => {
          try {
            await methods.initiateUpdate().send({
              from: accounts[1],
              gas
            });

            assert(false)
          } catch (err) {
            assert.ok(err);
          }
      });
    });

    describe('implementation', () => {
      beforeEach(async () => {
        await methods.initiateUpdate().send({
          from: accounts[0],
          gas
        });
      });

      it('sets contract state variables correctly', async () => {
        const isInValidState = await methods.isInValidState().call();

        assert.equal(isInValidState, false);
      });

      it('clears an existing asset distribution, resets constituent count, sets state flags', async () => {
        let constituentCount;
        let assetDistribution;

        await methods.setAssetDistributionRow(
          0,
          fromAscii('BTC'),
          fromAscii('Bitcoin'),
          123,
          456,
        ).send({
          from: accounts[0],
          gas
        });

        await methods.concludeSuccessfulUpdate().send({
          from: accounts[0],
          gas
        });

        constituentCount = await methods.getConstituentCount().call();
        assetDistributionMember = await methods.getAssetDistributionRow(0).call();

        assert.equal(constituentCount, 1);
        assert.equal(toAscii(assetDistributionMember[1]).replace(/\u0000/g, ''), 'Bitcoin');

        await methods.initiateUpdate().send({
          from: accounts[0],
          gas
        });

        constituentCount = await methods.getConstituentCount().call();
        assetDistributionMember = await methods.getAssetDistributionRow(0).call();

        assert.equal(constituentCount, 0);
        assert.equal(assetDistributionMember[1], null);
      });
    });
  });

  describe('setAssetDistributionRow', () => {
    describe('modifiers', () => {
      it('is only callable by the owner', async () => {
        await methods.initiateUpdate().send({
          from: accounts[0],
          gas,
        });

        try {
          await methods.setAssetDistributionRow(
            0, fromAscii('A'), fromAscii('Acoin'), 1, 2
          ).send({
            from: accounts[1],
            gas
          });
          assert(false);
        } catch (err) {
          assert.ok(err);
        }
      });

      it('is only callable when contract is in update mode', async () => {
        try {
          await methods.setAssetDistributionRow(
            0, fromAscii('A'), fromAscii('Acoin'), 1, 2
          ).send({
            from: accounts[1],
            gas
          });
          assert(false);
        } catch (err) {
          assert.ok(err);
        }
      });
    });

    describe('implementation', () => {
      beforeEach(async () => {
        await methods.initiateUpdate().send({
          from: accounts[0],
          gas,
        });
      });

      it('creates a valid AssetDistributionItem instance, sets it in mapping and updates constituent count', async () => {
        await methods.setAssetDistributionRow(
          0,
          fromAscii('BTC'),
          fromAscii('Bitcoin'),
          121,
          212
        ).send({
          from: accounts[0],
          gas,
        });

        const row = await methods.getAssetDistributionRow(0).call();
        assert.ok(row);
        assert.equal(toAscii(row[0]).replace(/\u0000/g, ''), 'BTC');
        assert.equal(toAscii(row[1]).replace(/\u0000/g, ''), 'Bitcoin');
        assert.equal(row[2], 121);
        assert.equal(row[3], 212);

        const constituentCount = await methods.getConstituentCount().call();
        assert.equal(constituentCount, 1);
      });
    });
  });

  describe('getAssetDistributionRow', () => {
    describe('modifiers', () => {
      it('is only callable if contract is readable', async () => {
        await methods.initiateUpdate().send({
          from: accounts[0],
          gas,
        });

        await methods.setAssetDistributionRow(
          0, fromAscii('A'), fromAscii('Acoin'), 1, 2
        ).send({
          from: accounts[0],
          gas
        });

        try {
          await methods.getAssetDistributionRow(0).call({
            from: accounts[1]
          });
          assert(false);
        } catch (err) {
          assert.ok(err);
        }
      });

      it('is callable if contract is marked unreadable but is called by owner', async () => {
        await methods.initiateUpdate().send({
          from: accounts[0],
          gas,
        });

        await methods.setAssetDistributionRow(
          0, fromAscii('A'), fromAscii('Acoin'), 1, 2
        ).send({
          from: accounts[0],
          gas
        });

        const row = await methods.getAssetDistributionRow(0).call({
          from: accounts[0]
        });

        assert.ok(row);
        assert.equal(toAscii(row[0]).replace(/\u0000/g, ''), 'A');
      });
    });

    describe('implementation', () => {
      beforeEach(async () => {
        await methods.initiateUpdate().send({
          from: accounts[0],
          gas,
        });
      });

      it('returns a tuple in the correct form', async () => {
        await methods.setAssetDistributionRow(
          0,
          fromAscii('BTC'),
          fromAscii('Bitcoin'),
          121,
          212
        ).send({
          from: accounts[0],
          gas,
        });

        await methods.concludeSuccessfulUpdate().send({
          from: accounts[0],
          gas
        });

        const row = await methods.getAssetDistributionRow(0).call({
          from: accounts[1],
        });

        assert.ok(row);
        assert.equal(toAscii(row[0]).replace(/\u0000/g, ''), 'BTC');
        assert.equal(toAscii(row[1]).replace(/\u0000/g, ''), 'Bitcoin');
        assert.equal(row[2], 121);
        assert.equal(row[3], 212);

        const constituentCount = await methods.getConstituentCount().call();
        assert.equal(constituentCount, 1);
      });
    });
  });

  describe('get/setRebalanceMetadata', () => {
    describe('modifiers', () => {
      it('is only callable by the owner', async () => {
        await methods.initiateUpdate().send({
          from: accounts[0],
          gas,
        });

        try {
          await methods.setRebalanceMetadata(
            0, 1, 2, 3, 4, 5, 6
          ).send({
            from: accounts[1],
            gas
          });
          assert(false);
        } catch (err) {
          assert.ok(err);
        }
      });

      it('is only callable when contract is in update mode', async () => {
        try {
          await methods.setRebalanceMetadata(
            0, 1, 2, 3, 4, 5, 6
          ).send({
            from: accounts[1],
            gas
          });
          assert(false);
        } catch (err) {
          assert.ok(err);
        }
      });
    });

    describe('implementation', () => {
      beforeEach(async () => {
        await methods.initiateUpdate().send({
          from: accounts[0],
          gas,
        });
      });

      it('creates a valid rebalanceMetadata instance', async () => {
        await methods.setRebalanceMetadata(
          0, 1, 2, 3, 4, 5, 6, 7
        ).send({
          from: accounts[0],
          gas,
        });

        const data = await methods.getRebalanceMetadata().call();
        assert.ok(data);
        assert.equal(data[0], 0);
        assert.equal(data[1], 1);
        assert.equal(data[2], 2);
        assert.equal(data[3], 3);
        assert.equal(data[4], 4);
        assert.equal(data[5], 5);
        assert.equal(data[6], 6);
        assert.equal(data[7], 7);
      });
    });
  });

  describe('concludeSuccessfulUpdate()', () => {
    describe('modifiers', () => {
      it('is only callable by the owner', async () => {
        await methods.initiateUpdate().send({
          from: accounts[0],
          gas,
        });

        try {
          await methods.concludeSuccessfulUpdate().send({
            from: accounts[1],
            gas
          });
          assert(false);
        } catch (err) {
          assert.ok(err);
        }
      });

      it('is only callable when contract is in update mode', async () => {
        try {
          await methods.concludeSuccessfulUpdate().send({
            from: accounts[0],
            gas,
          });
          assert(false);
        } catch (err) {
          assert.ok(err);
        }
      });
    });

    describe('implementation', () => {
      it('sets state correctly', async () => {
        await methods.initiateUpdate().send({
          from: accounts[0],
          gas,
        });

        await methods.concludeSuccessfulUpdate().send({
          from: accounts[0],
          gas,
        });

        const isInValidState = await methods.isInValidState().call();

        assert.equal(isInValidState, true)
      });
    });
  });

  describe('concludeUnsuccessfulUpdate()', () => {
    describe('modifiers', () => {
      it('is only callable by the owner', async () => {
        await methods.initiateUpdate().send({
          from: accounts[0],
          gas,
        });

        try {
          await methods.concludeUnsuccessfulUpdate().send({
            from: accounts[1],
            gas
          });
          assert(false);
        } catch (err) {
          assert.ok(err);
        }
      });

      it('is only callable when contract is in update mode', async () => {
        try {
          await methods.concludeUnsuccessfulUpdate().send({
            from: accounts[0],
            gas,
          });
          assert(false);
        } catch (err) {
          assert.ok(err);
        }
      });
    });

    describe('implementation', () => {
      it('sets state correctly', async () => {
        await methods.initiateUpdate().send({
          from: accounts[0],
          gas,
        });

        await methods.concludeUnsuccessfulUpdate().send({
          from: accounts[0],
          gas,
        });

        const isInValidState = await methods.isInValidState().call();
        assert.equal(isInValidState, false)
      });
    });
  });

  describe('setDocumentHash()', () => {
    describe('modifiers', () => {
      it('is only callable by the owner', async () => {
        await methods.initiateUpdate().send({
          from: accounts[0],
          gas,
        });

        try {
          await methods.setDocumentHash(
            '123abc'
          ).send({
            from: accounts[1],
            gas
          });
          assert(false);
        } catch (err) {
          assert.ok(err);
        }
      });

      it('is only callable when contract is in update mode', async () => {
        try {
          await methods.setDocumentHash(
            '123abc'
          ).send({
            from: accounts[1],
            gas
          });
          assert(false);
        } catch (err) {
          assert.ok(err);
        }
      });
    });

    describe('implementation', () => {
      it('sets the document hash', async () => {
        await methods.initiateUpdate().send({
          from: accounts[0],
          gas,
        });

        await methods.setDocumentHash(fromAscii('321zyx')).send({
          from: accounts[0],
          gas,
        });

        const hash = await methods.getDocumentHash().call();

        assert.equal(toAscii(hash).replace(/\u0000/g, ''), '321zyx');
      });
    });
  });

  describe('setDocumentUrl()', () => {
    describe('modifiers', () => {
      it('is only callable by the owner', async () => {
        await methods.initiateUpdate().send({
          from: accounts[0],
          gas,
        });

        try {
          await methods.setDocumentUrl(
            fromAscii('http://whatever')
          ).send({
            from: accounts[1],
            gas
          });
          assert(false);
        } catch (err) {
          assert.ok(err);
        }
      });

      it('is only callable when contract is in update mode', async () => {
        try {
          await methods.setDocumentUrl(
            fromAscii('http://whatever')
          ).send({
            from: accounts[1],
            gas
          });
          assert(false);
        } catch (err) {
          assert.ok(err);
        }
      });
    });

    describe('implementation', () => {
      it('sets the document hash', async () => {
        await methods.initiateUpdate().send({
          from: accounts[0],
          gas,
        });

        await methods.setDocumentUrl(
          fromAscii('http://whatever')
        ).send({
          from: accounts[0],
          gas,
        });

        const url = await methods.getDocumentUrl().call();

        assert.equal(toAscii(url).replace(/\u0000/g, ''), 'http://whatever');
      });
    });
  });
});
