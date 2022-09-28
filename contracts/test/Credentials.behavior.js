const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const poseidon = require("./utils/poseidon.js");
const poseidonMerkle = require('./utils/poseidonMerkle.js');
const keccak256 = require('keccak256')
const { ZERO_ADDRESS } = constants;

const firstTokenId = new BN('1');
const secondTokenId = new BN('2');
const thirdTokenId = new BN('3');
const nonExistentTokenId = new BN('10');

const testURI = 'https://deenz.dev';
const timeLimit = "4294967295";
const credentialLimit = "16777215";
const requiredPass = ZERO_ADDRESS;
const credentialsGainedA = 'Multiple verified';
const credentialsGainedB = 'Open verified';
const credentialsGainedC = 'Mixed verified';
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
const altMultipleProofA = require("./proof/multiple/altMultipleProofA.json")
const altMultiplePublicA = require("./proof/multiple/altMultiplePublicA.json")
const multipleProofB = require("./proof/multiple/multipleProofB.json")
const multiplePublicB = require("./proof/multiple/multiplePublicB.json")
const altMultipleProofB = require("./proof/multiple/altMultipleProofA.json")
const altMultiplePublicB = require("./proof/multiple/altMultiplePublicA.json")

// Open answer tests
const openProofA = require("./proof/open/openProofA.json")
const openPublicA = require("./proof/open/openPublicA.json")
const altOpenProofA = require("./proof/open/altOpenProofA.json")
const altOpenPublicA = require("./proof/open/altOpenPublicA.json")
const openProofB = require("./proof/open/openProofB.json")
const openPublicB = require("./proof/open/openPublicB.json")
const altOpenProofB = require("./proof/open/altOpenProofB.json")
const altOpenPublicB = require("./proof/open/altOpenPublicB.json")

// Mixed tests
const mixedProofA = require("./proof/mixed/mixedProofA.json")
const mixedPublicA = require("./proof/mixed/mixedPublicA.json")
const altMixedProofA = require("./proof/mixed/altMixedProofA.json")
const altMixedPublicA = require("./proof/mixed/altMixedPublicA.json")
const mixedProofB = require("./proof/mixed/mixedProofB.json")
const mixedPublicB = require("./proof/mixed/mixedPublicB.json")
const altMixedProofB = require("./proof/mixed/altMixedProofB.json")
const altMixedPublicB = require("./proof/mixed/altMixedPublicB.json")

