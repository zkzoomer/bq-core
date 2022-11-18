const { ethers } = require("hardhat");
const { expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const { bqTest } = require("../src/bqTest")
const {
    multipleChoiceRootA,
    multipleChoiceRootB,
    answerHashesA,
    answerHashesB,
    openAnswersRootA,
    openAnswersRootB,
    multipleChoiceAnswersB,
    altOpenAnswersB
} = require('./helpers/testRoots');

const ZERO_ADDY = '0x0000000000000000000000000000000000000000'
const credentialsGainedA = 'Sneed';
const credentialsGainedB = 'Feed';
const credentialsGainedC = 'Seed';
const testURI = 'https://gateway.ipfs.io/ipfs/QmcniBv7UQ4gGPQQW2BwbD4ZZHzN3o3tPuNLZCbBchd1zh'

function shouldBehaveLikeCredentials(owner, newOwner, solver, altSolver, operator, other) {
    context('with solved tests', function () {
        let multipleA, openA, mixedA
        let _1, _2, solverSigner, altSolverSigner

        beforeEach(async function () {
            [_1, _2, solverSigner, altSolverSigner] = await ethers.getSigners();

            // multipleA
            await this.testCreator.createTest(100, 1, 100, 0, 0, [multipleChoiceRootA], ZERO_ADDY, credentialsGainedA, testURI)
            multipleA = await bqTest.solveMode(1, ethers.provider, this.testCreator.address)
            await multipleA.sendSolutionTransaction( solverSigner, this.proofs.proofMultipleA )
            // openA
            await this.testCreator.createTest(0, 3, 1, 0, 0, [openAnswersRootA], ZERO_ADDY, credentialsGainedB, testURI)
            openA = await bqTest.solveMode(2, ethers.provider, this.testCreator.address, answerHashesA)
            await openA.sendSolutionTransaction( solverSigner, this.proofs.proofOpenA )
            // mixedA
            await this.testCreator.createTest(50, 3, 1, 0, 0, [multipleChoiceRootA, openAnswersRootA], ZERO_ADDY, credentialsGainedC, testURI)
            mixedA = await bqTest.solveMode(3, ethers.provider, this.testCreator.address, answerHashesA)
            await mixedA.sendSolutionTransaction( solverSigner, this.proofs.proofMixedA )
        })

        describe('totalSupply', function () {
            it('increases with other users solving the test', async function () {
                expect(await this.credentials.totalSupply())
                    .to.be.bignumber.equal('3')

                await multipleA.sendSolutionTransaction( altSolverSigner, this.proofs.altProofMultipleA )

                expect(await this.credentials.totalSupply())
                    .to.be.bignumber.equal('4')
            })
        })

        describe('credentialReceivers', function () {
            context('when the credentials have not been granted yet', function () {
                it('returns an empty list', async function () {
                    expect(await this.credentials.credentialReceivers('4')).to.deep.equal([])
                })
            })

            context('when the credentials have been granted', function () {
                it('returns a list of the addresses that got a credential', async function () {
                    await multipleA.sendSolutionTransaction( altSolverSigner, this.proofs.altProofMultipleA )
    
                    expect(await this.credentials.credentialReceivers('1'))
                        .to.deep.equal([solver, altSolver])
                })
            })
        })

        describe('receivedCredentials', function () {
            context('when the address did not receive any credentials', function () {
                it('returns an empty list', async function () {
                    expect(await this.credentials.receivedCredentials(altSolver)).to.deep.equal([])
                })
            })

            context('when the address did receive some credentials', function () {
                it('returns the list of credentials it received', async function () {
                    expect((await this.credentials.receivedCredentials(solver)).map(n => { return n.toString() }))
                        .to.deep.equal(['1', '2', '3'])
                })
            })
        })

        describe('getCredential', function () {
            context('when given a nonexistent test', function () {
                it('reverts', async function () {
                    await expectRevert(
                        this.credentials.getCredential('350')
                        ,
                        "Test does not exist"
                    )
                })
            })

            context('when given a valid test', function () {
                it('returns the defined credential', async function () {
                    expect(await this.credentials.getCredential('1'))
                        .to.be.equal(credentialsGainedA)
                    expect(await this.credentials.getCredential('2'))
                        .to.be.equal(credentialsGainedB)
                    expect(await this.credentials.getCredential('3'))
                        .to.be.equal(credentialsGainedC)
                })
            })
        })

        describe('getCredentialType', function () {
            context('when calling for a multiple choice test', function () {
                it('returns 100', async function () {
                    expect(await this.credentials.getCredentialType('1'))
                        .to.be.bignumber.equal('100')
                })
            })

            context('when calling for a open answer test', function () {
                it('returns 0', async function () {
                    expect(await this.credentials.getCredentialType('2'))
                        .to.be.bignumber.equal('0')
                })
            })

            context('when calling for a mixed test', function () {
                it('returns the value of the multiple choice test within', async function () {
                    expect(await this.credentials.getCredentialType('3'))
                        .to.be.bignumber.equal('50')
                })
            })
        })

        describe('getResults', function () {
            context('when a multiple choice credential is gained', function () {
                it('returns 100', async function () {
                    expect(await this.credentials.getResults(solver, '1'))
                        .to.be.bignumber.equal('100')
                })
            })

            context('when an open answer credential is gained', function () {
                it('returns the percentage of correct answers that were given', async function () {
                    // Aced test
                    expect(await this.credentials.getResults(solver, '2'))
                        .to.be.bignumber.equal('100')

                    // Did not ace the test
                    await this.testCreator.createTest(0, 64, 1, 0, 0, [openAnswersRootB], ZERO_ADDY, credentialsGainedB, testURI)
                    const openB = await bqTest.solveMode(4, ethers.provider, this.testCreator.address, answerHashesB)
                    await openB.sendSolutionTransaction( solverSigner, this.proofs.proofOpenB )
                    expect(await this.credentials.getResults(solver, '4'))
                        .to.be.bignumber.equal('96')
                })

                it('reflects the improvement in the credential', async function () {
                    await this.testCreator.createTest(0, 64, 1, 0, 0, [openAnswersRootB], ZERO_ADDY, credentialsGainedB, testURI)
                    const openB = await bqTest.solveMode(4, ethers.provider, this.testCreator.address, answerHashesB)
                    await openB.sendSolutionTransaction( solverSigner, this.proofs.proofOpenB )
                    expect(await this.credentials.getResults(solver, '4'))
                        .to.be.bignumber.equal('96')

                    // Improving upon the solution
                    const altProofOpenB = await openB.generateSolutionProof({ recipient: solver, openAnswers: altOpenAnswersB })
                    await openB.sendSolutionTransaction( solverSigner, altProofOpenB )
                    expect(await this.credentials.getResults(solver, '4'))
                        .to.be.bignumber.equal('100')
                })
            })

            context('when a mixed test credential is gained', function () {
                it('returns the result of doing the exam', async function () {
                    // Aced test
                    expect(await this.credentials.getResults(solver, '3'))
                        .to.be.bignumber.equal('100')

                    // Did not ace the test
                    await this.testCreator.createTest(50, 64, 1, 0, 0, [multipleChoiceRootB, openAnswersRootB], ZERO_ADDY, credentialsGainedC, testURI)
                    const mixedB = await bqTest.solveMode(4, ethers.provider, this.testCreator.address, answerHashesB)
                    await mixedB.sendSolutionTransaction( solverSigner, this.proofs.proofMixedB )
                    expect(await this.credentials.getResults(solver, '4'))
                        .to.be.bignumber.equal('98')
                })

                it('reflects the improvement in the credential', async function () {
                    await this.testCreator.createTest(50, 64, 1, 0, 0, [multipleChoiceRootB, openAnswersRootB], ZERO_ADDY, credentialsGainedC, testURI)
                    const mixedB = await bqTest.solveMode(4, ethers.provider, this.testCreator.address, answerHashesB)
                    await mixedB.sendSolutionTransaction( solverSigner, this.proofs.proofMixedB )
                    expect(await this.credentials.getResults(solver, '4'))
                        .to.be.bignumber.equal('98')

                    // Improving upon the solution
                    const altProofMixedB = await mixedB.generateSolutionProof({ recipient: solver, openAnswers: altOpenAnswersB, multipleChoiceAnswers: multipleChoiceAnswersB })
                    await mixedB.sendSolutionTransaction( solverSigner, altProofMixedB )
                    expect(await this.credentials.getResults(solver, '4'))
                        .to.be.bignumber.equal('100')
                })
            })
        })
    })

    context('with invalidated tests', function () {
        let multipleA, openA, mixedA
        let _1, _2, solverSigner, altSolverSigner

        beforeEach(async function () {
            [_1, _2, solverSigner, altSolverSigner] = await ethers.getSigners();

            // multipleA
            await this.testCreator.createTest(100, 1, 100, 0, 0, [multipleChoiceRootA], ZERO_ADDY, credentialsGainedA, testURI)
            multipleA = await bqTest.solveMode(1, ethers.provider, this.testCreator.address)
            await multipleA.sendSolutionTransaction( solverSigner, this.proofs.proofMultipleA )
            // openA
            await this.testCreator.createTest(0, 3, 1, 0, 0, [openAnswersRootA], ZERO_ADDY, credentialsGainedB, testURI)
            openA = await bqTest.solveMode(2, ethers.provider, this.testCreator.address, answerHashesA)
            await openA.sendSolutionTransaction( solverSigner, this.proofs.proofOpenA )
            // mixedA
            await this.testCreator.createTest(50, 3, 1, 0, 0, [multipleChoiceRootA, openAnswersRootA], ZERO_ADDY, credentialsGainedC, testURI)
            mixedA = await bqTest.solveMode(3, ethers.provider, this.testCreator.address, answerHashesA)
            await mixedA.sendSolutionTransaction( solverSigner, this.proofs.proofMixedA )
        
            this.testCreator.invalidateTest('1', { from: owner })
        })

        describe('totalSupply', function () {
            it('returns the number of valid credentials that were given', async function () {
                expect(await this.credentials.totalSupply())
                    .to.be.bignumber.equal('3')
            })
        })

        describe('credentialReceivers', function () {
            it('returns a list of the addresses that got the deleted credential', async function () {
                expect(await this.credentials.credentialReceivers('1'))
                    .to.deep.equal([solver])
            })
        })

        describe('receivedCredentials', function () {
            it('returns a list of the tokens an address received, including the deleted credential', async function () {
                expect((await this.credentials.receivedCredentials(solver)).map(n => { return n.toString() }))
                    .to.deep.equal(['1', '2', '3'])
            })
        })

        describe('getCredential', function () {
            it('reverts', async function () {
                await expectRevert(
                    this.credentials.getCredential('350')
                    ,
                    "Test does not exist"
                )
            })
        })

        describe('getCredentialType', function () {
            it('reverts', async function () {
                await expectRevert(
                    this.credentials.getCredentialType('350')
                    ,
                    "Test does not exist"
                )
            })
        })
    })
}

module.exports = {
    shouldBehaveLikeCredentials
}