const { ethers, artifacts } = require("hardhat");
const { time, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const { bqTest } = require("../src/bqTest")
const {
    multipleChoiceRoot,
    answerHashesA,
    answerHashesB,
    openAnswersRootA,
    openAnswersRootB,
} = require('./helpers/testRoots');

const Valid = artifacts.require('Valid')
const Malicious = artifacts.require('Malicious')

const ZERO_ADDY = '0x0000000000000000000000000000000000000000'
const credentialsGained = 'The Tools You Need'
const testURI = 'https://gateway.ipfs.io/ipfs/QmcniBv7UQ4gGPQQW2BwbD4ZZHzN3o3tPuNLZCbBchd1zh'

async function shouldBehaveLikeTestCreator(owner, newOwner, solver, altSolver, operator, other) {

    async function solveTest(testContract, tokenId, proof, recipient = solver) {
        return testContract.solveTest(
            tokenId,
            recipient,
            [proof.a[0], proof.a[1]],
            [[proof.b[0][1], proof.b[0][0]], [proof.b[1][1], proof.b[1][0]]],
            [proof.c[0], proof.c[1]],
            proof.input.slice(0, -1),
            { from: recipient }
        )
    }

    context('without created tests', function () {
        describe('createTest', function () {
            context('when the test type specified is not supported', function () {
                it('reverts', async function () {
                    await expectRevert(
                        this.testCreator.createTest(255, 63, 100, 0, 0, [multipleChoiceRoot], ZERO_ADDY, credentialsGained, testURI)
                        ,
                        "Invalid test type"
                    )
                })
            })

            context('when providing an invalid number of questions', function () {
                it('reverts', async function () {
                    await expectRevert(
                        this.testCreator.createTest(100, 64, 100, 0, 0, [multipleChoiceRoot], ZERO_ADDY, credentialsGained, testURI)
                        ,
                        "Multiple choice test must have 1 as number of open questions"
                    )
                    await expectRevert(
                        this.testCreator.createTest(0, 0, 1, 0, 0, [multipleChoiceRoot], ZERO_ADDY, credentialsGained, testURI)
                        ,
                        "Invalid number of questions"
                    )
                    await expectRevert(
                        this.testCreator.createTest(0, 65, 1, 0, 0, [openAnswersRootA], ZERO_ADDY, credentialsGained, testURI)
                        ,
                        "Invalid number of questions"
                    )
                    await expectRevert(
                        this.testCreator.createTest(50, 0, 1, 0, 0, [multipleChoiceRoot, openAnswersRootA], ZERO_ADDY, credentialsGained, testURI)
                        ,
                        "Invalid number of questions"  
                    )
                    await expectRevert(
                        this.testCreator.createTest(50, 65, 1, 0, 0, [multipleChoiceRoot, openAnswersRootA], ZERO_ADDY, credentialsGained, testURI)
                        ,
                        "Invalid number of questions"  
                    )
                })
            })

            context('when providing an invalid minimum grade', function () {
                it('reverts', async function () {
                    await expectRevert(
                        this.testCreator.createTest(100, 1, 99, 0, 0, [multipleChoiceRoot], ZERO_ADDY, credentialsGained, testURI)
                        ,
                        "Multiple choice test must have 100 as minimum grade"
                    )
                    await expectRevert(
                        this.testCreator.createTest(0, 3, 0, 0, 0, [openAnswersRootA], ZERO_ADDY, credentialsGained, testURI)
                        ,
                        "Invalid minimum grade"
                    )
                    await expectRevert(
                        this.testCreator.createTest(0, 3, 101, 0, 0, [openAnswersRootA], ZERO_ADDY, credentialsGained, testURI)
                        ,
                        "Invalid minimum grade"
                    )
                    await expectRevert(
                        this.testCreator.createTest(50, 3, 0, 0, 0, [multipleChoiceRoot, openAnswersRootA], ZERO_ADDY, credentialsGained, testURI)
                        ,
                        "Invalid minimum grade" 
                    )
                    await expectRevert(
                        this.testCreator.createTest(50, 3, 101, 0, 0, [multipleChoiceRoot, openAnswersRootA], ZERO_ADDY, credentialsGained, testURI)
                        ,
                        "Invalid minimum grade"
                    )
                })
            })

            context('when the time limit is less than the current time', function () {
                it('reverts', async function () {
                    const pastTime = Math.floor(Date.now() / 1000) - 10;
                    await expectRevert(
                        this.testCreator.createTest(100, 1, 100, 0, 1, [multipleChoiceRoot], ZERO_ADDY, credentialsGained, testURI)
                        ,
                        "Time limit is in the past"   
                    )
                    await expectRevert(
                        this.testCreator.createTest(0, 3, 1, 0, 1, [openAnswersRootA], ZERO_ADDY, credentialsGained, testURI)
                        ,
                        "Time limit is in the past"  
                    )
                    await expectRevert(
                        this.testCreator.createTest(50, 3, 1, 0, 1, [multipleChoiceRoot, openAnswersRootA], ZERO_ADDY, credentialsGained, testURI)
                        ,
                        "Time limit is in the past"   
                    )
                })
            })

            context('when providing a malicious contract as the required pass', function () {
                let malicious

                beforeEach(async function () {
                    malicious = await Malicious.new()
                })
                
                it('reverts', async function () {
                    await expectRevert.unspecified(
                        this.testCreator.createTest(100, 1, 100, 0, 0, [multipleChoiceRoot], malicious.address, credentialsGained, testURI)
                    )
                    await expectRevert.unspecified(
                        this.testCreator.createTest(0, 3, 1, 0, 0, [openAnswersRootA], malicious.address, credentialsGained, testURI)
                    )
                    await expectRevert.unspecified(
                        this.testCreator.createTest(50, 3, 1, 0, 0, [multipleChoiceRoot, openAnswersRootA], malicious.address, credentialsGained, testURI)
                    )
                })
            })

            context('when providing a valid contract as the required pass', function () {
                let valid

                beforeEach(async function () {
                    valid = await Valid.new('Valid', 'VALID')
                })

                it('mints a new test', async function () {
                    // tx clears
                    await this.testCreator.createTest(100, 1, 100, 0, 0, [multipleChoiceRoot], valid.address, credentialsGained, testURI)

                    await this.testCreator.createTest(0, 3, 1, 0, 0, [openAnswersRootA], valid.address, credentialsGained, testURI)

                    await this.testCreator.createTest(50, 3, 1, 0, 0, [multipleChoiceRoot, openAnswersRootA], valid.address, credentialsGained, testURI)

                })
            })

            context('after a succesful mint (test creation)', function () {
                let tx1, tx2, tx3

                beforeEach(async function () {
                    tx1 = await this.testCreator.createTest(100, 1, 100, 0, 0, [multipleChoiceRoot], ZERO_ADDY, credentialsGained, testURI)
                    tx2 = await this.testCreator.createTest(0, 3, 1, 0, 0, [openAnswersRootA], ZERO_ADDY, credentialsGained, testURI)
                    tx3 = await this.testCreator.createTest(50, 3, 1, 0, 0, [multipleChoiceRoot, openAnswersRootA], ZERO_ADDY, credentialsGained, testURI) 
                })

                it('emits a transfer event', async function () {
                    expectEvent(tx1, 'Transfer', { from: ZERO_ADDY, to: owner, tokenId: '1' })
                    expectEvent(tx2, 'Transfer', { from: ZERO_ADDY, to: owner, tokenId: '2' })
                    expectEvent(tx3, 'Transfer', { from: ZERO_ADDY, to: owner, tokenId: '3' })
                })
            })
        })

        describe('testExists', function () {
            context('when the given testId does not exist', function () {
                it('returns false', async function () {
                    expect(await this.testCreator.testExists('350'))
                        .to.be.false
                })
            })

            context('after minting tests', function () {
                beforeEach(async function () {
                    await this.testCreator.createTest(100, 1, 100, 0, 0, [multipleChoiceRoot], ZERO_ADDY, credentialsGained, testURI)
                    await this.testCreator.createTest(0, 3, 1, 0, 0, [openAnswersRootA], ZERO_ADDY, credentialsGained, testURI)
                    await this.testCreator.createTest(50, 3, 1, 0, 0, [multipleChoiceRoot, openAnswersRootA], ZERO_ADDY, credentialsGained, testURI) 
                })

                it('returns true', async function () {
                    expect(await this.testCreator.testExists('1'))
                        .to.be.true
                    expect(await this.testCreator.testExists('2'))
                        .to.be.true
                    expect(await this.testCreator.testExists('3'))
                        .to.be.true
                })
            })
        })

        describe('testIsValid', function () {
            context('when the given testId does not exist', function () {
                it('returns false', async function () {
                    await expectRevert(
                        this.testCreator.testIsValid('350')
                        ,
                        'Test does not exist'
                    )
                })
            })

            context('after minting tests', function () {
                beforeEach(async function () {
                    await this.testCreator.createTest(100, 1, 100, 0, 0, [multipleChoiceRoot], ZERO_ADDY, credentialsGained, testURI)
                    await this.testCreator.createTest(0, 3, 1, 0, 0, [openAnswersRootA], ZERO_ADDY, credentialsGained, testURI)
                    await this.testCreator.createTest(50, 3, 1, 0, 0, [multipleChoiceRoot, openAnswersRootA], ZERO_ADDY, credentialsGained, testURI) 
                })

                it('returns true', async function () {
                    expect(await this.testCreator.testIsValid('1'))
                        .to.be.true
                    expect(await this.testCreator.testIsValid('2'))
                        .to.be.true
                    expect(await this.testCreator.testIsValid('3'))
                        .to.be.true
                })
            })
        })

        context('after minting and invalidating tests', function () {
            beforeEach(async function () {
                await this.testCreator.createTest(100, 1, 100, 0, 0, [multipleChoiceRoot], ZERO_ADDY, credentialsGained, testURI)
                await this.testCreator.createTest(0, 3, 1, 0, 0, [openAnswersRootA], ZERO_ADDY, credentialsGained, testURI)
                await this.testCreator.createTest(50, 3, 1, 0, 0, [multipleChoiceRoot, openAnswersRootA], ZERO_ADDY, credentialsGained, testURI) 
            
                await this.testCreator.invalidateTest('1')
                await this.testCreator.invalidateTest('2')
                await this.testCreator.invalidateTest('3')
            })

            it('returns false', async function () {
                expect(await this.testCreator.testIsValid('1'))
                    .to.be.false
                expect(await this.testCreator.testIsValid('2'))
                    .to.be.false
                expect(await this.testCreator.testIsValid('3'))
                    .to.be.false
            })
        })
    })

    context('with created tests', function () {
        beforeEach(async function () {
            await this.testCreator.createTest(100, 1, 100, 0, 0, [multipleChoiceRoot], ZERO_ADDY, credentialsGained, testURI)
            await this.testCreator.createTest(0, 3, 1, 0, 0, [openAnswersRootA], ZERO_ADDY, credentialsGained, testURI)
            await this.testCreator.createTest(50, 3, 1, 0, 0, [multipleChoiceRoot, openAnswersRootA], ZERO_ADDY, credentialsGained, testURI)
        })

        describe('verifyTestAnswers', function () {
            context('with unverified tests', function () {
                it('reverts if the test does not exist', async function () {
                    await expectRevert(
                        this.testCreator.verifyTestAnswers('350', answerHashesA)
                        ,
                        "Test does not exist"
                    )
                })

                it('reverts for non open answer tests', async function () {
                    await expectRevert(
                        this.testCreator.verifyTestAnswers('1', answerHashesA)
                        ,
                        "Test is not open answer or mixed"
                    )
                })

                it('reverts if not called by the owner', async function () {
                    await expectRevert(
                        this.testCreator.verifyTestAnswers('2', answerHashesA, { from: solver })
                        ,
                        "Verifying test that is not own"
                    )
                })

                it('reverts with invalid number of answers', async function () {
                    await expectRevert(
                        this.testCreator.verifyTestAnswers('2', answerHashesA.slice(1))
                        ,
                        "Invalid number provided"
                    )
                })
            })

            context('with verified tests', function () {
                beforeEach(async function () {
                    await this.testCreator.verifyTestAnswers('2', answerHashesA)
                })

                it('reverts if the test was already verified', async function () {
                    await expectRevert(
                        this.testCreator.verifyTestAnswers('2', answerHashesA)
                        ,
                        "Test was already verified"
                    )
                })
            })
        })

        describe("getOpenAnswersHashes", function () {
            context('when the given testId does not exist', function () {
                it('reverts', async function () {
                    await expectRevert(
                        this.testCreator.getOpenAnswersHashes('350')
                        ,
                        "Test does not exist"
                    )
                })
            })

            context('when the given testId is not openAnswer', function () {
                it('reverts', async function () {
                    await expectRevert(
                        this.testCreator.getOpenAnswersHashes('1')
                        ,
                        "Test is not open answer or mixed"
                    )
                })
            })

            context('with unverified tests', function () {
                it('reverts', async function () {
                    await expectRevert(
                        this.testCreator.getOpenAnswersHashes('2')
                        ,
                        "Test was not verified"
                    )
                })
            })

            context('when test is verified', function () {
                beforeEach(async function () {
                    await this.testCreator.verifyTestAnswers('2', answerHashesA)
                })

                it('returns the specified open answer hashes', async function () {
                    expect((await this.testCreator.getOpenAnswersHashes('2')).map(s => { return s.toString() }))
                        .to.deep.equal(answerHashesA.map(s => { return s.toString() }))
                })
            })
        })

        describe('getMultipleChoiceRoot', function () {
            context('when the given testId does not exist', function () {
                it('reverts', async function () {
                    await expectRevert(
                        this.testCreator.getMultipleChoiceRoot('350')
                        ,
                        "Test does not exist"
                    )
                })
            })

            context('when the given testId is not multiple choice', function () {
                it('reverts', async function () {
                    await expectRevert(
                        this.testCreator.getMultipleChoiceRoot('2')
                        ,
                        "Test is not multiple choice or mixed"
                    )
                })
            })

            context('with a valid multiple choice test', function () {
                it('returns the solution hash for this testId', async function () {
                    expect(await this.testCreator.getMultipleChoiceRoot('1'))
                        .to.be.bignumber.equal(multipleChoiceRoot)
                })
            })
        })

        describe('getOpenAnswersRoot', function () {
            context('when the given testId does not exist', function () {
                it('reverts', async function () {
                    await expectRevert(
                        this.testCreator.getOpenAnswersRoot('350')
                        ,
                        "Test does not exist"
                    )
                })
            })

            context('when the given testId is not open answer', function () {
                it('reverts', async function () {
                    await expectRevert(
                        this.testCreator.getOpenAnswersRoot('1')
                        ,
                        "Test is not open answer or mixed"
                    )
                })
            })

            context('with a valid open answer test', function () {
                it('returns the root of the answer hash tree for this testId', async function () {
                    expect(await this.testCreator.getOpenAnswersRoot('2'))
                        .to.be.bignumber.equal(openAnswersRootA.toString())
                })
            })
        })

        describe('getTest', function () {
            context('when the given testId does not exist', function () {
                it('reverts', async function () {
                    await expectRevert(
                        this.testCreator.getTest('350')
                        ,
                        "Test does not exist"
                    )
                })
            })

            context('when the given testId does exist', function () {
                it('returns the given on chain test for this testId', async function () {
                    expect((await this.testCreator.getTest('1')).slice(0,8).map(n => { return n.toString() }))
                        .to.deep.equal([
                            '100',
                            '1',
                            '100',
                            '0',
                            '0',
                            '0',
                            ZERO_ADDY,
                            credentialsGained
                    ])

                    expect((await this.testCreator.getTest('2')).slice(0,8).map(n => { return n.toString() }))
                        .to.deep.equal([
                            '0',
                            '3',
                            '1',
                            '0',
                            '0',
                            '0',
                            ZERO_ADDY,
                            credentialsGained
                    ])

                    expect((await this.testCreator.getTest('3')).slice(0,8).map(n => { return n.toString() }))
                        .to.deep.equal([
                            '50',
                            '3',
                            '1',
                            '0',
                            '0',
                            '0',
                            ZERO_ADDY,
                            credentialsGained
                    ])
                })
            })
        })

        describe('invalidateTest', function () {
            context('when deleting a nonexistent test', function () {
                it('reverts', async function () {
                    await expectRevert(
                        this.testCreator.invalidateTest('350')
                        ,
                        "Test does not exist"
                    )
                })
            })

            context('when invalidating a token that is not own', function () {
                it('reverts', async function () {
                    await expectRevert(
                        this.testCreator.invalidateTest('1', { from: newOwner })
                        ,
                        "Invalidating test that is not own"
                    )
                    await expectRevert(
                        this.testCreator.invalidateTest('2', { from: newOwner })
                        ,
                        "Invalidating test that is not own"
                    )
                    await expectRevert(
                        this.testCreator.invalidateTest('3', { from: newOwner })
                        ,
                        "Invalidating test that is not own"
                    )
                })
            })

            context('with a successful invalidation', function () {
                let tx1, tx2, tx3
                
                beforeEach(async function () {
                    tx1 = await this.testCreator.invalidateTest('1')
                    tx2 = await this.testCreator.invalidateTest('2')
                    tx3 = await this.testCreator.invalidateTest('3')
                })

                it('reflects the invalidation in the on chain test object', async function () {
                    expect((await this.testCreator.getTest('1')).slice(0,8).map(n => { return n.toString() }))
                        .to.deep.equal([
                            '255',
                            '1',
                            '100',
                            '0',
                            '0',
                            '0',
                            ZERO_ADDY,
                            credentialsGained
                    ])

                    expect((await this.testCreator.getTest('2')).slice(0,8).map(n => { return n.toString() }))
                        .to.deep.equal([
                            '255',
                            '3',
                            '1',
                            '0',
                            '0',
                            '0',
                            ZERO_ADDY,
                            credentialsGained
                    ])

                    expect((await this.testCreator.getTest('3')).slice(0,8).map(n => { return n.toString() }))
                        .to.deep.equal([
                            '255',
                            '3',
                            '1',
                            '0',
                            '0',
                            '0',
                            ZERO_ADDY,
                            credentialsGained
                    ])
                })

                it('does not allow the solving of tests', async function () {
                    const multiple = await bqTest.solveMode(1, ethers.provider, this.testCreator.address)
                    const openA = await bqTest.solveMode(2, ethers.provider, this.testCreator.address, answerHashesA)
                    const mixedA = await bqTest.solveMode(3, ethers.provider, this.testCreator.address, answerHashesA)

                    await expectRevert(
                        multiple.sendSolutionTransaction( solverSigner, this.proofs.proofMultiple )
                        ,
                        "Test has been deleted and can no longer be solved"
                    )
                    
                    await expectRevert(
                        openA.sendSolutionTransaction( solverSigner, this.proofs.proofOpenA )
                        ,
                        "Test has been deleted and can no longer be solved"
                    )

                    await expectRevert(
                        mixedA.sendSolutionTransaction( solverSigner, this.proofs.proofMixedA )
                        ,
                        "Test has been deleted and can no longer be solved"
                    )
                })

                it('cannot invalidate tests again', async function () {
                    await expectRevert(
                        this.testCreator.invalidateTest('1')
                        ,
                        "Test was already invalidated"
                    )
                    await expectRevert(
                        this.testCreator.invalidateTest('2')
                        ,
                        "Test was already invalidated"
                    )
                    await expectRevert(
                        this.testCreator.invalidateTest('3')
                        ,
                        "Test was already invalidated"
                    )
                })

                it('emits a transfer event', async function () {
                    expectEvent(tx1, 'Transfer', { from: owner, to: ZERO_ADDY, tokenId: '1'})
                    expectEvent(tx2, 'Transfer', { from: owner, to: ZERO_ADDY, tokenId: '2'})
                    expectEvent(tx3, 'Transfer', { from: owner, to: ZERO_ADDY, tokenId: '3'})
                })
            })
        })

        describe('solveTest', function () {
            let multiple, openA, mixedA

            beforeEach(async function () {
                multiple = await bqTest.solveMode(1, ethers.provider, this.testCreator.address)
                openA = await bqTest.solveMode(2, ethers.provider, this.testCreator.address, answerHashesA)
                mixedA = await bqTest.solveMode(3, ethers.provider, this.testCreator.address, answerHashesA)
            })

            context('when the given testId does not exist', function () {
                it('reverts', async function () {
                    await expectRevert(
                        solveTest(this.testCreator, '350', this.proofs.proofMultiple)
                        ,
                        'Test does not exist'
                    )
                })
            })

            context('when trying to specify a different recipient', function () {
                it('reverts', async function () {
                    await expectRevert(
                        solveTest(this.testCreator, '1', this.proofs.proofMultiple, altSolver)
                        ,
                        "Invalid proof"
                    )
                })
                it('reverts', async function () {
                    await expectRevert(
                        solveTest(this.testCreator, '1', this.proofs.proofMultiple, owner)
                        ,
                        "Test cannot be solved by owner"
                    )
                })
            })

            context('when the owner tries to solve the test', function () {
                it('reverts', async function () {
                    await expectRevert(
                        solveTest(this.testCreator, '1', this.proofs.proofMultiple, owner)
                        ,
                        "Test cannot be solved by owner"
                    )
                })
            })

            context('when the number of credentials has been reached', function () {
                it('reverts', async function () {
                    // Creating a credential limited to one
                    await this.testCreator.createTest(100, 1, 100, 1, 0, [multipleChoiceRoot], ZERO_ADDY, credentialsGained, testURI)
                    const _multiple = await bqTest.solveMode(4, ethers.provider, this.testCreator.address)
                    await _multiple.sendSolutionTransaction( solverSigner, this.proofs.proofMultiple )
                    
                    await expectRevert(
                        _multiple.sendSolutionTransaction( altSolverSigner, this.proofs.altProofMultiple )                
                        ,
                        "Maximum number of credentials reached"
                    )
                })
            })

            context('when the time limit has been reached', function () {
                it('reverts', async function () {
                    const blockNum = await web3.eth.getBlockNumber()
                    const block = await web3.eth.getBlock(blockNum)
                    await this.testCreator.createTest(100, 1, 100, 0, block.timestamp + 100, [multipleChoiceRoot], ZERO_ADDY, credentialsGained, testURI)

                    await time.increase(time.duration.seconds(101));

                    await expectRevert(
                        solveTest(this.testCreator, '4', this.proofs.proofMultiple)
                        ,
                        "Time limit for this credential reached"
                    )
                })
            })

            context('when giving an invalid input length', function () {
                it('reverts', async function () {
                    await expectRevert.unspecified(
                        this.testCreator.solveTest(
                            '1',
                            solver,
                            this.proofs.proofMultiple.a,
                            [[this.proofs.proofMultiple.b[0][1], this.proofs.proofMultiple.b[0][0]], 
                            [this.proofs.proofMultiple.b[1][1], this.proofs.proofMultiple.b[1][0]]],  
                            this.proofs.proofMultiple.c,
                            this.proofs.proofMultiple.input.slice(0, -2),
                            { from: solver }
                        )
                    )

                    await expectRevert.unspecified(
                        this.testCreator.solveTest(
                            '2',
                            solver,
                            this.proofs.proofOpenA.a,
                            [[this.proofs.proofOpenA.b[0][1], this.proofs.proofOpenA.b[0][0]], 
                            [this.proofs.proofOpenA.b[1][1], this.proofs.proofOpenA.b[1][0]]],  
                            this.proofs.proofOpenA.c,
                            this.proofs.proofOpenA.input.slice(0, -2),
                            { from: solver }
                        )
                    )

                    await expectRevert.unspecified(
                        this.testCreator.solveTest(
                            '3',
                            solver,
                            this.proofs.proofMixedA.a,
                            [[this.proofs.proofMixedA.b[0][1], this.proofs.proofMixedA.b[0][0]], 
                            [this.proofs.proofMixedA.b[1][1], this.proofs.proofMixedA.b[1][0]]],  
                            this.proofs.proofMixedA.c,
                            this.proofs.proofMixedA.input.slice(0, -2),
                            { from: solver }
                        )
                    )
                })
            })

            context('when giving a non-working proof', function () {
                it('reverts', async function () {
                    await expectRevert(
                        this.testCreator.solveTest(
                            '1',
                            solver,
                            this.proofs.proofMultiple.a,
                            [[this.proofs.proofMultiple.b[0][0], this.proofs.proofMultiple.b[0][1]], 
                            [this.proofs.proofMultiple.b[1][1], this.proofs.proofMultiple.b[1][0]]],  
                            this.proofs.proofMultiple.c,
                            this.proofs.proofMultiple.input.slice(0, -1),
                            { from: solver }
                        )
                        ,
                        "invalid opcode"
                    )
                })
            })

            context('when verification is not successful or grade is below minimum', function () {
                it('reverts', async function () {
                    await expectRevert(
                        solveTest(this.testCreator, '1', this.proofs.proofMultipleWrong)
                        ,
                        "Wrong solution"
                    )
                    
                    await expectRevert(
                        solveTest(this.testCreator, '2', this.proofs.proofOpenWrong)
                        ,
                        "Grade is below minimum"
                    )

                    await expectRevert(
                        solveTest(this.testCreator, '3', this.proofs.proofMixedWrong)
                        ,
                        "Grade is below minimum"
                    )
                })
            })

            context('after getting a credential without acing it', function () {
                beforeEach(async function () {
                    await multiple.sendSolutionTransaction( solverSigner, this.proofs.proofMultiple )
                    await openA.sendSolutionTransaction( solverSigner, this.proofs.proofOpenA )
                    await mixedA.sendSolutionTransaction( solverSigner, this.proofs.proofMixedA )
                })
                
                it('does not let users change the result if given a worse one', async function () {
                    const proof = await multiple.generateSolutionProof({ recipient: solver, multipleChoiceAnswers: Array.from({length: 64}, (_, i) => 1) })
                    await expectRevert(
                        solveTest(this.testCreator, '1', proof)
                        ,
                        "Your existing credential has a better result"
                    )

                    await expectRevert(
                        solveTest(this.testCreator, '2', this.proofs.altProofOpenA)
                        ,
                        "Your existing credential has a better result"
                    )

                    await expectRevert(
                        solveTest(this.testCreator, '3', this.proofs.altProofMixedA)
                        ,
                        "Your existing credential has a better result"
                    )
                })

                it('does not increase the number of solvers or mint new NFTs with open tests', async function () {
                    // Minting B tests
                    await this.testCreator.createTest(0, 3, 1, 0, 0, [openAnswersRootB], ZERO_ADDY, credentialsGained, testURI)
                    const openB = await bqTest.solveMode(4, ethers.provider, this.testCreator.address, answerHashesB)

                    // Initial solution
                    await openB.sendSolutionTransaction( solverSigner, this.proofs.proofOpenB )
                    // Improved solution
                    await openB.sendSolutionTransaction( solverSigner, this.proofs.altProofOpenB )

                    // Tester still shows just one solver
                    expect((await this.testCreator.getTest('2')).slice(0,8).map(n => { return n.toString() }))
                        .to.deep.equal([
                            '0',
                            '3',
                            '1',
                            '1',
                            '0',
                            '0',
                            ZERO_ADDY,
                            credentialsGained
                    ])

                    // No new mints
                    expect(await this.credentials.balanceOf(solver))
                        .to.be.bignumber.equal('4')
                })

                it('does not increase the number of solvers or mint new NFTs with mixed tests', async function () {
                    // Minting B tests
                    await this.testCreator.createTest(50, 3, 1, 0, 0, [multipleChoiceRoot, openAnswersRootB], ZERO_ADDY, credentialsGained, testURI)
                    const mixedB = await bqTest.solveMode(4, ethers.provider, this.testCreator.address, answerHashesB)

                    // Initial solution
                    await mixedB.sendSolutionTransaction( solverSigner, this.proofs.proofMixedB )
                    // Improved solution
                    await mixedB.sendSolutionTransaction( solverSigner, this.proofs.altProofMixedB )

                    // Tester still shows just one solver
                    expect((await this.testCreator.getTest('3')).slice(0,8).map(n => { return n.toString() }))
                        .to.deep.equal([
                            '50',
                            '3',
                            '1',
                            '1',
                            '0',
                            '0',
                            ZERO_ADDY,
                            credentialsGained
                    ])

                    // No new mints
                    expect(await this.credentials.balanceOf(solver))
                        .to.be.bignumber.equal('4')
                })
            })

            context('when the caller does not own the required pass', function () {
                it('reverts', async function () {
                    const valid = await Valid.new('Valid', 'VALID')

                    await this.testCreator.createTest(100, 1, 100, 0, 0, [multipleChoiceRoot], valid.address, credentialsGained, testURI)
    
                    await expectRevert(
                        solveTest(this.testCreator, '4', this.proofs.proofMultiple)
                        ,
                        "Solver does not own the required token"
                    )
                })
            })

            context('when the caller owns the required pass', function () {
                it('mints the credential', async function () {
                    const valid = await Valid.new('Valid', 'VALID')
                    valid.mint(solver, '1')

                    await this.testCreator.createTest(100, 1, 100, 0, 0, [multipleChoiceRoot], valid.address, credentialsGained, testURI)
                    const _multiple = await bqTest.solveMode(4, ethers.provider, this.testCreator.address)
    
                    await _multiple.sendSolutionTransaction( solverSigner, this.proofs.proofMultiple )
                })
            })

            context('when verification is successful', function () {
                let tx1, tx2, tx3

                beforeEach(async function () {
                    tx1 = await solveTest(this.testCreator, '1', this.proofs.proofMultiple)
                    tx2 = await solveTest(this.testCreator, '2', this.proofs.proofOpenA)
                    tx3 = await solveTest(this.testCreator, '3', this.proofs.proofMixedA)
                })

                it('updates the on chain test object', async function () {
                    expect((await this.testCreator.getTest('1')).slice(0,8).map(n => { return n.toString() }))
                        .to.deep.equal([
                            '100',
                            '1',
                            '100',
                            '1',
                            '0',
                            '0',
                            ZERO_ADDY,
                            credentialsGained
                    ])

                    expect((await this.testCreator.getTest('2')).slice(0,8).map(n => { return n.toString() }))
                        .to.deep.equal([
                            '0',
                            '3',
                            '1',
                            '1',
                            '0',
                            '0',
                            ZERO_ADDY,
                            credentialsGained
                    ])

                    expect((await this.testCreator.getTest('3')).slice(0,8).map(n => { return n.toString() }))
                        .to.deep.equal([
                            '50',
                            '3',
                            '1',
                            '1',
                            '0',
                            '0',
                            ZERO_ADDY,
                            credentialsGained
                    ])
                })

                it('mints a new credential NFT for the solver', async function () {
                    expect(await this.credentials.balanceOf(solver))
                        .to.be.bignumber.equal('3')
                })

                it('emits a transfer event for the credential', async function () {
                    expectEvent(tx1, 'Transfer', { from: this.testCreator.address, to: solver, tokenId: '1' })
                    expectEvent(tx2, 'Transfer', { from: this.testCreator.address, to: solver, tokenId: '2' })
                    expectEvent(tx3, 'Transfer', { from: this.testCreator.address, to: solver, tokenId: '3' })
                })
            })
        })
    })
}

module.exports = {
    shouldBehaveLikeTestCreator
};