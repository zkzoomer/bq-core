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
    "sneed's",
    'feed',
    'seed'
]

const openAnswersB = new Array(64).fill("deenz")
openAnswersB[0] = "tree"
openAnswersB[1] = "fiddy"
const altOpenAnswersB = new Array(64).fill("deenz")

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

    /* gradeSolution function */
    // multipleA
    const gradeMultipleA = multipleA.gradeSolution({ multipleChoiceAnswers : multipleChoiceAnswersA })
    expect(gradeMultipleA).to.deep.equal({
        grade: 100,
        minimumGrade: 100,
        pass: true,
        nQuestions: 1,
        multipleChoiceGrade: 100,
        openAnswerGrade: 0,
        multipleChoiceWeight: 100,
        openAnswerResults: [],
    })
    const gradeMultipleB = multipleB.gradeSolution({ multipleChoiceAnswers : multipleChoiceAnswersB })
    expect(gradeMultipleB).to.deep.equal({
        grade: 100,
        minimumGrade: 100,
        pass: true,
        nQuestions: 1,
        multipleChoiceGrade: 100,
        openAnswerGrade: 0,
        multipleChoiceWeight: 100,
        openAnswerResults: [],
    })
    
    // openA
    const gradeOpenA = openA.gradeSolution({ openAnswers: openAnswersA })
    expect(gradeOpenA).to.deep.equal({
        grade: 100,
        minimumGrade: 1,
        pass: true,
        nQuestions: 3,
        multipleChoiceGrade: 0,
        openAnswerGrade: 100,
        multipleChoiceWeight: 0,
        openAnswerResults: Array.from({length: 3}, (_, i) => true),
    })
    // openB
    const gradeOpenB = openB.gradeSolution({ openAnswers: openAnswersB })
    expect(gradeOpenB).to.deep.equal({
        grade: 100 * 62 / 64,
        minimumGrade: 1,
        pass: true,
        nQuestions: 64,
        multipleChoiceGrade: 0,
        openAnswerGrade: 100 * 62 / 64,
        multipleChoiceWeight: 0,
        openAnswerResults: Array.from({length: 64}, (_, i) => (i < 2) ? false : true ),
    })
    const altGradeOpenB = openB.gradeSolution({ openAnswers: altOpenAnswersB })
    expect(altGradeOpenB).to.deep.equal({
        grade: 100,
        minimumGrade: 1,
        pass: true,
        nQuestions: 64,
        multipleChoiceGrade: 0,
        openAnswerGrade: 100,
        multipleChoiceWeight: 0,
        openAnswerResults: Array.from({length: 64}, (_, i) => true ),
    })

    // mixedA
    const gradeMixedA = mixedA.gradeSolution({ openAnswers: openAnswersA, multipleChoiceAnswers: multipleChoiceAnswersA })
    expect(gradeMixedA).to.deep.equal({
        grade: 100,
        minimumGrade: 1,
        pass: true,
        nQuestions: 3,
        multipleChoiceGrade: 100,
        openAnswerGrade: 100,
        multipleChoiceWeight: 50,
        openAnswerResults: Array.from({length: 3}, (_, i) => true ),
    })
    // mixedB
    const gradeMixedB = mixedB.gradeSolution({ openAnswers: openAnswersB, multipleChoiceAnswers: multipleChoiceAnswersB })
    expect(gradeMixedB).to.deep.equal({
        grade: 50 + 50 * 62 / 64,
        minimumGrade: 1,
        pass: true,
        nQuestions: 64,
        multipleChoiceGrade: 100,
        openAnswerGrade: 100 * 62 / 64,
        multipleChoiceWeight: 50,
        openAnswerResults: Array.from({length: 64}, (_, i) => (i < 2) ? false : true ),
    })
    const altGradeMixedB = mixedB.gradeSolution({ openAnswers: altOpenAnswersB, multipleChoiceAnswers: multipleChoiceAnswersB })
    expect(altGradeMixedB).to.deep.equal({
        grade: 100,
        minimumGrade: 1,
        pass: true,
        nQuestions: 64,
        multipleChoiceGrade: 100,
        openAnswerGrade: 100,
        multipleChoiceWeight: 50,
        openAnswerResults: Array.from({length: 64}, (_, i) => true ),
    })

    // TODO: revisit which accounts generate which proofs for when testing all them smart contracts
    // multipleA
    const proofMultipleA = await multipleA.generateSolutionProof({ recipient: accounts[2], multipleChoiceAnswers: multipleChoiceAnswersA })
    expect( await multipleA.verifySolutionProof(proofMultipleA) ).to.be.true
    const altProofMultipleA = await multipleA.generateSolutionProof({ recipient: accounts[3], multipleChoiceAnswers: multipleChoiceAnswersA })
    expect( await multipleA.verifySolutionProof(altProofMultipleA) ).to.be.true
    // multipleB
    const proofMultipleB = await multipleB.generateSolutionProof({ recipient: accounts[2], multipleChoiceAnswers: multipleChoiceAnswersB })
    expect( await multipleB.verifySolutionProof(proofMultipleB) ).to.be.true
    const altProofMultipleB = await multipleB.generateSolutionProof({ recipient: accounts[3], multipleChoiceAnswers: multipleChoiceAnswersB })
    expect( await multipleB.verifySolutionProof(altProofMultipleB) ).to.be.true

    // openA
    const proofOpenA = await openA.generateSolutionProof({ recipient: accounts[2], openAnswers: openAnswersA })
    expect( await openA.verifySolutionProof(proofOpenA) ).to.be.true
    const altProofOpenA = await openA.generateSolutionProof({ recipient: accounts[3], openAnswers: openAnswersA })
    expect( await openA.verifySolutionProof(altProofOpenA) ).to.be.true
    // openB
    const proofOpenB = await openB.generateSolutionProof({ recipient: accounts[2], openAnswers: openAnswersB })
    expect( await openB.verifySolutionProof(proofOpenB) ).to.be.true
    const altProofOpenB = await openB.generateSolutionProof({ recipient: accounts[3], openAnswers: altOpenAnswersB })
    expect( await openB.verifySolutionProof(altProofOpenB) ).to.be.true

    // mixedA
    const proofMixedA = await mixedA.generateSolutionProof({ recipient: accounts[2], openAnswers: openAnswersA, multipleChoiceAnswers: multipleChoiceAnswersA })
    expect( await mixedA.verifySolutionProof(proofMixedA) ).to.be.true
    const altProofMixedA = await mixedA.generateSolutionProof({ recipient: accounts[3], openAnswers: openAnswersA, multipleChoiceAnswers: multipleChoiceAnswersA })
    expect( await mixedA.verifySolutionProof(altProofMixedA) ).to.be.true
    // mixedB
    const proofMixedB = await mixedB.generateSolutionProof({ recipient: accounts[2], openAnswers: openAnswersB, multipleChoiceAnswers: multipleChoiceAnswersB })
    expect( await mixedB.verifySolutionProof(proofMixedB) ).to.be.true
    const altProofMixedB = await mixedB.generateSolutionProof({ recipient: accounts[3], openAnswers: altOpenAnswersB, multipleChoiceAnswers: multipleChoiceAnswersB })
    expect( await mixedB.verifySolutionProof(altProofMixedB) ).to.be.true

    return 0;
}

module.exports = generateProofs