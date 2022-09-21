const { BN, constants, time, expectEvent, expectRevert, balance } = require('@openzeppelin/test-helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');
const { expect } = require('chai');
const poseidon = require("./utils/poseidon.js");
const keccak256 = require('keccak256')
const { ZERO_ADDRESS } = constants;

const firstTokenId = new BN('1');
const secondTokenId = new BN('2');
const thirdTokenId = new BN('3');
const nonExistentTokenId = new BN('10');

const testerURI = 'https://deenz.dev';
const timeLimit = "4294967295";
const credentialLimit = "4294967295";
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
const answerHashesB = new Array(50).fill(
    poseidon([BigInt('0x' + keccak256("deenz").toString('hex'))])
);

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


function shouldBehaveLikeTesterCreator(owner, newOwner, solver, altSolver, operator, other) {

    const solveTester = async (testerContract, tokenId, proof, input, caller = solver) => {
        await testerContract.solveTester(
            tokenId,
            [proof.pi_a[0], proof.pi_a[1]],
            [[proof.pi_b[0][1], proof.pi_b[0][0]], [proof.pi_b[1][1], proof.pi_b[1][0]]],
            [proof.pi_c[0], proof.pi_c[1]],
            input,
            { from: caller }
        )
    }

    context('without created tests', function () {
        describe('createTester', function () {
            context('when the time limit is less than the current time', function () {
                it('reverts', async function () {
                    const pastTime = Math.floor(Date.now() / 1000) - 10;
                    await expectRevert(
                        this.testerCreator.createMultipleChoiceTest(
                            testerURI, solutionHashA, pastTime, credentialLimit, requiredPass, credentialsGained,
                            { from: owner, value: prize }
                        )
                        ,
                        "Time limit is in the past"   
                    )
                    await expectRevert(
                        this.testerCreator.createOpenAnswerTest(
                            testerURI, answerHashesA, pastTime, credentialLimit, requiredPass, credentialsGained,
                            { from: owner, value: prize }
                        )
                        ,
                        "Time limit is in the past"  
                    )
                    await expectRevert(
                        this.testerCreator.createMixedTest(
                            testerURI, solutionHashA, answerHashesA, pastTime, credentialLimit, requiredPass, credentialsGained,
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
                        this.testerCreator.createMultipleChoiceTest(
                            testerURI, solutionHashA, timeLimit, 0, requiredPass, credentialsGained,
                            { from: owner, value: prize }
                        )
                        ,
                        "Credential limit must be above zero"   
                    )
                    await expectRevert(
                        this.testerCreator.createOpenAnswerTest(
                            testerURI, answerHashesA, timeLimit, 0, requiredPass, credentialsGained,
                            { from: owner, value: prize }
                        )
                        ,
                        "Credential limit must be above zero" 
                    )
                    await expectRevert(
                        this.testerCreator.createMixedTest(
                            testerURI, solutionHashA, answerHashesA, timeLimit, 0, requiredPass, credentialsGained,
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
                        this.testerCreator.createMultipleChoiceTest(
                            testerURI, solutionHashA, timeLimit, credentialLimit, this.malicious.address, credentialsGained,
                            { from: owner, value: prize }
                        )
                    )
                    await expectRevert.unspecified(
                        this.testerCreator.createOpenAnswerTest(
                            testerURI, answerHashesA, timeLimit, credentialLimit, this.malicious.address, credentialsGained,
                            { from: owner, value: prize }
                        )
                    )
                    await expectRevert.unspecified(
                        this.testerCreator.createMixedTest(
                            testerURI, solutionHashA, answerHashesA, timeLimit, credentialLimit, this.malicious.address, credentialsGained,
                            { from: owner, value: prize }
                        )
                        ,
                        "Time limit is in the past"   
                    )
                })
            })

            context('when providing a valid contract as the required pass', function () {
                it('mints a new tester', async function () {
                    // tx clears
                    await this.testerCreator.createMultipleChoiceTest(
                        testerURI, solutionHashA, timeLimit, credentialLimit, this.valid.address, credentialsGained,
                        { from: owner, value: prize }
                    );
                    await this.testerCreator.createOpenAnswerTest(
                        testerURI, answerHashesA, timeLimit, credentialLimit, this.valid.address, credentialsGained,
                        { from: owner, value: prize }
                    )
                    await this.testerCreator.createMixedTest(
                        testerURI, solutionHashA, answerHashesA, timeLimit, credentialLimit, this.valid.address, credentialsGained,
                        { from: owner, value: prize }
                    )
                })
            })

            context('when providing more answer hashes than supported', function () {
                it('reverts', async function () {
                    const tooManyQuestions = new Array(51).fill(poseidon([BigInt('0x' + keccak256('sneed').toString('hex'))]));
                    await expectRevert(
                        this.testerCreator.createOpenAnswerTest(
                            testerURI, tooManyQuestions, timeLimit, credentialLimit, requiredPass, credentialsGained,
                            { from: owner, value: prize }
                        )
                        ,
                        "Number of questions must be < 50"
                    )
                    await expectRevert(
                        this.testerCreator.createMixedTest(
                            testerURI, solutionHashA, tooManyQuestions, timeLimit, credentialLimit, requiredPass, credentialsGained,
                            { from: owner, value: prize }
                        )
                        ,
                        "Number of questions must be < 50"
                    )
                })
            })

            context('after a succesful mint (tester creation)', function () {
                let tx1, tx2, tx3

                beforeEach(async function () {
                    tx1 = await this.testerCreator.createMultipleChoiceTest(
                        testerURI, solutionHashA, timeLimit, credentialLimit, requiredPass, credentialsGained,
                        { from: owner, value: prize }
                    );
                    tx2 = await this.testerCreator.createOpenAnswerTest(
                        testerURI, answerHashesA, timeLimit, credentialLimit, requiredPass, credentialsGained,
                        { from: owner, value: prize }
                    )
                    tx3 = await this.testerCreator.createMixedTest(
                        testerURI, solutionHashA, answerHashesA, timeLimit, credentialLimit, requiredPass, credentialsGained,
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

        describe('testerExists', function () {
            context('when the given testerId does not exist', function () {
                it('returns false', async function () {
                    expect(await this.testerCreator.testerExists(nonExistentTokenId))
                        .to.be.false
                })
            })

            context('after minting a given testerId', function () {
                beforeEach(async function () {
                    await this.testerCreator.createMultipleChoiceTest(
                        testerURI, solutionHashA, timeLimit, credentialLimit, requiredPass, credentialsGained,
                        { from: owner, value: prize }
                    );
                   await this.testerCreator.createOpenAnswerTest(
                        testerURI, answerHashesA, timeLimit, credentialLimit, requiredPass, credentialsGained,
                        { from: owner, value: prize }
                    )
                    await this.testerCreator.createMixedTest(
                        testerURI, solutionHashA, answerHashesA, timeLimit, credentialLimit, requiredPass, credentialsGained,
                        { from: owner, value: prize }
                    )
                })

                it('returns true', async function () {
                    expect(await this.testerCreator.testerExists(firstTokenId))
                        .to.be.true
                    expect(await this.testerCreator.testerExists(secondTokenId))
                        .to.be.true
                    expect(await this.testerCreator.testerExists(thirdTokenId))
                        .to.be.true
                })
            })
        })
    })

    context('with created tests', function () {
        beforeEach(async function () {
            await this.testerCreator.createMultipleChoiceTest(
                testerURI, solutionHashA, timeLimit, credentialLimit, requiredPass, credentialsGained,
                { from: owner, value: prize }
            );
            await this.testerCreator.createMultipleChoiceTest(
                testerURI, solutionHashB, timeLimit, credentialLimit, requiredPass, credentialsGained,
                { from: owner, value: prize }
            );
            await this.testerCreator.createOpenAnswerTest(
                testerURI, answerHashesA, timeLimit, credentialLimit, requiredPass, credentialsGained,
                { from: owner, value: prize }
            )
            await this.testerCreator.createOpenAnswerTest(
                testerURI, answerHashesB, timeLimit, credentialLimit, requiredPass, credentialsGained,
                { from: owner, value: prize }
            )
            await this.testerCreator.createMixedTest(
                testerURI, solutionHashA, answerHashesA, timeLimit, credentialLimit, requiredPass, credentialsGained,
                { from: owner, value: prize }
            )
            await this.testerCreator.createMixedTest(
                testerURI, solutionHashB, answerHashesB, timeLimit, credentialLimit, requiredPass, credentialsGained,
                { from: owner, value: prize }
            )
        })

        describe('getMultipleChoiceTest', function () {
            context('when the given testerId does not exist', function () {
                it('reverts', async function () {
                    await expectRevert(
                        this.testerCreator.getMultipleChoiceTest(nonExistentTokenId)
                        ,
                        "Test does not exist"
                    )
                })
            })

            context('when the given testerId is not multipleChoice', function () {
                it('reverts', async function () {
                    await expectRevert(
                        this.testerCreator.getMultipleChoiceTest('3')
                        ,
                        "Test is not multiple choice or mixed"
                    )
                })
            })

            context('after minting a given testerId', function () {

                this.beforeEach(async function () {
                    await this.testerCreator.createMultipleChoiceTest(
                        testerURI, solutionHashA, timeLimit, credentialLimit, requiredPass, credentialsGained,
                        { from: owner, value: prize }
                    );
                    await this.testerCreator.createMixedTest(
                        testerURI, solutionHashA, answerHashesA, timeLimit, credentialLimit, requiredPass, credentialsGained,
                        { from: owner, value: prize }
                    )
                })

                it('returns the solution hash for this testerId', async function () {
                    // TODO
                })
            })
        })

        describe('getOpenAnswerTest', function () {
            context('when the given testerId does not exist', function () {
                it('reverts', async function () {
                    await expectRevert(
                        this.testerCreator.getOpenAnswerTest(nonExistentTokenId)
                        ,
                        "Test does not exist"
                    )
                })
            })

            context('when the given testerId is not openAnswer', function () {
                it('reverts', async function () {
                    await expectRevert(
                        this.testerCreator.getOpenAnswerTest('1')
                        ,
                        "Test is not open answer or mixed"
                    )
                })
            })

            context('after minting a given testerId', function () {
                this.beforeEach(async function () {
                    await this.testerCreator.createMultipleChoiceTest(
                        testerURI, solutionHashA, timeLimit, credentialLimit, requiredPass, credentialsGained,
                        { from: owner, value: prize }
                    );
                   await this.testerCreator.createOpenAnswerTest(
                        testerURI, answerHashesA, timeLimit, credentialLimit, requiredPass, credentialsGained,
                        { from: owner, value: prize }
                    )
                    await this.testerCreator.createMixedTest(
                        testerURI, solutionHashA, answerHashesA, timeLimit, credentialLimit, requiredPass, credentialsGained,
                        { from: owner, value: prize }
                    )
                })

                it('returns the list of solution hashes for this testerId', async function () {
                    // TODO
                })
            })
        })

        describe('getTester', function () {
            context('when the given testerId does not exist', function () {
                it('reverts', async function () {
                    await expectRevert(
                        this.testerCreator.getTester(nonExistentTokenId)
                        ,
                        "Test does not exist"
                    )
                })
            })

            context('after minting a given testerId', function () {

                it('returns the given on chain tester for this testerId', async function () {
                    expect((await this.testerCreator.getTester('1')).slice(0,7).map(n => { return n.toString() }))
                        .to.deep.equal([
                            '0',
                            prize,
                            '0',
                            timeLimit,
                            credentialLimit,
                            requiredPass,
                            credentialsGained
                        ])
                    expect((await this.testerCreator.getTester('3')).slice(0,7).map(n => { return n.toString() }))
                        .to.deep.equal([
                            '1',
                            prize,
                            '0',
                            timeLimit,
                            credentialLimit,
                            requiredPass,
                            credentialsGained
                        ])
                    expect((await this.testerCreator.getTester('5')).slice(0,8).map(n => { return n.toString() }))
                        .to.deep.equal([
                            '2',
                            prize,
                            '0',
                            timeLimit,
                            credentialLimit,
                            requiredPass,
                            credentialsGained
                        ])
                })
            })
        })

        describe('deleteTester', function () {
            context('when deleting a nonexistent tester', function () {
                it('reverts', async function () {
                    await expectRevert(
                        this.testerCreator.deleteTester(nonExistentTokenId, { from: owner })
                        ,
                        "Test does not exist"
                    )
                })
            })

            context('when deleting a token that is not own', function () {
                it('reverts', async function () {
                    await expectRevert(
                        this.testerCreator.deleteTester(new BN('1'), { from: newOwner })
                        ,
                        "Deleting tester that is not own"
                    )
                    await expectRevert(
                        this.testerCreator.deleteTester(new BN('3'), { from: newOwner })
                        ,
                        "Deleting tester that is not own"
                    )
                    await expectRevert(
                        this.testerCreator.deleteTester(new BN('5'), { from: newOwner })
                        ,
                        "Deleting tester that is not own"
                    )
                })
            })

            context('with a successful deletion', function () {
                let tx1, tx2, tx3

                beforeEach(async function () {
                    tx1 = await this.testerCreator.deleteTester(new BN('1'), { from: owner })
                    tx2 = await this.testerCreator.deleteTester(new BN('3'), { from: owner })
                    tx3 = await this.testerCreator.deleteTester(new BN('5'), { from: owner })
                })

                it('burns the token from the owner\'s holdings and total supply', async function () {
                    const tokenIsBurned = async (tokenId) => {
                        await expectRevert(
                            this.testerCreator.ownerOf(tokenId)
                            ,
                            "ERC721: owner query for nonexistent token"
                        )
                        await expectRevert(
                            this.testerCreator.tokenByIndex(tokenId)
                            ,
                            "Index out of bounds"
                        )
                        await expectRevert(
                            this.testerCreator.tokenOfOwnerByIndex(owner, tokenId)
                            ,
                            "Index out of bounds"
                        )
                    }

                    expect(await this.testerCreator.balanceOf(owner)).to.be.bignumber.equal('3')
                    expect(await this.testerCreator.totalSupply()).to.be.bignumber.equal('3')  // Total supply and owner holdings are now 1
                    // TODO : this dont work ?
                    expect(await this.testerCreator.tokenByIndex('0')).to.be.bignumber.equal('2')  // First token is now testerId #2 
                    expect(await this.testerCreator.tokenOfOwnerByIndex(owner, '0')).to.be.bignumber.equal('2')
                    
                    await tokenIsBurned('1')
                    await tokenIsBurned('3')
                    await tokenIsBurned('5')
                })

                it('deletes the URI', async function () {
                    await expectRevert(
                        this.testerCreator.tokenURI('1')
                        ,
                        "Test does not exist"
                    )
                    await expectRevert(
                        this.testerCreator.tokenURI('3')
                        ,
                        "Test does not exist"
                    )
                    await expectRevert(
                        this.testerCreator.tokenURI('5')
                        ,
                        "Test does not exist"
                    )
                })

                it('deletes the on chain tester object', async function () {
                    await expectRevert(
                        this.testerCreator.getTester('1')
                        ,
                        "Test does not exist"
                    )
                    await expectRevert(
                        this.testerCreator.getTester('3')
                        ,
                        "Test does not exist"
                    )
                    await expectRevert(
                        this.testerCreator.getTester('5')
                        ,
                        "Test does not exist"
                    )
                })

                it('sends the funds back if the tester was never solved', async function () {
                    const sendsFundsBack = async (tokenId) => {
                        let startBalance = BigInt(await web3.eth.getBalance(owner))

                        let txDict = await this.testerCreator.deleteTester(tokenId, { from: owner })
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
                
                it('does not send any funds back if the tester did not include a prize', async function () {
                    await this.testerCreator.createMultipleChoiceTest(
                        testerURI, solutionHashA, timeLimit, credentialLimit, requiredPass, credentialsGained,
                        { from: owner }
                    );
                    await this.testerCreator.createOpenAnswerTest(
                        testerURI, answerHashesA, timeLimit, credentialLimit, requiredPass, credentialsGained,
                        { from: owner }
                    )
                    await this.testerCreator.createMixedTest(
                        testerURI, solutionHashA, answerHashesA, timeLimit, credentialLimit, requiredPass, credentialsGained,
                        { from: owner }
                    )

                    const noFundsBack = async (tokenId) => {
                        let startBalance = BigInt(await web3.eth.getBalance(owner))

                        let txDict = await this.testerCreator.deleteTester(tokenId, { from: owner })
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

                it('does not send any funds back if the tester was solved once', async function () {
                    // TODO

                    const noFundsBack = async (tokenId, proof, input) => {
                        let startBalance = BigInt(await web3.eth.getBalance(owner))

                        await this.testerCreator.solveTester(
                            tokenId,
                            [proof.pi_a[0], proof.pi_a[1]],
                            [[proof.pi_b[0][1], proof.pi_b[0][0]], [proof.pi_b[1][1], proof.pi_b[1][0]]],
                            [proof.pi_c[0], proof.pi_c[1]],
                            input,
                            { from: solver }
                        )

                        let txDict = await this.testerCreator.deleteTester(secondTokenId, { from: owner })
                    
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

        describe('solveTester', function () {

            context('when the given testerId does not exist', function () {
                it('reverts', async function () {
                    await expectRevert(
                        this.testerCreator.solveTester(
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
                    await solveTester(this.testerCreator, '1', multipleProofA, multiplePublicA)
                    await solveTester(this.testerCreator, '3', openProofA, openPublicA)
                    await solveTester(this.testerCreator, '5', mixedProofA, mixedPublicA)
                })

                it('reverts', async function () {
                    await expectRevert(
                        solveTester(this.testerCreator, '1', multipleProofA, multiplePublicA, altSolver)
                        ,
                        "Salt was already used"
                    )
                    await expectRevert(
                        solveTester(this.testerCreator, '3', openProofA, openPublicA, altSolver)
                        ,
                        "Salt was already used"
                    )
                    await expectRevert(
                        solveTester(this.testerCreator, '5', mixedProofA, mixedPublicA, altSolver)
                        ,
                        "Salt was already used"
                    )
                })
            })

            context('when the owner tries to solve the tester', function () {
                it('reverts', async function () {
                    await expectRevert(
                        solveTester(this.testerCreator, '1', multipleProofA, multiplePublicA, owner)
                        ,
                        "Tester cannot be solved by owner"
                    )
                    await expectRevert(
                        solveTester(this.testerCreator, '3', openProofA, openPublicA, owner)
                        ,
                        "Tester cannot be solved by owner"
                    )
                    await expectRevert(
                        solveTester(this.testerCreator, '5', mixedProofA, mixedPublicA, owner)
                        ,
                        "Tester cannot be solved by owner"
                    )
                })
            })

            context('when the number of credentials have been reached', function () {
                beforeEach(async function () {
                    await this.testerCreator.createMultipleChoiceTest(
                        testerURI, solutionHashA, timeLimit, '1', requiredPass, credentialsGained,
                        { from: owner, value: prize }
                    );
                    await this.testerCreator.createOpenAnswerTest(
                        testerURI, answerHashesA, timeLimit, '1', requiredPass, credentialsGained,
                        { from: owner, value: prize }
                    )
                    await this.testerCreator.createMixedTest(
                        testerURI, solutionHashA, answerHashesA, timeLimit, '1', requiredPass, credentialsGained,
                        { from: owner, value: prize }
                    )

                    await solveTester(this.testerCreator, '7', multipleProofA, multiplePublicA)
                    await solveTester(this.testerCreator, '8', openProofA, openPublicA)
                    await solveTester(this.testerCreator, '9', mixedProofA, mixedPublicA)
                })
                
                it('reverts', async function () {
                    await expectRevert(
                        solveTester(this.testerCreator, '7', altMultipleProofA, altMultiplePublicA, altSolver)
                        ,
                        "Maximum number of credentials reached"
                    )
                    await expectRevert(
                        solveTester(this.testerCreator, '8', altOpenProofA, altOpenPublicA, altSolver)
                        ,
                        "Maximum number of credentials reached"
                    )
                    await expectRevert(
                        solveTester(this.testerCreator, '9', altMixedProofA, altMixedPublicA, altSolver)
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
                    
                    await this.testerCreator.createMultipleChoiceTest(
                        testerURI, solutionHashA, nearTimeLimit, credentialLimit, requiredPass, credentialsGained,
                        { from: owner, value: prize }
                    );
                    await this.testerCreator.createOpenAnswerTest(
                        testerURI, answerHashesA, nearTimeLimit, credentialLimit, requiredPass, credentialsGained,
                        { from: owner, value: prize }
                    )
                    await this.testerCreator.createMixedTest(
                        testerURI, solutionHashA, answerHashesA, nearTimeLimit, credentialLimit, requiredPass, credentialsGained,
                        { from: owner, value: prize }
                    )
                    
                    // can solve now
                    await solveTester(this.testerCreator, '7', multipleProofA, multiplePublicA)
                    await solveTester(this.testerCreator, '8', openProofA, openPublicA)
                    await solveTester(this.testerCreator, '9', mixedProofA, mixedPublicA)
                })
                
                it('reverts', async function () {
                    // but not later
                    await time.increase(time.duration.seconds(101));
                    await expectRevert(
                        solveTester(this.testerCreator, '7', altMultipleProofA, altMultiplePublicA, altSolver)
                        ,
                        "Time limit for this credential reached"
                    )
                    await expectRevert(
                        solveTester(this.testerCreator, '8', altOpenProofA, altOpenPublicA, altSolver)
                        ,
                        "Time limit for this credential reached"
                    )
                    await expectRevert(
                        solveTester(this.testerCreator, '9', altMixedProofA, altMixedPublicA, altSolver)
                        ,
                        "Time limit for this credential reached"
                    )
                })
            })

            context('when giving an invalid input length', function () {
                it('reverts', async function () {
                    await expectRevert(
                        this.testerCreator.solveTester(
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
                        this.testerCreator.solveTester(
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
                        this.testerCreator.solveTester(
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
                        this.testerCreator.solveTester(
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
                        this.testerCreator.solveTester(
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
                        this.testerCreator.solveTester(
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
                        solveTester(this.testerCreator, '1', multipleProofB, multiplePublicB, altSolver)
                        ,
                        'Wrong solution'
                    )
                    await expectRevert(
                        solveTester(this.testerCreator, '3', openProofB, openPublicB, altSolver)
                        ,
                        'No correct answers'
                    )
                    await expectRevert(
                        solveTester(this.testerCreator, '5', mixedProofB, mixedPublicB, altSolver)
                        ,
                        'Wrong solution and no correct answers'
                    )
                })
            })

            context('when the caller does not own the required pass', function () {
                beforeEach(async function () {
                    await this.testerCreator.createMultipleChoiceTest(
                        testerURI, solutionHashA, timeLimit, credentialLimit, this.valid.address, credentialsGained,
                        { from: owner, value: prize }
                    );
                    await this.testerCreator.createOpenAnswerTest(
                        testerURI, answerHashesA, timeLimit, credentialLimit, this.valid.address, credentialsGained,
                        { from: owner, value: prize }
                    )
                    await this.testerCreator.createMixedTest(
                        testerURI, solutionHashA, answerHashesA, timeLimit, credentialLimit, this.valid.address, credentialsGained,
                        { from: owner, value: prize }
                    )
                })

                it('reverts', async function () {
                    await expectRevert(
                        solveTester(this.testerCreator, '7', multipleProofA, multiplePublicA)
                        ,
                        "Solver does not own the required token"
                    )
                    await expectRevert(
                        solveTester(this.testerCreator, '8', openProofA, openPublicA)
                        ,
                        "Solver does not own the required token"
                    )
                    await expectRevert(
                        solveTester(this.testerCreator, '9', mixedProofA, mixedPublicA)
                        ,
                        "Solver does not own the required token"
                    )
                })
            })

            context('when the caller owns the required pass', function () {
                beforeEach(async function () {
                    await this.testerCreator.createMultipleChoiceTest(
                        testerURI, solutionHashA, timeLimit, credentialLimit, this.valid.address, credentialsGained,
                        { from: owner, value: prize }
                    );
                    await this.testerCreator.createOpenAnswerTest(
                        testerURI, answerHashesA, timeLimit, credentialLimit, this.valid.address, credentialsGained,
                        { from: owner, value: prize }
                    )
                    await this.testerCreator.createMixedTest(
                        testerURI, solutionHashA, answerHashesA, timeLimit, credentialLimit, this.valid.address, credentialsGained,
                        { from: owner, value: prize }
                    )

                    await this.valid.mint(solver, firstTokenId)
                })

                it('solves the tester', async function () {
                    // solving tx clears
                    await solveTester(this.testerCreator, '1', multipleProofA, multiplePublicA)
                    await solveTester(this.testerCreator, '3', openProofA, openPublicA)
                    await solveTester(this.testerCreator, '5', mixedProofA, mixedPublicA)
                })
            })

            context('when verification is successful', function () {
                let tx1, tx2, tx3

                beforeEach(async function () {
                    tx1 = await this.testerCreator.solveTester(
                        '1',
                        [multipleProofA.pi_a[0], multipleProofA.pi_a[1]],
                        [[multipleProofA.pi_b[0][1], multipleProofA.pi_b[0][0]], [multipleProofA.pi_b[1][1], multipleProofA.pi_b[1][0]]],
                        [multipleProofA.pi_c[0], multipleProofA.pi_c[1]],
                        multiplePublicA,
                        { from: solver }
                    )
                    tx2 = await this.testerCreator.solveTester(
                        '3',
                        [openProofA.pi_a[0], openProofA.pi_a[1]],
                        [[openProofA.pi_b[0][1], openProofA.pi_b[0][0]], [openProofA.pi_b[1][1], openProofA.pi_b[1][0]]],
                        [openProofA.pi_c[0], openProofA.pi_c[1]],
                        openPublicA,
                        { from: solver }
                    )
                    tx3 = await this.testerCreator.solveTester(
                        '5',
                        [mixedProofA.pi_a[0], mixedProofA.pi_a[1]],
                        [[mixedProofA.pi_b[0][1], mixedProofA.pi_b[0][0]], [mixedProofA.pi_b[1][1], mixedProofA.pi_b[1][0]]],
                        [mixedProofA.pi_c[0], mixedProofA.pi_c[1]],
                        mixedPublicA,
                        { from: solver }
                    )
                })

                it('updates the on chain tester object', async function () {
                    expect((await this.testerCreator.getTester('1')).slice(0,7).map(n => { return n.toString() }))
                        .to.deep.equal([
                            '0',
                            prize,
                            '1',
                            timeLimit,
                            credentialLimit,
                            requiredPass,
                            credentialsGained
                        ])
                    expect((await this.testerCreator.getTester('3')).slice(0,7).map(n => { return n.toString() }))
                        .to.deep.equal([
                            '1',
                            prize,
                            '1',
                            timeLimit,
                            credentialLimit,
                            requiredPass,
                            credentialsGained
                        ])
                    expect((await this.testerCreator.getTester('5')).slice(0,8).map(n => { return n.toString() }))
                        .to.deep.equal([
                            '2',
                            prize,
                            '1',
                            timeLimit,
                            credentialLimit,
                            requiredPass,
                            credentialsGained
                        ])
                })

                it('pays the first solver but not the following ones', async function () {

                    const paysFirstNotFollowing = async (tokenId, proof, public, altProof, altPublic) => {
                        let startBalance = BigInt(await web3.eth.getBalance(solver))

                        // First solver
                        let txDict = await this.testerCreator.solveTester(
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
                        let altTxDict = await this.testerCreator.solveTester(
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

                    await this.testerCreator.createMultipleChoiceTest(
                        testerURI, solutionHashA, timeLimit, credentialLimit, requiredPass, credentialsGained,
                        { from: owner }
                    );
                    await this.testerCreator.createOpenAnswerTest(
                        testerURI, answerHashesA, timeLimit, credentialLimit, requiredPass, credentialsGained,
                        { from: owner }
                    )
                    await this.testerCreator.createMixedTest(
                        testerURI, solutionHashA, answerHashesA, timeLimit, credentialLimit, requiredPass, credentialsGained,
                        { from: owner }
                    )

                    const noPayback = async (tokenId, proof, public) => {
                        let startBalance = BigInt(await web3.eth.getBalance(altSolver))
                        
                        let txDict = await this.testerCreator.solveTester(
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
                    expectEvent(tx1, 'Transfer', { from: this.testerCreator.address, to: solver, tokenId: '1' })
                    expectEvent(tx2, 'Transfer', { from: this.testerCreator.address, to: solver, tokenId: '3' })
                    expectEvent(tx3, 'Transfer', { from: this.testerCreator.address, to: solver, tokenId: '5' })
                })

                context('when solver already gained credentials', function () {
                    it('reverts', async function () {
                        await expectRevert(
                            solveTester(this.testerCreator, '1', altMultipleProofA, altMultiplePublicA)
                            ,
                            "Solver already gained credentials"
                        )
                        await expectRevert(
                            solveTester(this.testerCreator, '3', altOpenProofA, altOpenPublicA)
                            ,
                            "Solver already gained credentials"
                        )
                        await expectRevert(
                            solveTester(this.testerCreator, '5', altMixedProofA, altMixedPublicA)
                            ,
                            "Solver already gained credentials"
                        )
                    })
                })
            })
        })
    })
}

module.exports = {
    shouldBehaveLikeTesterCreator
};