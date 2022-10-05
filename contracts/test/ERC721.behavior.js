const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const poseidon = require("./utils/poseidon.js");
const poseidonMerkle = require('./utils/poseidonMerkle.js');
const keccak256 = require('keccak256')
const { ZERO_ADDRESS } = constants;

const { shouldSupportInterfaces } = require('./SupportsInterface.behavior');

const firstTokenId = new BN('1');
const secondTokenId = new BN('2');
const nonExistentTokenId = new BN('10');

const testURI = 'https://exampletest.io';
const timeLimit = "4294967295";
const credentialLimit = "16777215";
const requiredPass = ZERO_ADDRESS;
const credentialsGained = 'Test verified';
const prize = web3.utils.toWei('1', 'ether');

// Multiple choice test
const solutionHashA = '10483540708739576660440356112223782712680507694971046950485797346645134034053';  // All answers are A (1)
const solutionHashB = '376708155208532431192009293373440944809805944505313670183499188700119115952';  // All answers are B (2)

// Open asnwers test
const answerHashesA = [
    poseidon([BigInt('0x' + keccak256("sneed's").toString('hex'))]), 
    poseidon([BigInt('0x' + keccak256('feed').toString('hex'))]),
    poseidon([BigInt('0x' + keccak256('seed').toString('hex'))])
]
const answerHashesB = new Array(64).fill(
    poseidon([BigInt('0x' + keccak256("deenz").toString('hex'))])
);

const _answerHashesA = Array(64).fill(
  poseidon([BigInt('0x' + keccak256("").toString('hex'))])
);
_answerHashesA[0] = poseidon([BigInt('0x' + keccak256("sneed's").toString('hex'))])
_answerHashesA[1] = poseidon([BigInt('0x' + keccak256('feed').toString('hex'))])
_answerHashesA[2] = poseidon([BigInt('0x' + keccak256('seed').toString('hex'))])

const answerHashesA_root = poseidonMerkle.rootFromLeafArray(_answerHashesA)
const answerHashesB_root = poseidonMerkle.rootFromLeafArray(answerHashesB)

// Multiple choice tests
const multipleProofA = require("./proof/multiple/multipleProofA.json")
const multiplePublicA = require("./proof/multiple/multiplePublicA.json")
const multipleProofB = require("./proof/multiple/multipleProofB.json")
const multiplePublicB = require("./proof/multiple/multiplePublicB.json")

// Open answer tests
const openProofA = require("./proof/open/openProofA.json")
const openPublicA = require("./proof/open/openPublicA.json")
const openProofB = require("./proof/open/openProofB.json")
const openPublicB = require("./proof/open/openPublicB.json")

// Mixed tests
const mixedProofA = require("./proof/mixed/mixedProofA.json")
const mixedPublicA = require("./proof/mixed/mixedPublicA.json")
const mixedProofB = require("./proof/mixed/mixedProofB.json")
const mixedPublicB = require("./proof/mixed/mixedPublicB.json")