function shouldBehaveLikeCredentials(owner, newOwner, solver, altSolver, operator, other) {
    context('with solved tests', function () {
        beforeEach(async function () {
            await this.testCreator.createTest(
                0, credentialLimit, timeLimit, [solutionHashA], requiredPass, credentialsGainedA, testURI,
                { from: owner, value: prize }
            );
            await this.testCreator.createTest(
                1, credentialLimit, timeLimit, [answerHashesA_root], requiredPass, credentialsGainedB, testURI,
                { from: owner, value: prize }
            )
            await this.testCreator.createTest(
                2, credentialLimit, timeLimit, [solutionHashA, answerHashesA_root], requiredPass, credentialsGainedC, testURI,
                { from: owner, value: prize }
            )
        
            // Solving these tests
            await this.testCreator.solveTest(
                '1',
                [multipleProofA.pi_a[0], multipleProofA.pi_a[1]],
                [[multipleProofA.pi_b[0][1], multipleProofA.pi_b[0][0]], [multipleProofA.pi_b[1][1], multipleProofA.pi_b[1][0]]],
                [multipleProofA.pi_c[0], multipleProofA.pi_c[1]],
                multiplePublicA,
                { from: solver }
            )
            await this.testCreator.solveTest(
                '2',
                [openProofA.pi_a[0], openProofA.pi_a[1]],
                [[openProofA.pi_b[0][1], openProofA.pi_b[0][0]], [openProofA.pi_b[1][1], openProofA.pi_b[1][0]]],
                [openProofA.pi_c[0], openProofA.pi_c[1]],
                openPublicA,
                { from: solver }
            )
            await this.testCreator.solveTest(
                '3',
                [mixedProofA.pi_a[0], mixedProofA.pi_a[1]],
                [[mixedProofA.pi_b[0][1], mixedProofA.pi_b[0][0]], [mixedProofA.pi_b[1][1], mixedProofA.pi_b[1][0]]],
                [mixedProofA.pi_c[0], mixedProofA.pi_c[1]],
                mixedPublicA,
                { from: solver }
            )
        })

        describe('totalSupply', function () {
            it('increases with other users solving the test', async function () {
                expect(await this.credentials.totalSupply())
                    .to.be.bignumber.equal('3')

                await this.testCreator.solveTest(
                    '1',
                    [altMultipleProofA.pi_a[0], altMultipleProofA.pi_a[1]],
                    [[altMultipleProofA.pi_b[0][1], altMultipleProofA.pi_b[0][0]], [altMultipleProofA.pi_b[1][1], altMultipleProofA.pi_b[1][0]]],
                    [altMultipleProofA.pi_c[0], altMultipleProofA.pi_c[1]],
                    altMultiplePublicA,
                    { from: altSolver }
                )

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
                    await this.testCreator.solveTest(
                        '1',
                        [altMultipleProofA.pi_a[0], altMultipleProofA.pi_a[1]],
                        [[altMultipleProofA.pi_b[0][1], altMultipleProofA.pi_b[0][0]], [altMultipleProofA.pi_b[1][1], altMultipleProofA.pi_b[1][0]]],
                        [altMultipleProofA.pi_c[0], altMultipleProofA.pi_c[1]],
                        altMultiplePublicA,
                        { from: altSolver }
                    )
    
                    expect(await this.credentials.credentialReceivers(firstTokenId))
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
                        this.credentials.getCredential(nonExistentTokenId)
                        ,
                        "test does not exist"
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
            beforeEach(async function () {
                await this.testCreator.createTest(
                    0, credentialLimit, timeLimit, [solutionHashA], requiredPass, credentialsGainedA, testURI,
                    { from: owner, value: prize }
                );
                await this.testCreator.createTest(
                    1, credentialLimit, timeLimit, [answerHashesA_root], requiredPass, credentialsGainedB, testURI,
                    { from: owner, value: prize }
                )
                await this.testCreator.createTest(
                    2, credentialLimit, timeLimit, [solutionHashA, answerHashesA_root], requiredPass, credentialsGainedC, testURI,
                    { from: owner, value: prize }
                )
            })

            context('when calling for a multiple choice test', function () {
                it('returns 0', async function () {
                    expect(await this.credentials.getCredentialType('1'))
                        .to.be.bignumber.equal('0')
                })
            })

            context('when calling for a open answer test', function () {
                it('returns 1', async function () {
                    expect(await this.credentials.getCredentialType('2'))
                        .to.be.bignumber.equal('1')
                })
            })

            context('when calling for a mixed test', function () {
                it('returns 2', async function () {
                    expect(await this.credentials.getCredentialType('3'))
                        .to.be.bignumber.equal('2')
                })
            })
        })
    
        describe('getResults', function () {
            beforeEach(async function () {
                await this.testCreator.createTest(
                    0, credentialLimit, timeLimit, [solutionHashA], requiredPass, credentialsGainedA, testURI,
                    { from: owner, value: prize }
                );
                await this.testCreator.createTest(
                    1, credentialLimit, timeLimit, [answerHashesA_root], requiredPass, credentialsGainedB, testURI,
                    { from: owner, value: prize }
                )
                await this.testCreator.createTest(
                    2, credentialLimit, timeLimit, [solutionHashA, answerHashesA_root], requiredPass, credentialsGainedC, testURI,
                    { from: owner, value: prize }
                )
                await this.testCreator.createTest(
                    1, credentialLimit, timeLimit, [answerHashesB_root], requiredPass, credentialsGainedB, testURI,
                    { from: owner, value: prize }
                )
                await this.testCreator.createTest(
                    2, credentialLimit, timeLimit, [solutionHashB, answerHashesB_root], requiredPass, credentialsGainedC, testURI,
                    { from: owner, value: prize }
                )
            })

            context('when a multiple choice credential is gained', function () {
                it('returns 100', async function () {
                    await this.testCreator.solveTest(
                        '4',
                        [altMultipleProofA.pi_a[0], altMultipleProofA.pi_a[1]],
                        [[altMultipleProofA.pi_b[0][1], altMultipleProofA.pi_b[0][0]], [altMultipleProofA.pi_b[1][1], altMultipleProofA.pi_b[1][0]]],
                        [altMultipleProofA.pi_c[0], altMultipleProofA.pi_c[1]],
                        altMultiplePublicA,
                        { from: solver }
                    )
                    expect(await this.credentials.getResults(solver, '4'))
                        .to.be.bignumber.equal('100')
                })
            })
    
            context('when an open answer credential is gained', function () {
                it('returns the number of correct answers that were given', async function () {
                    // Aced test
                    await this.testCreator.solveTest(
                        '5',
                        [altOpenProofA.pi_a[0], altOpenProofA.pi_a[1]],
                        [[altOpenProofA.pi_b[0][1], altOpenProofA.pi_b[0][0]], [altOpenProofA.pi_b[1][1], altOpenProofA.pi_b[1][0]]],
                        [altOpenProofA.pi_c[0], altOpenProofA.pi_c[1]],
                        altOpenPublicA,
                        { from: solver }
                    )
                    expect(await this.credentials.getResults(solver, '5'))
                        .to.be.bignumber.equal('64')

                    // Did not ace the test
                    await this.testCreator.solveTest(
                        '7',
                        [openProofB.pi_a[0], openProofB.pi_a[1]],
                        [[openProofB.pi_b[0][1], openProofB.pi_b[0][0]], [openProofB.pi_b[1][1], openProofB.pi_b[1][0]]],
                        [openProofB.pi_c[0], openProofB.pi_c[1]],
                        openPublicB,
                        { from: altSolver }
                    )
                    expect(await this.credentials.getResults(altSolver, '7'))
                        .to.be.bignumber.equal('62')
                })

                it('reflects the improvement in the credential', async function () {
                    await this.testCreator.solveTest(
                        '7',
                        [openProofB.pi_a[0], openProofB.pi_a[1]],
                        [[openProofB.pi_b[0][1], openProofB.pi_b[0][0]], [openProofB.pi_b[1][1], openProofB.pi_b[1][0]]],
                        [openProofB.pi_c[0], openProofB.pi_c[1]],
                        openPublicB,
                        { from: altSolver }
                    )
                    expect(await this.credentials.getResults(altSolver, '7'))
                        .to.be.bignumber.equal('62')

                    await this.testCreator.solveTest(
                        '7',
                        [altOpenProofB.pi_a[0], altOpenProofB.pi_a[1]],
                        [[altOpenProofB.pi_b[0][1], altOpenProofB.pi_b[0][0]], [altOpenProofB.pi_b[1][1], altOpenProofB.pi_b[1][0]]],
                        [altOpenProofB.pi_c[0], altOpenProofB.pi_c[1]],
                        altOpenPublicB,
                        { from: altSolver }
                    )
                    expect(await this.credentials.getResults(altSolver, '7'))
                        .to.be.bignumber.equal('64')
                })
            })
    
            context('when a mixed test credential is gained', function () {
                it('returns 100 + the number of correct answers that were given', async function () {
                    // Aced test
                    await this.testCreator.solveTest(
                        '6',
                        [altMixedProofA.pi_a[0], altMixedProofA.pi_a[1]],
                        [[altMixedProofA.pi_b[0][1], altMixedProofA.pi_b[0][0]], [altMixedProofA.pi_b[1][1], altMixedProofA.pi_b[1][0]]],
                        [altMixedProofA.pi_c[0], altMixedProofA.pi_c[1]],
                        altMixedPublicA,
                        { from: solver }
                    )
                    expect(await this.credentials.getResults(solver, '6'))
                        .to.be.bignumber.equal('164')

                    // Did not ace the test
                    await this.testCreator.solveTest(
                        '8',
                        [mixedProofB.pi_a[0], mixedProofB.pi_a[1]],
                        [[mixedProofB.pi_b[0][1], mixedProofB.pi_b[0][0]], [mixedProofB.pi_b[1][1], mixedProofB.pi_b[1][0]]],
                        [mixedProofB.pi_c[0], mixedProofB.pi_c[1]],
                        mixedPublicB,
                        { from: altSolver }
                    )
                    expect(await this.credentials.getResults(altSolver, '8'))
                        .to.be.bignumber.equal('162')
                })

                it('reflects the improvement in the credential', async function () {
                    await this.testCreator.solveTest(
                        '8',
                        [mixedProofB.pi_a[0], mixedProofB.pi_a[1]],
                        [[mixedProofB.pi_b[0][1], mixedProofB.pi_b[0][0]], [mixedProofB.pi_b[1][1], mixedProofB.pi_b[1][0]]],
                        [mixedProofB.pi_c[0], mixedProofB.pi_c[1]],
                        mixedPublicB,
                        { from: altSolver }
                    )
                    expect(await this.credentials.getResults(altSolver, '8'))
                        .to.be.bignumber.equal('162')

                    await this.testCreator.solveTest(
                        '8',
                        [altMixedProofB.pi_a[0], altMixedProofB.pi_a[1]],
                        [[altMixedProofB.pi_b[0][1], altMixedProofB.pi_b[0][0]], [altMixedProofB.pi_b[1][1], altMixedProofB.pi_b[1][0]]],
                        [altMixedProofB.pi_c[0], altMixedProofB.pi_c[1]],
                        altMixedPublicB,
                        { from: altSolver }
                    )
                    expect(await this.credentials.getResults(altSolver, '8'))
                        .to.be.bignumber.equal('164')
                })
            })
        })
    })

    

    context('with invalidated tests', function () {
        beforeEach(async function () {
            await this.testCreator.createTest(
                0, credentialLimit, timeLimit, [solutionHashA], requiredPass, credentialsGainedA, testURI,
                { from: owner, value: prize }
            );
            await this.testCreator.createTest(
                1, credentialLimit, timeLimit, [answerHashesA_root], requiredPass, credentialsGainedB, testURI,
                { from: owner, value: prize }
            )
            await this.testCreator.createTest(
                2, credentialLimit, timeLimit, [solutionHashA, answerHashesA_root], requiredPass, credentialsGainedC, testURI,
                { from: owner, value: prize }
            )
        
            // Solving these tests
            await this.testCreator.solveTest(
                '1',
                [multipleProofA.pi_a[0], multipleProofA.pi_a[1]],
                [[multipleProofA.pi_b[0][1], multipleProofA.pi_b[0][0]], [multipleProofA.pi_b[1][1], multipleProofA.pi_b[1][0]]],
                [multipleProofA.pi_c[0], multipleProofA.pi_c[1]],
                multiplePublicA,
                { from: solver }
            )
            await this.testCreator.solveTest(
                '1',
                [altMultipleProofA.pi_a[0], altMultipleProofA.pi_a[1]],
                [[altMultipleProofA.pi_b[0][1], altMultipleProofA.pi_b[0][0]], [altMultipleProofA.pi_b[1][1], altMultipleProofA.pi_b[1][0]]],
                [altMultipleProofA.pi_c[0], altMultipleProofA.pi_c[1]],
                altMultiplePublicA,
                { from: altSolver }
            )
            await this.testCreator.solveTest(
                '2',
                [openProofA.pi_a[0], openProofA.pi_a[1]],
                [[openProofA.pi_b[0][1], openProofA.pi_b[0][0]], [openProofA.pi_b[1][1], openProofA.pi_b[1][0]]],
                [openProofA.pi_c[0], openProofA.pi_c[1]],
                openPublicA,
                { from: solver }
            )
            await this.testCreator.solveTest(
                '3',
                [mixedProofA.pi_a[0], mixedProofA.pi_a[1]],
                [[mixedProofA.pi_b[0][1], mixedProofA.pi_b[0][0]], [mixedProofA.pi_b[1][1], mixedProofA.pi_b[1][0]]],
                [mixedProofA.pi_c[0], mixedProofA.pi_c[1]],
                mixedPublicA,
                { from: altSolver }
            )

            this.testCreator.invalidateTest(firstTokenId, { from: owner })
        })

        describe('totalSupply', function () {
            it('returns the number of valid credentials that were given', async function () {
                expect(await this.credentials.totalSupply())
                    .to.be.bignumber.equal('4')
            })
        })

        describe('credentialReceivers', function () {
            it('returns a list of the addresses that got the deleted credential', async function () {
                expect(await this.credentials.credentialReceivers(firstTokenId))
                    .to.deep.equal([solver, altSolver])
            })
        })

        describe('receivedCredentials', function () {
            it('returns a list of the tokens an address received, including the deleted credential', async function () {
                expect((await this.credentials.receivedCredentials(solver)).map(n => { return n.toString() }))
                    .to.deep.equal(['1', '2'])
            })
        })

        describe('getCredential', function () {
            it('reverts', async function () {
                it('reverts', async function () {
                    await expectRevert(
                        this.credentials.getCredential(firstTokenId)
                        ,
                        "test does not exist"
                    )
                })
            })
        })
    })
}

module.exports = {
    shouldBehaveLikeCredentials
}