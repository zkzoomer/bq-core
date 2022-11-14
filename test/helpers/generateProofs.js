const keccak256 = require("keccak256")

const { bqTest } = require("../../src/bqTest")
const {
    multipleChoiceRootA,
    multipleChoiceRootB,
    answerHashesA,
    answerHashesB,
    openAnswersRootA,
    openAnswersRootB
} = require('./testRoots')

const ZERO_ADDY = '0x0000000000000000000000000000000000000000'
const fillText = 'The Tools You Need'

const multipleChoiceAnswersA = Array.from({length: 64}, (_, i) => 1)
const multipleChoiceAnswersB = Array.from({length: 64}, (_, i) => 2)

const openAnswersA = [
    BigInt('0x' + keccak256("sneed's").toString('hex')),
    BigInt('0x' + keccak256('feed').toString('hex')),
    BigInt('0x' + keccak256('seed').toString('hex'))
]

const openAnswersB = new Array(64).fill(
    BigInt('0x' + keccak256("deenz").toString('hex'))
);
openAnswersB[0] = BigInt('0x' + keccak256("tree").toString('hex'))
openAnswersB[0] = BigInt('0x' + keccak256("fiddy").toString('hex'))
const altOpenAnswersB = new Array(64).fill(
    BigInt('0x' + keccak256("deenz").toString('hex'))
);

// Generates all the necessary proof objects used for performing the smart contract tests
// Contract needs to be deployed once to generate these
async function generateProofs (testCreatorContract, ethersProvider, accounts) {
    // multipleA
    await testCreatorContract.createTest(100, 1, 100, 0, 0, [multipleChoiceRootA], ZERO_ADDY, fillText, fillText)
    const multipleA = await bqTest.solveMode(1, ethersProvider, testCreatorContract.address)
    // multipleB
    await testCreatorContract.createTest(100, 1, 100, 0, 0, [multipleChoiceRootB], ZERO_ADDY, fillText, fillText)
    const multipleB = await bqTest.solveMode(2, ethersProvider, testCreatorContract.address)
    // openA
    await testCreatorContract.createTest(0, 3, 1, 0, 0, [openAnswersRootA], ZERO_ADDY, fillText, fillText)
    const openA = await bqTest.solveMode(3, ethersProvider, testCreatorContract.address, answerHashesA)
    // openB
    await testCreatorContract.createTest(0, 64, 1, 0, 0, [openAnswersRootB], ZERO_ADDY, fillText, fillText)
    const openB = await bqTest.solveMode(4, ethersProvider, testCreatorContract.address, answerHashesB)
    // mixedA
    await testCreatorContract.createTest(50, 3, 1, 0, 0, [multipleChoiceRootA, openAnswersRootA], ZERO_ADDY, fillText, fillText)
    const mixedA = await bqTest.solveMode(5, ethersProvider, testCreatorContract.address, answerHashesA)
    // mixedB
    await testCreatorContract.createTest(50, 64, 1, 0, 0, [multipleChoiceRootB, openAnswersRootB], ZERO_ADDY, fillText, fillText)
    const mixedB = await bqTest.solveMode(6, ethersProvider, testCreatorContract.address, answerHashesB)

    // TODO: test the `gradeSolution` function here
    
    // TODO: revisit which accounts generate which proofs for when testing all them smart contracts
    // multipleA
    const proofMultipleA = await multipleA.generateSolutionProof(accounts[2], multipleChoiceAnswers = multipleChoiceAnswersA)
    expect( await multipleA.verifySolutionProof(proofMultipleA) ).to.be.true
    const altProofMultipleA = await multipleA.generateSolutionProof(accounts[3], multipleChoiceAnswers = multipleChoiceAnswersA)
    expect( await multipleA.verifySolutionProof(altProofMultipleA) ).to.be.true
    // multipleB
    const proofMultipleB = await multipleB.generateSolutionProof(accounts[2], multipleChoiceAnswers = multipleChoiceAnswersB)
    expect( await multipleB.verifySolutionProof(proofMultipleB) ).to.be.true
    const altProofMultipleB = await multipleB.generateSolutionProof(accounts[3], multipleChoiceAnswers = multipleChoiceAnswersB)
    expect( await multipleB.verifySolutionProof(altProofMultipleB) ).to.be.true

    // openA
    const proofOpenA = await openA.generateSolutionProof(accounts[2], openAnswers = openAnswersA)
    expect( await openA.verifySolutionProof(proofOpenA) ).to.be.true
    const altProofOpenA = await openA.generateSolutionProof(accounts[3], openAnswers = openAnswersA)
    expect( await openA.verifySolutionProof(altProofOpenA) ).to.be.true
    // openB
    const proofOpenB = await openB.generateSolutionProof(accounts[2], openAnswers = openAnswersB)
    expect( await openB.verifySolutionProof(proofOpenB) ).to.be.true
    const altProofOpenB = await openB.generateSolutionProof(accounts[3], openAnswers = altOpenAnswersB)
    expect( await openB.verifySolutionProof(altProofOpenB) ).to.be.true

    // mixedA
    const proofMixedA = await mixedA.generateSolutionProof(accounts[2], openAnswers = openAnswersA, multipleChoiceAnswers = multipleChoiceAnswersA)
    expect( await mixedA.verifySolutionProof(proofMixedA) ).to.be.true
    const altProofMixedA = await mixedA.generateSolutionProof(accounts[3], openAnswers = openAnswersA, multipleChoiceAnswers = multipleChoiceAnswersA)
    expect( await mixedA.verifySolutionProof(altProofMixedA) ).to.be.true
    // mixedB
    const proofMixedB = await mixedB.generateSolutionProof(accounts[2], openAnswers = openAnswersB, multipleChoiceAnswers = multipleChoiceAnswersB)
    expect( await mixedB.verifySolutionProof(proofMixedB) ).to.be.true
    const altProofMixedB = await mixedB.generateSolutionProof(accounts[3], openAnswers = altOpenAnswersB, multipleChoiceAnswers = multipleChoiceAnswersB)
    expect( await mixedB.verifySolutionProof(altProofMixedB) ).to.be.true

    console.log('all good')

    return 0;
}

module.exports = generateProofs