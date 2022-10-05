const { BN, constants, time, expectEvent, expectRevert, balance } = require('@openzeppelin/test-helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');
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
const altMultipleProofA = require("./proof/multiple/altMultipleProofA.json")
const altMultiplePublicA = require("./proof/multiple/altMultiplePublicA.json")
const multipleProofB = require("./proof/multiple/multipleProofB.json")
const multiplePublicB = require("./proof/multiple/multiplePublicB.json")
const altMultipleProofB = require("./proof/multiple/altMultipleProofB.json")
const altMultiplePublicB = require("./proof/multiple/altMultiplePublicB.json")

// Open answer tests
const openProofA = require("./proof/open/openProofA.json")
const openPublicA = require("./proof/open/openPublicA.json")
const altOpenProofA = require("./proof/open/altOpenProofA.json")
const altOpenPublicA = require("./proof/open/altOpenPublicA.json")
const wrongOpenProofA = require("./proof/open/wrongOpenProofA.json")
const wrongOpenPublicA = require("./proof/open/wrongOpenPublicA.json")
const openProofB = require("./proof/open/openProofB.json")
const openPublicB = require("./proof/open/openPublicB.json")
const altOpenProofB = require("./proof/open/altOpenProofB.json")
const altOpenPublicB = require("./proof/open/altOpenPublicB.json")

// Mixed tests
const mixedProofA = require("./proof/mixed/mixedProofA.json")
const mixedPublicA = require("./proof/mixed/mixedPublicA.json")
const altMixedProofA = require("./proof/mixed/altMixedProofA.json")
const altMixedPublicA = require("./proof/mixed/altMixedPublicA.json")
const wrongMixedProofA = require("./proof/mixed/wrongMixedProofA.json")
const wrongMixedPublicA = require("./proof/mixed/wrongMixedPublicA.json")
const mixedProofB = require("./proof/mixed/mixedProofB.json")
const mixedPublicB = require("./proof/mixed/mixedPublicB.json")
const altMixedProofB = require("./proof/mixed/altMixedProofB.json")
const altMixedPublicB = require("./proof/mixed/altMixedPublicB.json")


