const { ethers } = require("hardhat");
const { expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const { shouldSupportInterfaces } = require("./SupportsInterface.behavior");
const { bqTest } = require("../src/bqTest")
const {
    multipleChoiceRoot,
    answerHashesA,
    openAnswersRootA,
} = require('./helpers/testRoots');

const ZERO_ADDY = '0x0000000000000000000000000000000000000000'
const credentialsGained = 'The Tools You Need'
const testURI = 'https://gateway.ipfs.io/ipfs/QmcniBv7UQ4gGPQQW2BwbD4ZZHzN3o3tPuNLZCbBchd1zh'

function shouldBehaveLikeERC721 (approveRevertMessage, transferRevertMessage, owner, newOwner, solver, altSolver, operator, other) {
    shouldSupportInterfaces([
        'ERC165',
        'ERC721',
    ]);

    context('with minted tokens', function () {
        let multipleA, openA, mixedA
        let _1, _2, solverSigner, altSolverSigner

        beforeEach(async function () {
            [_1, _2, solverSigner, altSolverSigner] = await ethers.getSigners();

            // multipleA
            await this.testCreator.createTest(100, 1, 100, 0, 0, [multipleChoiceRoot], ZERO_ADDY, credentialsGained, testURI)
            multipleA = await bqTest.solveMode(1, ethers.provider, this.testCreator.address)
            await multipleA.sendSolutionTransaction( solverSigner, this.proofs.proofMultiple )
            // openA
            await this.testCreator.createTest(0, 3, 1, 0, 0, [openAnswersRootA], ZERO_ADDY, credentialsGained, testURI)
            openA = await bqTest.solveMode(2, ethers.provider, this.testCreator.address, answerHashesA)
            await openA.sendSolutionTransaction( solverSigner, this.proofs.proofOpenA )
            // mixedA
            await this.testCreator.createTest(50, 3, 1, 0, 0, [multipleChoiceRoot, openAnswersRootA], ZERO_ADDY, credentialsGained, testURI)
            mixedA = await bqTest.solveMode(3, ethers.provider, this.testCreator.address, answerHashesA)
            await mixedA.sendSolutionTransaction( solverSigner, this.proofs.proofMixedA )
        })

        describe('balanceOf', function () {
            context('when the given address owns some tokens', function () {
                it('returns the amount of tokens owned by the given address', async function () {
                    expect(await this.testCreator.balanceOf(owner)).to.be.bignumber.equal('3');
                    expect(await this.credentials.balanceOf(solver)).to.be.bignumber.equal('3');
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
                        this.token.balanceOf(ZERO_ADDY), 'ERC721: balance query for the zero address',
                    );
                });
            });
        })

        describe('ownerOf', function () {
            context('when the given token ID was tracked by this token', function () {
                it('returns the owner of the given token ID', async function () {
                    expect(await this.token.ownerOf('1')).to.be.equal(owner);
                });
            });
        
            context('when the given token ID was not tracked by this token', function () {
                it('reverts', async function () {
                    await expectRevert(
                        this.token.ownerOf('350'), "Test does not exist",
                    );
                });
            });
        });

        describe('transfers', function () {
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
        })

        describe('getApproved', async function () {
            it('returns the zero address', async function () {
                expect(await this.token.getApproved('1')).to.be.equal(
                    ZERO_ADDY,
                )
            })
        });
        
        describe('isApprovedForAll', async function () {
            it('returns false', async function () {
                expect(await this.token.isApprovedForAll(owner, operator)).to.be.false
            })
        });
    })
}

function shouldBehaveLikeERC721Enumerable (errorPrefix, owner, newOwner, solver, altSolver, operator, other) {
    shouldSupportInterfaces([
        'ERC721Enumerable',
    ]);

    context('with minted tokens', function () {
        let multipleA, openA, mixedA
        let _1, _2, solverSigner, altSolverSigner
        
        beforeEach(async function () {
            [_1, _2, solverSigner, altSolverSigner] = await ethers.getSigners();

            // multipleA
            await this.testCreator.createTest(100, 1, 100, 0, 0, [multipleChoiceRoot], ZERO_ADDY, credentialsGained, testURI)
            multipleA = await bqTest.solveMode(1, ethers.provider, this.testCreator.address)
            await multipleA.sendSolutionTransaction( solverSigner, this.proofs.proofMultiple )
            // openA
            await this.testCreator.createTest(0, 3, 1, 0, 0, [openAnswersRootA], ZERO_ADDY, credentialsGained, testURI)
            openA = await bqTest.solveMode(2, ethers.provider, this.testCreator.address, answerHashesA)
            await openA.sendSolutionTransaction( solverSigner, this.proofs.proofOpenA )
            // mixedA
            await this.testCreator.createTest(50, 3, 1, 0, 0, [multipleChoiceRoot, openAnswersRootA], ZERO_ADDY, credentialsGained, testURI)
            mixedA = await bqTest.solveMode(3, ethers.provider, this.testCreator.address, answerHashesA)
            await mixedA.sendSolutionTransaction( solverSigner, this.proofs.proofMixedA )
        })

        describe('totalSupply', function () {
                it('returns total token supply', async function () {
                    expect(await this.token.totalSupply()).to.be.bignumber.equal('3');
                });
        });

        describe('tokenOfOwnerByIndex', function () {
            describe('when the given index is lower than the amount of tokens owned by the given address', function () {
                it('returns the token ID placed at the given index', async function () {
                    expect(await this.testCreator.tokenOfOwnerByIndex(owner, 0)).to.be.bignumber.equal('1');
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
                    [0, 1, 2].map(i => this.token.tokenByIndex(i)),
                );
                expect(tokensListed.map(t => t.toNumber())).to.have.members(
                    [1, 2, 3]
                );
            })

            it('reverts if index is greater than supply', async function () {
                await expectRevert(
                    this.testCreator.tokenByIndex(6), 'Index out of bounds',
                );
            });
        });
    })
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
                await this.testCreator.createTest(100, 1, 100, 0, 0, [multipleChoiceRoot], ZERO_ADDY, credentialsGained, testURI)
                await this.testCreator.createTest(0, 3, 1, 0, 0, [openAnswersRootA], ZERO_ADDY, credentialsGained, testURI)
                await this.testCreator.createTest(50, 3, 1, 0, 0, [multipleChoiceRoot, openAnswersRootA], ZERO_ADDY, credentialsGained, testURI)
            });
    
            it('return the given URI', async function () {
                expect(await this.token.tokenURI('1')).to.be.equal(testURI);
                expect(await this.token.tokenURI('2')).to.be.equal(testURI);
                expect(await this.token.tokenURI('3')).to.be.equal(testURI);
            });
        
            it('reverts when queried for non existent token id', async function () {
                await expectRevert(
                    this.token.tokenURI('350'), 'Test does not exist',
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