function shouldBehaveLikeERC721 (approveRevertMessage, transferRevertMessage, owner, newOwner, solver, altSolver, operator, other) {
  shouldSupportInterfaces([
    'ERC165',
    'ERC721',
  ]);

  const solveTest = async (testContract, tokenId, proof, input, caller = solver) => {
    await testContract.solveTest(
        tokenId,
        [proof.pi_a[0], proof.pi_a[1]],
        [[proof.pi_b[0][1], proof.pi_b[0][0]], [proof.pi_b[1][1], proof.pi_b[1][0]]],
        [proof.pi_c[0], proof.pi_c[1]],
        input,
        { from: caller }
    )
  }

  context('with minted tokens', function () {
    beforeEach(async function () {
      await this.testCreator.createTest(
        200, 1, 100, credentialLimit, timeLimit, [solutionHashA], requiredPass, credentialsGained, testURI,
        { from: owner, value: prize }
      );
      await this.testCreator.createTest(
        200, 1, 100, credentialLimit, timeLimit, [solutionHashB], requiredPass, credentialsGained, testURI,
        { from: owner, value: prize }
      );
      await this.testCreator.createTest(
        100, 3, 1, credentialLimit, timeLimit, [answerHashesA_root], requiredPass, credentialsGained, testURI,
        { from: owner, value: prize }
      )
      await this.testCreator.createTest(
        100, 64, 1, credentialLimit, timeLimit, [answerHashesB_root], requiredPass, credentialsGained, testURI,
        { from: owner, value: prize }
      )
      await this.testCreator.createTest(
        50, 3, 1, credentialLimit, timeLimit, [solutionHashA, answerHashesA_root], requiredPass, credentialsGained, testURI,
        { from: owner, value: prize }
      )
      await this.testCreator.createTest(
        50, 64, 1, credentialLimit, timeLimit, [solutionHashB, answerHashesB_root], requiredPass, credentialsGained, testURI,
        { from: owner, value: prize }
      )

      // Solving these tests
      await solveTest(this.testCreator, '1', multipleProofA, multiplePublicA)
      await solveTest(this.testCreator, '2', multipleProofB, multiplePublicB)
      await solveTest(this.testCreator, '3', openProofA, openPublicA)
      await solveTest(this.testCreator, '4', openProofB, openPublicB)
      await solveTest(this.testCreator, '5', mixedProofA, mixedPublicA)
      await solveTest(this.testCreator, '6', mixedProofB, mixedPublicB)
    });

    describe('balanceOf', function () {
      context('when the given address owns some tokens', function () {
        it('returns the amount of tokens owned by the given address', async function () {
          expect(await this.testCreator.balanceOf(owner)).to.be.bignumber.equal('6');
          expect(await this.credentials.balanceOf(solver)).to.be.bignumber.equal('6');
        });
      });

      context('when the given address does not own any tokens', function () {
        it('returns 0', async function () {
          expect(await this.token.balanceOf(other)).to.be.bignumber.equal('0');
        });
      });

      context('when querying the zero address', function () {
        it('throws', async function () {
          await expectRevert(
            this.token.balanceOf(ZERO_ADDRESS), 'ERC721: balance query for the zero address',
          );
        });
      });
    });

    describe('ownerOf', function () {
      context('when the given token ID was tracked by this token', function () {
        const tokenId = firstTokenId;

        it('returns the owner of the given token ID', async function () {
          expect(await this.token.ownerOf(tokenId)).to.be.equal(owner);
        });
      });

      context('when the given token ID was not tracked by this token', function () {
        const tokenId = nonExistentTokenId;

        it('reverts', async function () {
          await expectRevert(
            this.token.ownerOf(tokenId), 'ERC721: owner query for nonexistent token',
          );
        });
      });
    });

    describe('transfers', function () {
      const tokenId = firstTokenId;
      const data = '0x42';

      it('cannot transfer tests', async function () {
        await expectRevert(
            this.token.transferFrom(owner, newOwner, 1, { from: owner })
            ,
            transferRevertMessage
        )
        await expectRevert(
            this.token.safeTransferFrom(owner, newOwner, 1, { from: owner })
            ,
            transferRevertMessage
        )

        // Other callers get the same message
        await expectRevert(
            this.token.transferFrom(owner, newOwner, 1, { from: newOwner })
            ,
            transferRevertMessage
        )
        await expectRevert(
            this.token.safeTransferFrom(owner, newOwner, 1, { from: newOwner })
            ,
            transferRevertMessage
        )
      });

      it('cannot approve another address to transfer tokens', async function () {
          await expectRevert(
              this.token.approve(other, 1, { from: owner })
              ,
              approveRevertMessage
          )
          await expectRevert(
              this.token.setApprovalForAll(other, true, { from: owner })
              ,
              approveRevertMessage
          )

          // Other callers get the same message
          await expectRevert(
              this.token.approve(other, 1, { from: newOwner })
              ,
              approveRevertMessage
          )
          await expectRevert(
              this.token.setApprovalForAll(other, true, { from: newOwner })
              ,
              approveRevertMessage
          )
      })
    });
  });

  describe('getApproved', async function () {
    it('returns the zero address', async function () {
      expect(await this.token.getApproved(firstTokenId)).to.be.equal(
        ZERO_ADDRESS,
      )
    })
  });

  describe('isApprovedForAll', async function () {
    it('returns false', async function () {
      expect(await this.token.isApprovedForAll(owner, operator)).to.be.false
    })
  });
}