function shouldBehaveLiketestCreator(owner, newOwner, solver, altSolver, operator, other) {

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

    context('without created tests', function () {
        describe('createtest', function () {
            context('when the test type specified is not supported', function () {
                it('reverts', async function () {
                    await expectRevert(
                        this.testCreator.createTest(
                            0, 63, 100, credentialLimit, timeLimit, [solutionHashA], requiredPass, credentialsGained, testURI,
                            { from: owner, value: prize }
                        )
                        ,
                        "Invalid test type"
                    )
                })
            })

            context('when providing an invalid number of questions', function () {
                it('reverts', async function () {
                    await expectRevert(
                        this.testCreator.createTest(
                            200, 64, 100, credentialLimit, timeLimit, [solutionHashA], requiredPass, credentialsGained, testURI,
                            { from: owner, value: prize }
                        )
                        ,
                        "Multiple choice test must have 1 as number of open questions"
                    )
                    await expectRevert(
                        this.testCreator.createTest(
                            100, 0, 1, credentialLimit, timeLimit, [answerHashesA_root], requiredPass, credentialsGained, testURI,
                            { from: owner, value: prize }
                        )
                        ,
                        "Invalid number of questions"
                    )
                    await expectRevert(
                        this.testCreator.createTest(
                            100, 65, 1, credentialLimit, timeLimit, [answerHashesA_root], requiredPass, credentialsGained, testURI,
                            { from: owner, value: prize }
                        )
                        ,
                        "Invalid number of questions"
                    )
                    await expectRevert(
                        this.testCreator.createTest(
                            50, 0, 1, credentialLimit, timeLimit, [solutionHashA, answerHashesA_root], requiredPass, credentialsGained, testURI,
                            { from: owner, value: prize }
                        )
                        ,
                        "Invalid number of questions"  
                    )
                    await expectRevert(
                        this.testCreator.createTest(
                            50, 65, 1, credentialLimit, timeLimit, [solutionHashA, answerHashesA_root], requiredPass, credentialsGained, testURI,
                            { from: owner, value: prize }
                        )
                        ,
                        "Invalid number of questions"  
                    )
                })
            })

            context('when providing an invalid minimum grade', function () {
                it('reverts', async function () {
                    await expectRevert(
                        this.testCreator.createTest(
                            200, 1, 99, credentialLimit, timeLimit, [solutionHashA], requiredPass, credentialsGained, testURI,
                            { from: owner, value: prize }
                        )
                        ,
                        "Multiple choice test must have 100 as minimum grade"
                    )
                    await expectRevert(
                        this.testCreator.createTest(
                            100, 3, 0, credentialLimit, timeLimit, [answerHashesA_root], requiredPass, credentialsGained, testURI,
                            { from: owner, value: prize }
                        )
                        ,
                        "Invalid minimum grade"
                    )
                    await expectRevert(
                        this.testCreator.createTest(
                            100, 3, 101, credentialLimit, timeLimit, [answerHashesA_root], requiredPass, credentialsGained, testURI,
                            { from: owner, value: prize }
                        )
                        ,
                        "Invalid minimum grade"
                    )
                    await expectRevert(
                        this.testCreator.createTest(
                            50, 3, 0, credentialLimit, timeLimit, [solutionHashA, answerHashesA_root], requiredPass, credentialsGained, testURI,
                            { from: owner, value: prize }
                        )
                        ,
                        "Invalid minimum grade" 
                    )
                    await expectRevert(
                        this.testCreator.createTest(
                            50, 3, 101, credentialLimit, timeLimit, [solutionHashA, answerHashesA_root], requiredPass, credentialsGained, testURI,
                            { from: owner, value: prize }
                        )
                        ,
                        "Invalid minimum grade"
                    )
                })
            })

            context('when the time limit is less than the current time', function () {
                it('reverts', async function () {
                    const pastTime = Math.floor(Date.now() / 1000) - 10;
                    await expectRevert(
                        this.testCreator.createTest(
                            200, 1, 100, credentialLimit, pastTime, [solutionHashA], requiredPass, credentialsGained, testURI,
                            { from: owner, value: prize }
                        )
                        ,
                        "Time limit is in the past"   
                    )
                    await expectRevert(
                        this.testCreator.createTest(
                            100, 3, 1, credentialLimit, pastTime, [answerHashesA_root], requiredPass, credentialsGained, testURI,
                            { from: owner, value: prize }
                        )
                        ,
                        "Time limit is in the past"  
                    )
                    await expectRevert(
                        this.testCreator.createTest(
                            50, 3, 1, credentialLimit, pastTime, [solutionHashA, answerHashesA_root], requiredPass, credentialsGained, testURI,
                            { from: owner, value: prize }
                        )
                        ,
                        "Time limit is in the past"   
                    )
                })
            })

            context('when the credential limit is equal to zero', function () {
                it('reverts', async function () {
                    await expectRevert(
                        this.testCreator.createTest(
                            200, 1, 100, 0, timeLimit, [solutionHashA], requiredPass, credentialsGained, testURI,
                            { from: owner, value: prize }
                        )
                        ,
                        "Credential limit must be above zero"   
                    )
                    await expectRevert(
                        this.testCreator.createTest(
                            100, 3, 1, 0, timeLimit, [answerHashesA_root], requiredPass, credentialsGained, testURI,
                            { from: owner, value: prize }
                        )
                        ,
                        "Credential limit must be above zero" 
                    )
                    await expectRevert(
                        this.testCreator.createTest(
                            50, 3, 1, 0, timeLimit, [solutionHashA, answerHashesA_root], requiredPass, credentialsGained, testURI,
                            { from: owner, value: prize }
                        )
                        ,
                        "Credential limit must be above zero"     
                    )
                })
            })

            context('when providing a malicious contract as the required pass', function () {
                it('reverts', async function () {
                    await expectRevert.unspecified(
                        this.testCreator.createTest(
                            200, 1, 100, credentialLimit, timeLimit, [solutionHashA], this.malicious.address, credentialsGained, testURI,
                            { from: owner, value: prize }
                        )
                    )
                    await expectRevert.unspecified(
                        this.testCreator.createTest(
                            100, 3, 1, credentialLimit, timeLimit, [answerHashesA_root], this.malicious.address, credentialsGained, testURI,
                            { from: owner, value: prize }
                          )
                    )
                    await expectRevert.unspecified(
                        this.testCreator.createTest(
                            50, 3, 1, credentialLimit, timeLimit, [solutionHashA, answerHashesA_root], this.malicious.address, credentialsGained, testURI,
                            { from: owner, value: prize }
                        )
                    )
                })
            })

            context('when providing a valid contract as the required pass', function () {
                it('mints a new test', async function () {
                    // tx clears
                    await this.testCreator.createTest(
                        200, 1, 100, credentialLimit, timeLimit, [solutionHashA], this.valid.address, credentialsGained, testURI,
                        { from: owner, value: prize }
                    )
                    await this.testCreator.createTest(
                        100, 3, 1, credentialLimit, timeLimit, [answerHashesA_root], this.valid.address, credentialsGained, testURI,
                        { from: owner, value: prize }
                    )
                    await this.testCreator.createTest(
                        50, 3, 1, credentialLimit, timeLimit, [solutionHashA, answerHashesA_root], this.valid.address, credentialsGained, testURI,
                        { from: owner, value: prize }
                    )
                })
            })

            context('after a succesful mint (test creation)', function () {
                let tx1, tx2, tx3

                beforeEach(async function () {
                    tx1 = await this.testCreator.createTest(
                        200, 1, 100, credentialLimit, timeLimit, [solutionHashA], requiredPass, credentialsGained, testURI,
                        { from: owner, value: prize }
                    )
                    tx2 = await this.testCreator.createTest(
                        100, 3, 1, credentialLimit, timeLimit, [answerHashesA_root], requiredPass, credentialsGained, testURI,
                        { from: owner, value: prize }
                    )
                    tx3 = await this.testCreator.createTest(
                        50, 3, 1, credentialLimit, timeLimit, [solutionHashA, answerHashesA_root], requiredPass, credentialsGained, testURI,
                        { from: owner, value: prize }
                    )
                })

                it('emits a transfer event', async function () {
                    expectEvent(tx1, 'Transfer', { from: ZERO_ADDRESS, to: owner, tokenId: '1' })
                    expectEvent(tx2, 'Transfer', { from: ZERO_ADDRESS, to: owner, tokenId: '2' })
                    expectEvent(tx3, 'Transfer', { from: ZERO_ADDRESS, to: owner, tokenId: '3' })
                })
            })
        })

        describe('testExists', function () {
            context('when the given testId does not exist', function () {
                it('returns false', async function () {
                    expect(await this.testCreator.testExists(nonExistentTokenId))
                        .to.be.false
                })
            })

            context('after minting a given testId', function () {
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
                })

                it('returns true', async function () {
                    expect(await this.testCreator.testExists(firstTokenId))
                        .to.be.true
                    expect(await this.testCreator.testExists(secondTokenId))
                        .to.be.true
                    expect(await this.testCreator.testExists(thirdTokenId))
                        .to.be.true
                })
            })
        })
    })

    context('with created tests', function () {
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
        })

        describe('getMultipleChoiceTest', function () {
            context('when the given testId does not exist', function () {
                it('reverts', async function () {
                    await expectRevert(
                        this.testCreator.getMultipleChoiceTest(nonExistentTokenId)
                        ,
                        "Test does not exist"
                    )
                })
            })

            context('when the given testId is not multipleChoice', function () {
                it('reverts', async function () {
                    await expectRevert(
                        this.testCreator.getMultipleChoiceTest('3')
                        ,
                        "Test is not multiple choice or mixed"
                    )
                })
            })

            context('after minting a given testId', function () {

                this.beforeEach(async function () {
                    await this.testCreator.createTest(
                        200, 1, 100, credentialLimit, timeLimit, [solutionHashA], requiredPass, credentialsGained, testURI,
                        { from: owner, value: prize }
                    );
                    await this.testCreator.createTest(
                        50, 3, 1, credentialLimit, timeLimit, [solutionHashA, answerHashesA_root], requiredPass, credentialsGained, testURI,
                        { from: owner, value: prize }
                    ) 
                })

                it('returns the solution hash for this testId', async function () {
                    expect(await this.testCreator.getMultipleChoiceTest('7'))
                        .to.be.bignumber.equal(solutionHashA)

                    expect(await this.testCreator.getMultipleChoiceTest('8'))
                        .to.be.bignumber.equal(solutionHashA)
                })
            })
        })

        describe('getAnswerHashesRoot', function () {
            context('when the given testId does not exist', function () {
                it('reverts', async function () {
                    await expectRevert(
                        this.testCreator.getAnswerHashesRoot(nonExistentTokenId)
                        ,
                        "Test does not exist"
                    )
                })
            })

            context('when the given testId is not openAnswer', function () {
                it('reverts', async function () {
                    await expectRevert(
                        this.testCreator.getAnswerHashesRoot('1')
                        ,
                        "Test is not open answer or mixed"
                    )
                })
            })

            context('after minting a given testId', function () {

                this.beforeEach(async function () {
                    await this.testCreator.createTest(
                        100, 3, 1, credentialLimit, timeLimit, [answerHashesA_root], requiredPass, credentialsGained, testURI,
                        { from: owner, value: prize }
                    )
                    await this.testCreator.createTest(
                        50, 3, 1, credentialLimit, timeLimit, [solutionHashA, answerHashesA_root], requiredPass, credentialsGained, testURI,
                        { from: owner, value: prize }
                    )
                })

                it('returns the root of the answer hash tree for this testId', async function () {
                    expect(await this.testCreator.getAnswerHashesRoot('7'))
                        .to.be.bignumber.equal(answerHashesA_root.toString())
                    
                    expect(await this.testCreator.getAnswerHashesRoot('8'))
                        .to.be.bignumber.equal(answerHashesA_root.toString())
                })
            })
        })

        describe('getTest', function () {
            context('when the given testId does not exist', function () {
                it('reverts', async function () {
                    await expectRevert(
                        this.testCreator.getTest(nonExistentTokenId)
                        ,
                        "Test does not exist"
                    )
                })
            })

            context('after minting a given testId', function () {

                it('returns the given on chain test for this testId', async function () {
                    expect((await this.testCreator.getTest('1')).slice(0,9).map(n => { return n.toString() }))
                        .to.deep.equal([
                            '200',
                            '1',
                            '100',
                            '0',
                            credentialLimit,
                            timeLimit,
                            requiredPass,
                            prize,
                            credentialsGained
                    ])
                    expect((await this.testCreator.getTest('3')).slice(0,9).map(n => { return n.toString() }))
                        .to.deep.equal([
                            '100',
                            '3',
                            '1',
                            '0',
                            credentialLimit,
                            timeLimit,
                            requiredPass,
                            prize,
                            credentialsGained
                    ])
                    expect((await this.testCreator.getTest('5')).slice(0,9).map(n => { return n.toString() }))
                        .to.deep.equal([
                            '50',
                            '3',
                            '1',
                            '0',
                            credentialLimit,
                            timeLimit,
                            requiredPass,
                            prize,
                            credentialsGained
                    ])
                })
            })
        })

        describe('invalidateTest', function () {
            context('when deleting a nonexistent test', function () {
                it('reverts', async function () {
                    await expectRevert(
                        this.testCreator.invalidateTest(nonExistentTokenId, { from: owner })
                        ,
                        "Test does not exist"
                    )
                })
            })

            context('when deleting a token that is not own', function () {
                it('reverts', async function () {
                    await expectRevert(
                        this.testCreator.invalidateTest(new BN('1'), { from: newOwner })
                        ,
                        "Deleting test that is not own"
                    )
                    await expectRevert(
                        this.testCreator.invalidateTest(new BN('3'), { from: newOwner })
                        ,
                        "Deleting test that is not own"
                    )
                    await expectRevert(
                        this.testCreator.invalidateTest(new BN('5'), { from: newOwner })
                        ,
                        "Deleting test that is not own"
                    )
                })
            })

            context('with a successful invalidation', function () {
                let tx1, tx2, tx3
                

                beforeEach(async function () {
                    tx1 = await this.testCreator.invalidateTest('1', { from: owner })
                    tx2 = await this.testCreator.invalidateTest('3', { from: owner })
                    tx3 = await this.testCreator.invalidateTest('5', { from: owner })
                })

                it('reflects the invalidation in the on chain test object', async function () {
                    expect((await this.testCreator.getTest('1')).slice(0,9).map(n => { return n.toString() }))
                        .to.deep.equal([
                            '0',
                            '1',
                            '100',
                            '0',
                            credentialLimit,
                            timeLimit,
                            requiredPass,
                            prize,
                            credentialsGained
                        ])
                    expect((await this.testCreator.getTest('3')).slice(0,9).map(n => { return n.toString() }))
                        .to.deep.equal([
                            '0',
                            '3',
                            '1',
                            '0',
                            credentialLimit,
                            timeLimit,
                            requiredPass,
                            prize,
                            credentialsGained
                        ])
                    expect((await this.testCreator.getTest('5')).slice(0,9).map(n => { return n.toString() }))
                        .to.deep.equal([
                            '0',
                            '3',
                            '1',
                            '0',
                            credentialLimit,
                            timeLimit,
                            requiredPass,
                            prize,
                            credentialsGained
                        ])
                })

                it('does not allow the solving of tests', async function () {
                    await expectRevert(
                        this.testCreator.solveTest(
                            '1',
                            [multipleProofA.pi_a[0], multipleProofA.pi_a[1]],
                            [[multipleProofA.pi_b[0][1], multipleProofA.pi_b[0][0]], [multipleProofA.pi_b[1][1], multipleProofA.pi_b[1][0]]],
                            [multipleProofA.pi_c[0], multipleProofA.pi_c[1]],
                            multiplePublicA,
                            { from: solver }
                        )                        
                        ,
                        "Test has been deleted and can no longer be solved"
                    )
                    await expectRevert(
                        this.testCreator.solveTest(
                            '3',
                            [openProofA.pi_a[0], openProofA.pi_a[1]],
                            [[openProofA.pi_b[0][1], openProofA.pi_b[0][0]], [openProofA.pi_b[1][1], openProofA.pi_b[1][0]]],
                            [openProofA.pi_c[0], openProofA.pi_c[1]],
                            openPublicA,
                            { from: solver }
                        )                        
                        ,
                        "Test has been deleted and can no longer be solved"
                    )
                    await expectRevert(
                        this.testCreator.solveTest(
                            '5',
                            [mixedProofA.pi_a[0], mixedProofA.pi_a[1]],
                            [[mixedProofA.pi_b[0][1], mixedProofA.pi_b[0][0]], [mixedProofA.pi_b[1][1], mixedProofA.pi_b[1][0]]],
                            [mixedProofA.pi_c[0], mixedProofA.pi_c[1]],
                            mixedPublicA,
                            { from: solver }
                        )                        
                        ,
                        "Test has been deleted and can no longer be solved"
                    )
                })
                
                it('cannot be reverted or invalidated again', async function () {
                    await expectRevert(
                        this.testCreator.invalidateTest('1', { from: owner })
                        ,
                        "Test was already invalidated"
                    )
                    await expectRevert(
                        this.testCreator.invalidateTest('3', { from: owner })
                        ,
                        "Test was already invalidated"
                    )
                    await expectRevert(
                        this.testCreator.invalidateTest('5', { from: owner })
                        ,
                        "Test was already invalidated"
                    )
                })

                it('sends the funds back if the test was never solved', async function () {
                    const sendsFundsBack = async (tokenId) => {
                        let startBalance = BigInt(await web3.eth.getBalance(owner))

                        let txDict = await this.testCreator.invalidateTest(tokenId, { from: owner })
                        let txFee = BigInt(txDict.receipt.gasUsed.toString()) * BigInt(txDict.receipt.effectiveGasPrice.toString())

                        let endBalance = BigInt(await web3.eth.getBalance(owner))

                        const balanceGain = endBalance - startBalance
                        const expectedGain = BigInt(prize) - txFee

                        expect(balanceGain).to.be.equal(expectedGain)
                    }

                    await sendsFundsBack('2')
                    await sendsFundsBack('4')
                    await sendsFundsBack('6')
                })
                
                it('does not send any funds back if the test did not include a prize', async function () {
                    await this.testCreator.createTest(
                        200, 1, 100, credentialLimit, timeLimit, [solutionHashA], requiredPass, credentialsGained, testURI,
                        { from: owner }
                    )
                    await this.testCreator.createTest(
                        100, 3, 1, credentialLimit, timeLimit, [answerHashesA_root], requiredPass, credentialsGained, testURI,
                        { from: owner }
                    )
                    await this.testCreator.createTest(
                        50, 3, 1, credentialLimit, timeLimit, [solutionHashA, answerHashesA_root], requiredPass, credentialsGained, testURI,
                        { from: owner }
                    )

                    const noFundsBack = async (tokenId) => {
                        let startBalance = BigInt(await web3.eth.getBalance(owner))

                        let txDict = await this.testCreator.invalidateTest(tokenId, { from: owner })
                        let txFee = BigInt(txDict.receipt.gasUsed.toString()) * BigInt(txDict.receipt.effectiveGasPrice.toString())

                        let endBalance = BigInt(await web3.eth.getBalance(owner))
                        
                        const balanceGain = endBalance - startBalance
                        const expectedGain = - txFee

                        expect(balanceGain).to.be.equal(expectedGain)
                    }

                    await noFundsBack('7')
                    await noFundsBack('8')
                    await noFundsBack('9')
                })

                it('does not send any funds back if the test was solved once', async function () {
                    const noFundsBack = async (tokenId, proof, input) => {
                        let startBalance = BigInt(await web3.eth.getBalance(owner))

                        await this.testCreator.solveTest(
                            tokenId,
                            [proof.pi_a[0], proof.pi_a[1]],
                            [[proof.pi_b[0][1], proof.pi_b[0][0]], [proof.pi_b[1][1], proof.pi_b[1][0]]],
                            [proof.pi_c[0], proof.pi_c[1]],
                            input,
                            { from: solver }
                        )

                        let txDict = await this.testCreator.invalidateTest(tokenId, { from: owner })
                    
                        let txFee = BigInt(txDict.receipt.gasUsed.toString()) * BigInt(txDict.receipt.effectiveGasPrice.toString())

                        let endBalance = BigInt(await web3.eth.getBalance(owner))

                        const balanceGain = endBalance - startBalance
                        const expectedGain = - txFee

                        expect(balanceGain).to.be.equal(expectedGain)
                    }

                    await noFundsBack('2', multipleProofB, multiplePublicB)
                    await noFundsBack('4', openProofB, openPublicB)
                    await noFundsBack('6', mixedProofB, mixedPublicB)
                })

                it('emits a transfer event', async function () {
                    expectEvent(tx1, 'Transfer', { from: owner, to: ZERO_ADDRESS, tokenId: new BN('1')})
                    expectEvent(tx2, 'Transfer', { from: owner, to: ZERO_ADDRESS, tokenId: new BN('3')})
                    expectEvent(tx3, 'Transfer', { from: owner, to: ZERO_ADDRESS, tokenId: new BN('5')})
                })
            })
        })

        describe('solveTest', function () {

            context('when the given testId does not exist', function () {
                it('reverts', async function () {
                    await expectRevert(
                        this.testCreator.solveTest(
                            nonExistentTokenId,
                            [multipleProofA.pi_a[0], multipleProofA.pi_a[1]],
                            [[multipleProofA.pi_b[0][1], multipleProofA.pi_b[0][0]], [multipleProofA.pi_b[1][1], multipleProofA.pi_b[1][0]]],
                            [multipleProofA.pi_c[0], multipleProofA.pi_c[1]],
                            multiplePublicA,
                            { from: solver }
                        )
                        ,
                        "Solving test that does not exist"
                    )
                })
            })

            context('when the given salt was already used', function () {
                beforeEach(async function () {
                    await solveTest(this.testCreator, '1', multipleProofA, multiplePublicA)
                    await solveTest(this.testCreator, '3', openProofA, openPublicA)
                    await solveTest(this.testCreator, '5', mixedProofA, mixedPublicA)
                })

                it('reverts', async function () {
                    await expectRevert(
                        solveTest(this.testCreator, '1', multipleProofA, multiplePublicA, altSolver)
                        ,
                        "Salt was already used"
                    )
                    await expectRevert(
                        solveTest(this.testCreator, '3', openProofA, openPublicA, altSolver)
                        ,
                        "Salt was already used"
                    )
                    await expectRevert(
                        solveTest(this.testCreator, '5', mixedProofA, mixedPublicA, altSolver)
                        ,
                        "Salt was already used"
                    )
                })
            })

            context('when the owner tries to solve the test', function () {
                it('reverts', async function () {
                    await expectRevert(
                        solveTest(this.testCreator, '1', multipleProofA, multiplePublicA, owner)
                        ,
                        "Test cannot be solved by owner"
                    )
                    await expectRevert(
                        solveTest(this.testCreator, '3', openProofA, openPublicA, owner)
                        ,
                        "Test cannot be solved by owner"
                    )
                    await expectRevert(
                        solveTest(this.testCreator, '5', mixedProofA, mixedPublicA, owner)
                        ,
                        "Test cannot be solved by owner"
                    )
                })
            })

            context('when the number of credentials have been reached', function () {
                beforeEach(async function () {
                    await this.testCreator.createTest(
                        200, 1, 100, 1, timeLimit, [solutionHashA], requiredPass, credentialsGained, testURI,
                        { from: owner, value: prize }
                    )
                    await this.testCreator.createTest(
                        100, 3, 1, 1, timeLimit, [answerHashesA_root], requiredPass, credentialsGained, testURI,
                        { from: owner, value: prize }
                    )
                    await this.testCreator.createTest(
                        50, 3, 1, 1, timeLimit, [solutionHashA, answerHashesA_root], requiredPass, credentialsGained, testURI,
                        { from: owner, value: prize }
                    )

                    await solveTest(this.testCreator, '7', multipleProofA, multiplePublicA)
                    await solveTest(this.testCreator, '8', openProofA, openPublicA)
                    await solveTest(this.testCreator, '9', mixedProofA, mixedPublicA)
                })
                
                it('reverts', async function () {
                    await expectRevert(
                        solveTest(this.testCreator, '7', altMultipleProofA, altMultiplePublicA, altSolver)
                        ,
                        "Maximum number of credentials reached"
                    )
                    await expectRevert(
                        solveTest(this.testCreator, '8', altOpenProofA, altOpenPublicA, altSolver)
                        ,
                        "Maximum number of credentials reached"
                    )
                    await expectRevert(
                        solveTest(this.testCreator, '9', altMixedProofA, altMixedPublicA, altSolver)
                        ,
                        "Maximum number of credentials reached"
                    )
                })
            })

            context('when the time limit has been reached', function () {
                beforeEach(async function () {
                    const blockNum = await web3.eth.getBlockNumber()
                    const block = await web3.eth.getBlock(blockNum)
                    const nearTimeLimit = block['timestamp'] + 100;
                    
                    await this.testCreator.createTest(
                        200, 1, 100, credentialLimit, nearTimeLimit, [solutionHashA], requiredPass, credentialsGained, testURI,
                        { from: owner, value: prize }
                    )
                    await this.testCreator.createTest(
                        100, 3, 1, credentialLimit, nearTimeLimit, [answerHashesA_root], requiredPass, credentialsGained, testURI,
                        { from: owner, value: prize }
                    )
                    await this.testCreator.createTest(
                        50, 3, 1, credentialLimit, nearTimeLimit, [solutionHashA, answerHashesA_root], requiredPass, credentialsGained, testURI,
                        { from: owner, value: prize }
                    )
                    
                    // can solve now
                    await solveTest(this.testCreator, '7', multipleProofA, multiplePublicA)
                    await solveTest(this.testCreator, '8', openProofA, openPublicA)
                    await solveTest(this.testCreator, '9', mixedProofA, mixedPublicA)
                })
                
                it('reverts', async function () {
                    // but not later
                    await time.increase(time.duration.seconds(101));
                    await expectRevert(
                        solveTest(this.testCreator, '7', altMultipleProofA, altMultiplePublicA, altSolver)
                        ,
                        "Time limit for this credential reached"
                    )
                    await expectRevert(
                        solveTest(this.testCreator, '8', altOpenProofA, altOpenPublicA, altSolver)
                        ,
                        "Time limit for this credential reached"
                    )
                    await expectRevert(
                        solveTest(this.testCreator, '9', altMixedProofA, altMixedPublicA, altSolver)
                        ,
                        "Time limit for this credential reached"
                    )
                })
            })

            context('when giving an invalid input length', function () {
                it('reverts', async function () {
                    await expectRevert(
                        this.testCreator.solveTest(
                            '1',
                            [multipleProofA.pi_a[0], multipleProofA.pi_a[1]],
                            [[multipleProofA.pi_b[0][1], multipleProofA.pi_b[0][0]], [multipleProofA.pi_b[1][1], multipleProofA.pi_b[1][0]]],
                            [multipleProofA.pi_c[0], multipleProofA.pi_c[1]],
                            ['1'],
                            { from: solver }
                        )
                        ,
                        "Invalid input length"
                    )
                    await expectRevert(
                        this.testCreator.solveTest(
                            '3',
                            [openProofA.pi_a[0], openProofA.pi_a[1]],
                            [[openProofA.pi_b[0][1], openProofA.pi_b[0][0]], [openProofA.pi_b[1][1], openProofA.pi_b[1][0]]],
                            [openProofA.pi_c[0], openProofA.pi_c[1]],
                            ['1'],
                            { from: solver }
                        )
                        ,
                        "Invalid input length"
                    )
                    await expectRevert(
                        this.testCreator.solveTest(
                            '5',
                            [mixedProofA.pi_a[0], mixedProofA.pi_a[1]],
                            [[mixedProofA.pi_b[0][1], mixedProofA.pi_b[0][0]], [mixedProofA.pi_b[1][1], mixedProofA.pi_b[1][0]]],
                            [mixedProofA.pi_c[0], mixedProofA.pi_c[1]],
                            ['1', '6'],
                            { from: solver }
                        )
                        ,
                        "Invalid input length"
                    )
                })
            })

            context('when giving an invalid proof', function () {
                it('reverts', async function () {
                    await expectRevert(
                        this.testCreator.solveTest(
                            '1',
                            [multipleProofA.pi_a[0], multipleProofA.pi_a[1]],
                            [[multipleProofA.pi_b[0][0], multipleProofA.pi_b[0][1]], [multipleProofA.pi_b[1][1], multipleProofA.pi_b[1][0]]],
                            [multipleProofA.pi_c[0], multipleProofA.pi_c[1]],
                            multiplePublicA,
                            { from: solver }
                        )
                        ,
                        "invalid opcode"
                    )
                    await expectRevert(
                        this.testCreator.solveTest(
                            '3',
                            [openProofA.pi_a[0], openProofA.pi_a[1]],
                            [[openProofA.pi_b[0][0], openProofA.pi_b[0][1]], [openProofA.pi_b[1][1], openProofA.pi_b[1][0]]],
                            [openProofA.pi_c[0], openProofA.pi_c[1]],
                            openPublicA,
                            { from: solver }
                        )
                        ,
                        "invalid opcode"
                    )
                    await expectRevert(
                        this.testCreator.solveTest(
                            '5',
                            [mixedProofA.pi_a[0], mixedProofA.pi_a[1]],
                            [[mixedProofA.pi_b[0][0], mixedProofA.pi_b[0][1]], [mixedProofA.pi_b[1][1], mixedProofA.pi_b[1][0]]],
                            [mixedProofA.pi_c[0], mixedProofA.pi_c[1]],
                            mixedPublicA,
                            { from: solver }
                        )
                        ,
                        "invalid opcode"
                    )
                })
            })

            context('when verification is not successful', function () {
                it('reverts', async function () {
                    await expectRevert(
                        solveTest(this.testCreator, '1', multipleProofB, multiplePublicB, altSolver)
                        ,
                        'Wrong solution'
                    )
                    await expectRevert(
                        solveTest(this.testCreator, '3', wrongOpenProofA, wrongOpenPublicA, altSolver)
                        ,
                        "Grade is below minimum"
                    )
                    await expectRevert(
                        solveTest(this.testCreator, '5', wrongMixedProofA, wrongMixedPublicA, altSolver)
                        ,
                        "Grade is below minimum"
                    )
                })
            })

            context('when grade obtained is below minimum', function () {
                it('reverts', async function () {
                    // Minting tests with perfect requirement
                    await this.testCreator.createTest(
                        100, 64, 100, credentialLimit, timeLimit, [answerHashesB_root], requiredPass, credentialsGained, testURI,
                        { from: owner, value: prize }
                    )
                    await this.testCreator.createTest(
                        50, 64, 100, credentialLimit, timeLimit, [solutionHashB, answerHashesB_root], requiredPass, credentialsGained, testURI,
                        { from: owner, value: prize }
                    )
                    // Solving with unpar solution
                    await expectRevert(
                        solveTest(this.testCreator, '7', openProofB, openPublicB)
                        ,
                        "Grade is below minimum"
                    )
                    await expectRevert(
                        solveTest(this.testCreator, '8', mixedProofB, mixedPublicB)
                        ,
                        "Grade is below minimum"
                    )
                    // Solving with perfect solution clears
                    solveTest(this.testCreator, '7', altOpenProofB, altOpenPublicB)
                    solveTest(this.testCreator, '8', altMixedProofB, altMixedPublicB)
                })
            })

            context('after getting a credential without acing it', function () {
                it('lets you improve the result from previous one only by providing a better solution', async function () {
                    await solveTest(this.testCreator, '4', openProofB, openPublicB)
                    await solveTest(this.testCreator, '6', mixedProofB, mixedPublicB)

                    await solveTest(this.testCreator, '4', altOpenProofB, altOpenPublicB)
                    await solveTest(this.testCreator, '6', altMixedProofB, altMixedPublicB)
                })

                it('does not let you change the result if given a worse one', async function () {
                    await solveTest(this.testCreator, '4', altOpenProofB, altOpenPublicB)
                    await solveTest(this.testCreator, '6', altMixedProofB, altMixedPublicB)

                    await expectRevert(
                        solveTest(this.testCreator, '4', openProofB, openPublicB)
                        ,
                        "Your existing credential has a better result"
                    )

                    await expectRevert(
                        solveTest(this.testCreator, '6', mixedProofB, mixedPublicB)
                        ,
                        "Your existing credential has a better result"
                    )
                })

                it('does not increase the number of solvers', async function () {
                    await solveTest(this.testCreator, '4', openProofB, openPublicB)
                    await solveTest(this.testCreator, '6', mixedProofB, mixedPublicB)

                    await solveTest(this.testCreator, '4', altOpenProofB, altOpenPublicB)
                    await solveTest(this.testCreator, '6', altMixedProofB, altMixedPublicB)

                    expect((await this.testCreator.getTest('4')).solvers)
                        .to.be.bignumber.equal('1')

                    expect((await this.testCreator.getTest('6')).solvers)
                        .to.be.bignumber.equal('1')
                })

                it('does not mint new credential NFTs', async function () {
                    await solveTest(this.testCreator, '4', openProofB, openPublicB)
                    await solveTest(this.testCreator, '6', mixedProofB, mixedPublicB)

                    await solveTest(this.testCreator, '4', altOpenProofB, altOpenPublicB)
                    await solveTest(this.testCreator, '6', altMixedProofB, altMixedPublicB)

                    expect(await this.credentials.balanceOf(solver))
                        .to.be.bignumber.equal('2')
                })
            })

            context('when the caller does not own the required pass', function () {
                beforeEach(async function () {
                    await this.testCreator.createTest(
                        200, 1, 100, credentialLimit, timeLimit, [solutionHashA], this.valid.address, credentialsGained, testURI,
                        { from: owner, value: prize }
                    )
                    await this.testCreator.createTest(
                        100, 3, 1, credentialLimit, timeLimit, [answerHashesA_root], this.valid.address, credentialsGained, testURI,
                        { from: owner, value: prize }
                    )
                    await this.testCreator.createTest(
                        50, 3, 1, credentialLimit, timeLimit, [solutionHashA, answerHashesA_root], this.valid.address, credentialsGained, testURI,
                        { from: owner, value: prize }
                    )
                })

                it('reverts', async function () {
                    await expectRevert(
                        solveTest(this.testCreator, '7', multipleProofA, multiplePublicA)
                        ,
                        "Solver does not own the required token"
                    )
                    await expectRevert(
                        solveTest(this.testCreator, '8', openProofA, openPublicA)
                        ,
                        "Solver does not own the required token"
                    )
                    await expectRevert(
                        solveTest(this.testCreator, '9', mixedProofA, mixedPublicA)
                        ,
                        "Solver does not own the required token"
                    )
                })
            })

            context('when the caller owns the required pass', function () {
                beforeEach(async function () {
                    await this.testCreator.createTest(
                        200, 1, 100, credentialLimit, timeLimit, [solutionHashA], this.valid.address, credentialsGained, testURI,
                        { from: owner, value: prize }
                    )
                    await this.testCreator.createTest(
                        100, 3, 1, credentialLimit, timeLimit, [answerHashesA_root], this.valid.address, credentialsGained, testURI,
                        { from: owner, value: prize }
                    )
                    await this.testCreator.createTest(
                        50, 3, 1, credentialLimit, timeLimit, [solutionHashA, answerHashesA_root], this.valid.address, credentialsGained, testURI,
                        { from: owner, value: prize }
                    )

                    await this.valid.mint(solver, firstTokenId)
                })

                it('solves the test', async function () {
                    // solving tx clears
                    await solveTest(this.testCreator, '1', multipleProofA, multiplePublicA)
                    await solveTest(this.testCreator, '3', openProofA, openPublicA)
                    await solveTest(this.testCreator, '5', mixedProofA, mixedPublicA)
                })
            })

            context('when verification is successful', function () {
                let tx1, tx2, tx3

                beforeEach(async function () {
                    tx1 = await this.testCreator.solveTest(
                        '1',
                        [multipleProofA.pi_a[0], multipleProofA.pi_a[1]],
                        [[multipleProofA.pi_b[0][1], multipleProofA.pi_b[0][0]], [multipleProofA.pi_b[1][1], multipleProofA.pi_b[1][0]]],
                        [multipleProofA.pi_c[0], multipleProofA.pi_c[1]],
                        multiplePublicA,
                        { from: solver }
                    )
                    tx2 = await this.testCreator.solveTest(
                        '3',
                        [openProofA.pi_a[0], openProofA.pi_a[1]],
                        [[openProofA.pi_b[0][1], openProofA.pi_b[0][0]], [openProofA.pi_b[1][1], openProofA.pi_b[1][0]]],
                        [openProofA.pi_c[0], openProofA.pi_c[1]],
                        openPublicA,
                        { from: solver }
                    )
                    tx3 = await this.testCreator.solveTest(
                        '5',
                        [mixedProofA.pi_a[0], mixedProofA.pi_a[1]],
                        [[mixedProofA.pi_b[0][1], mixedProofA.pi_b[0][0]], [mixedProofA.pi_b[1][1], mixedProofA.pi_b[1][0]]],
                        [mixedProofA.pi_c[0], mixedProofA.pi_c[1]],
                        mixedPublicA,
                        { from: solver }
                    )
                })

                it('updates the on chain test object', async function () {
                    expect((await this.testCreator.getTest('1')).slice(0,9).map(n => { return n.toString() }))
                        .to.deep.equal([
                            '200',
                            '1',
                            '100',
                            '1',
                            credentialLimit,
                            timeLimit,
                            requiredPass,
                            prize,
                            credentialsGained
                        ])
                    expect((await this.testCreator.getTest('3')).slice(0,9).map(n => { return n.toString() }))
                        .to.deep.equal([
                            '100',
                            '3',
                            '1',
                            '1',
                            credentialLimit,
                            timeLimit,
                            requiredPass,
                            prize,
                            credentialsGained
                        ])
                    expect((await this.testCreator.getTest('5')).slice(0,9).map(n => { return n.toString() }))
                        .to.deep.equal([
                            '50',
                            '3',
                            '1',
                            '1',
                            credentialLimit,
                            timeLimit,
                            requiredPass,
                            prize,
                            credentialsGained
                        ])
                })

                it('pays the first solver but not the following ones', async function () {

                    const paysFirstNotFollowing = async (tokenId, proof, public, altProof, altPublic) => {
                        let startBalance = BigInt(await web3.eth.getBalance(solver))

                        // First solver
                        let txDict = await this.testCreator.solveTest(
                            tokenId,
                            [proof.pi_a[0], proof.pi_a[1]],
                            [[proof.pi_b[0][1], proof.pi_b[0][0]], [proof.pi_b[1][1], proof.pi_b[1][0]]],
                            [proof.pi_c[0], proof.pi_c[1]],
                            public,
                            { from: solver }
                        )

                        let txFee = BigInt(txDict.receipt.gasUsed.toString()) * BigInt(txDict.receipt.effectiveGasPrice.toString())
                        
                        let endBalance = BigInt(await web3.eth.getBalance(solver))

                        const balanceGain = endBalance - startBalance
                        const expectedGain = BigInt(prize) - txFee

                        expect(balanceGain).to.be.equal(expectedGain)
                        
                        // Second solver
                        let altStartBalance = BigInt(await web3.eth.getBalance(altSolver))
                        let altTxDict = await this.testCreator.solveTest(
                            tokenId,
                            [altProof.pi_a[0], altProof.pi_a[1]],
                            [[altProof.pi_b[0][1], altProof.pi_b[0][0]], [altProof.pi_b[1][1], altProof.pi_b[1][0]]],
                            [altProof.pi_c[0], altProof.pi_c[1]],
                            altPublic,
                            { from: altSolver }
                        )

                        let altTxFee = BigInt(altTxDict.receipt.gasUsed.toString()) * BigInt(altTxDict.receipt.effectiveGasPrice.toString())

                        let altEndBalance = BigInt(await web3.eth.getBalance(altSolver))

                        const altBalanceGain = altEndBalance - altStartBalance
                        const altExpectedGain = - altTxFee

                        expect(altExpectedGain).to.be.equal(altBalanceGain)
                    }

                    await paysFirstNotFollowing('2', multipleProofB, multiplePublicB, altMultipleProofB, altMultiplePublicB)
                    await paysFirstNotFollowing('4', openProofB, openPublicB, altOpenProofB, altOpenPublicB)
                    await paysFirstNotFollowing('6', mixedProofB, mixedPublicB, altMixedProofB, altMixedPublicB)
                
                })

                it('does not pay the solver if no prize was specified', async function () {

                    await this.testCreator.createTest(
                        200, 1, 100, credentialLimit, timeLimit, [solutionHashA], requiredPass, credentialsGained, testURI,
                        { from: owner }
                    )
                    await this.testCreator.createTest(
                        100, 3, 1, credentialLimit, timeLimit, [answerHashesA_root], requiredPass, credentialsGained, testURI,
                        { from: owner }
                    )
                    await this.testCreator.createTest(
                        50, 3, 1, credentialLimit, timeLimit, [solutionHashA, answerHashesA_root], requiredPass, credentialsGained, testURI,
                        { from: owner }
                    )

                    const noPayback = async (tokenId, proof, public) => {
                        let startBalance = BigInt(await web3.eth.getBalance(altSolver))
                        
                        let txDict = await this.testCreator.solveTest(
                            tokenId,
                            [proof.pi_a[0], proof.pi_a[1]],
                            [[proof.pi_b[0][1], proof.pi_b[0][0]], [proof.pi_b[1][1], proof.pi_b[1][0]]],
                            [proof.pi_c[0], proof.pi_c[1]],
                            public,
                            { from: altSolver }
                        )
                        let txFee = BigInt(txDict.receipt.gasUsed.toString()) * BigInt(txDict.receipt.effectiveGasPrice.toString())

                        let endBalance = BigInt(await web3.eth.getBalance(altSolver))

                        const balanceGain = endBalance - startBalance
                        const expectedGain = - txFee

                        expect(balanceGain).to.be.equal(expectedGain)
                    }
                    
                    await noPayback('7', altMultipleProofA, altMultiplePublicA)
                    await noPayback('8', altOpenProofA, altOpenPublicA)
                    await noPayback('9', altMixedProofA, altMixedPublicA)
                })

                it('mints a new credential NFT for the solver', async function () {
                    expect(await this.credentials.balanceOf(solver))
                        .to.be.bignumber.equal('3')
                })

                it('emits a transfer event for the credential', async function () {
                    expectEvent(tx1, 'Transfer', { from: this.testCreator.address, to: solver, tokenId: '1' })
                    expectEvent(tx2, 'Transfer', { from: this.testCreator.address, to: solver, tokenId: '3' })
                    expectEvent(tx3, 'Transfer', { from: this.testCreator.address, to: solver, tokenId: '5' })
                })

                context('when solver already gained credentials', function () {
                    it('reverts', async function () {
                        await expectRevert(
                            solveTest(this.testCreator, '1', altMultipleProofA, altMultiplePublicA)
                            ,
                            'Your existing credential has a better result'
                        )
                        await expectRevert(
                            solveTest(this.testCreator, '3', altOpenProofA, altOpenPublicA)
                            ,
                            'Your existing credential has a better result'
                        )
                        await expectRevert(
                            solveTest(this.testCreator, '5', altMixedProofA, altMixedPublicA)
                            ,
                            'Your existing credential has a better result'
                        )
                    })
                })
            })
        })
    })
}

module.exports = {
    shouldBehaveLiketestCreator
};