function shouldBehaveLikeERC721Enumerable (errorPrefix, owner, newOwner, solver, altSolver, operator, other) {
  shouldSupportInterfaces([
    'ERC721Enumerable',
  ]);

  const solveTest = async (testContract, tokenId, proof, input, caller = solver) => {
    await testContract.solveTest(
        tokenId,
        [proof.pi_a[0], proof.pi_a[1]],
        [[proof.pi_b[0][1], proof.pi_b[0][0]], [proof.pi_b[1][1], proof.pi_b[1][0]]],
        [proof.pi_c[0], proof.pi_c[1]],
        input,
        { from: caller }
    )
  }

  context('with minted tokens', function () {
    beforeEach(async function () {
      await this.testCreator.createTest(
        200, 1, 100, credentialLimit, timeLimit, [solutionHashA], requiredPass, credentialsGained, testURI,
        { from: owner, value: prize }
      );
      await this.testCreator.createTest(
        200, 1, 100, credentialLimit, timeLimit, [solutionHashB], requiredPass, credentialsGained, testURI,
        { from: owner, value: prize }
      );
      await this.testCreator.createTest(
        100, 3, 1, credentialLimit, timeLimit, [answerHashesA_root], requiredPass, credentialsGained, testURI,
        { from: owner, value: prize }
      )
      await this.testCreator.createTest(
        100, 64, 1, credentialLimit, timeLimit, [answerHashesB_root], requiredPass, credentialsGained, testURI,
        { from: owner, value: prize }
      )
      await this.testCreator.createTest(
        50, 3, 1, credentialLimit, timeLimit, [solutionHashA, answerHashesA_root], requiredPass, credentialsGained, testURI,
        { from: owner, value: prize }
      )
      await this.testCreator.createTest(
        50, 64, 1, credentialLimit, timeLimit, [solutionHashB, answerHashesB_root], requiredPass, credentialsGained, testURI,
        { from: owner, value: prize }
      )

      // Solving these tests
      await solveTest(this.testCreator, '1', multipleProofA, multiplePublicA)
      await solveTest(this.testCreator, '2', multipleProofB, multiplePublicB)
      await solveTest(this.testCreator, '3', openProofA, openPublicA)
      await solveTest(this.testCreator, '4', openProofB, openPublicB)
      await solveTest(this.testCreator, '5', mixedProofA, mixedPublicA)
      await solveTest(this.testCreator, '6', mixedProofB, mixedPublicB)
    });

    describe('totalSupply', function () {
      it('returns total token supply', async function () {
        expect(await this.token.totalSupply()).to.be.bignumber.equal('6');
      });
    });

    describe('tokenOfOwnerByIndex', function () {
      describe('when the given index is lower than the amount of tokens owned by the given address', function () {
        it('returns the token ID placed at the given index', async function () {
          expect(await this.testCreator.tokenOfOwnerByIndex(owner, 0)).to.be.bignumber.equal(firstTokenId);
        });
      });

      describe('when the index is greater than or equal to the total tokens owned by the given address', function () {
        it('reverts', async function () {
          await expectRevert(
            this.testCreator.tokenOfOwnerByIndex(owner, 7), 'Index out of bounds',
          );
        });
      });

      describe('when the given address does not own any token', function () {
        it('reverts', async function () {
          await expectRevert(
            this.testCreator.tokenOfOwnerByIndex(other, 0), 'Index out of bounds',
          );
        });
      });

    });

    describe('tokenByIndex', function () {
      it('returns all tokens', async function () {
        const tokensListed = await Promise.all(
          [0, 1, 2, 3, 4, 5].map(i => this.token.tokenByIndex(i)),
        );
        expect(tokensListed.map(t => t.toNumber())).to.have.members(
          [1,2,3,4,5,6]
        );
      });

      it('reverts if index is greater than supply', async function () {
        await expectRevert(
          this.testCreator.tokenByIndex(6), 'Index out of bounds',
        );
      });

    });
  });

}

function shouldBehaveLikeERC721Metadata (errorPrefix, name, symbol, owner) {
  shouldSupportInterfaces([
    'ERC721Metadata',
  ]);

  describe('metadata', function () {
    it('has a name', async function () {
      expect(await this.token.name()).to.be.equal(name);
    });

    it('has a symbol', async function () {
      expect(await this.token.symbol()).to.be.equal(symbol);
    });

    describe('token URI', function () {
      beforeEach(async function () {
        await this.testCreator.createTest(
          200, 1, 100, credentialLimit, timeLimit, [solutionHashA], requiredPass, credentialsGained, testURI,
          { from: owner, value: prize }
        )
        await this.testCreator.createTest(
          100, 3, 1, credentialLimit, timeLimit, [answerHashesA_root], requiredPass, credentialsGained, testURI,
          { from: owner, value: prize }
        )
        await this.testCreator.createTest(
          50, 3, 1, credentialLimit, timeLimit, [solutionHashA, answerHashesA_root], requiredPass, credentialsGained, testURI,
          { from: owner, value: prize }
        )
      });

      it('return the given URI', async function () {
        expect(await this.token.tokenURI('1')).to.be.equal(testURI);
        expect(await this.token.tokenURI('2')).to.be.equal(testURI);
        expect(await this.token.tokenURI('3')).to.be.equal(testURI);
      });

      it('reverts when queried for non existent token id', async function () {
        await expectRevert(
          this.token.tokenURI(nonExistentTokenId), 'Test does not exist',
        );
      });

    });
  });
}

module.exports = {
  shouldBehaveLikeERC721,
  shouldBehaveLikeERC721Enumerable,
  shouldBehaveLikeERC721Metadata,
};