const keccak256 = require("keccak256")

const { bqTest } = require("../../src/bqTest")
const {
    multipleChoiceRoot,
    answerHashesA,
    answerHashesB,
    openAnswersRootA,
    openAnswersRootB,
    multipleChoiceAnswers,
    openAnswersA,
    openAnswersB,
    altOpenAnswersB
} = require('./testRoots')

const ZERO_ADDY = '0x0000000000000000000000000000000000000000'
const fillText = 'The Tools You Need'

// Generates all the necessary proof objects used for performing the smart contract tests
// Contract needs to be deployed once to generate these
async function generateProofs ( testCreatorContract, ethersProvider, solverSigner, altSolverSigner ) {

    const solverSignerAddress = await solverSigner.getAddress()
    const altSolverSignerAddress = await altSolverSigner.getAddress()

    // CREATING THE TESTS
    await testCreatorContract.createTest(100, 1, 100, 0, 0, [multipleChoiceRoot], ZERO_ADDY, fillText, fillText)
    const multiple = await bqTest.solveMode(1, ethersProvider, testCreatorContract.address)

    await testCreatorContract.createTest(0, 3, 1, 0, 0, [openAnswersRootA], ZERO_ADDY, fillText, fillText)
    const openA = await bqTest.solveMode(2, ethersProvider, testCreatorContract.address, answerHashesA)

    await testCreatorContract.createTest(50, 3, 1, 0, 0, [multipleChoiceRoot, openAnswersRootA], ZERO_ADDY, fillText, fillText)
    const mixedA = await bqTest.solveMode(3, ethersProvider, testCreatorContract.address, answerHashesA)

    await testCreatorContract.createTest(0, 64, 1, 0, 0, [openAnswersRootB], ZERO_ADDY, fillText, fillText)
    const openB = await bqTest.solveMode(4, ethersProvider, testCreatorContract.address, answerHashesB)

    await testCreatorContract.createTest(50, 64, 1, 0, 0, [multipleChoiceRootB, openAnswersRootB], ZERO_ADDY, fillText, fillText)
    const mixedB = await bqTest.solveMode(5, ethersProvider, testCreatorContract.address, answerHashesB)

    // WRONG SOLUTIONS
    const proofMultipleWrong = await multiple.generateSolutionProof({ recipient: solverSignerAddress, multipleChoiceAnswers: Array.from({length: 64}, (_, i) => 2) })
    expect( await openA.verifySolutionProof(proofMultipleWrong) ).to.be.true
    const proofOpenWrong = await openA.generateSolutionProof({ recipient: solverSignerAddress, openAnswers: openAnswersB })
    expect( await openA.verifySolutionProof(proofOpenWrong) ).to.be.true
    const proofMixedWrong = await mixedA.generateSolutionProof({ recipient: solverSignerAddress, openAnswers: openAnswersB, multipleChoiceAnswers: multipleChoiceAnswersB })
    expect( await openA.verifySolutionProof(proofMixedWrong) ).to.be.true

    // MAIN SOLUTIONS - GET SIGNED TO INCREASE NONCE
    const proofmultiple = await multiple.generateSolutionProof({ recipient: solverSignerAddress, multipleChoiceAnswers: multipleChoiceAnswers })
    expect( await multiple.verifySolutionProof(proofmultiple) ).to.be.true
    await multiple.sendSolutionTransaction( solverSigner, proofmultiple )

    const proofOpenA = await openA.generateSolutionProof({ recipient: solverSignerAddress, openAnswers: openAnswersA })
    expect( await openA.verifySolutionProof(proofOpenA) ).to.be.true
    await openA.sendSolutionTransaction( solverSigner, proofOpenA )

    const proofMixedA = await mixedA.generateSolutionProof({ recipient: solverSignerAddress, openAnswers: openAnswersA, multipleChoiceAnswers: multipleChoiceAnswers })
    expect( await mixedA.verifySolutionProof(proofMixedA) ).to.be.true
    await mixedA.sendSolutionTransaction( solverSigner, proofMixedA )

    // ALT MAIN SOLUTIONS
    const altProofmultiple = await multiple.generateSolutionProof({ recipient: altSolverSignerAddress, multipleChoiceAnswers: multipleChoiceAnswers })
    expect( await multiple.verifySolutionProof(altProofmultiple) ).to.be.true

    const altProofOpenA = await openA.generateSolutionProof({ recipient: altSolverSignerAddress, openAnswers: openAnswersA })
    expect( await openA.verifySolutionProof(altProofOpenA) ).to.be.true

    const altProofMixedA = await mixedA.generateSolutionProof({ recipient: altSolverSignerAddress, openAnswers: openAnswersA, multipleChoiceAnswers: multipleChoiceAnswers })
    expect( await mixedA.verifySolutionProof(altProofMixedA) ).to.be.true

    // OPEN AND MIXED B SOLUTIONS
    const proofOpenB = await openB.generateSolutionProof({ recipient: solverSignerAddress, openAnswers: openAnswersB })
    expect( await openB.verifySolutionProof(proofOpenB) ).to.be.true

    const proofMixedB = await mixedB.generateSolutionProof({ recipient: solverSignerAddress, openAnswers: openAnswersB, multipleChoiceAnswers: multipleChoiceAnswersB })
    expect( await mixedB.verifySolutionProof(proofMixedB) ).to.be.true

    const altProofOpenB = await openB.generateSolutionProof({ recipient: altSolverSignerAddress, openAnswers: altOpenAnswersB })
    expect( await openB.verifySolutionProof(altProofOpenB) ).to.be.true

    const altProofMixedB = await mixedB.generateSolutionProof({ recipient: altSolverSignerAddress, openAnswers: altOpenAnswersB, multipleChoiceAnswers: multipleChoiceAnswersB })
    expect( await mixedB.verifySolutionProof(altProofMixedB) ).to.be.true

    /* 
    * TESTING THE gradeSolution FUNCTION 
    */
    // WRONG SOLUTIONS
    expect( multiple.gradeSolution({ multipleChoiceAnswers : multipleChoiceAnswers }) ).to.deep.equal({
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
    expect( openA.gradeSolution({ openAnswers: openAnswersA }) ).to.deep.equal({
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
    expect( openB.gradeSolution({ openAnswers: openAnswersB }) ).to.deep.equal({
        grade: 100 * 62 / 64,
        minimumGrade: 1,
        pass: true,
        nQuestions: 64,
        multipleChoiceGrade: 0,
        openAnswerGrade: 100 * 62 / 64,
        multipleChoiceWeight: 0,
        openAnswerResults: Array.from({length: 64}, (_, i) => (i < 2) ? false : true ),
    })

    // altOpenB
    expect( openB.gradeSolution({ openAnswers: altOpenAnswersB }) ).to.deep.equal({
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
    expect( mixedA.gradeSolution({ openAnswers: openAnswersA, multipleChoiceAnswers: multipleChoiceAnswers }) ).to.deep.equal({
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
    expect( mixedB.gradeSolution({ openAnswers: openAnswersB, multipleChoiceAnswers: multipleChoiceAnswersB }) ).to.deep.equal({
        grade: 50 + 50 * 62 / 64,
        minimumGrade: 1,
        pass: true,
        nQuestions: 64,
        multipleChoiceGrade: 100,
        openAnswerGrade: 100 * 62 / 64,
        multipleChoiceWeight: 50,
        openAnswerResults: Array.from({length: 64}, (_, i) => (i < 2) ? false : true ),
    })

    // altMixedB
    expect( mixedB.gradeSolution({ openAnswers: altOpenAnswersB, multipleChoiceAnswers: multipleChoiceAnswersB }) ).to.deep.equal({
        grade: 100,
        minimumGrade: 1,
        pass: true,
        nQuestions: 64,
        multipleChoiceGrade: 100,
        openAnswerGrade: 100,
        multipleChoiceWeight: 50,
        openAnswerResults: Array.from({length: 64}, (_, i) => true ),
    })

    return {
        proofMultipleWrong,
        proofOpenWrong,
        proofMixedWrong,
        proofmultiple,
        proofOpenA,
        proofMixedA,
        altProofmultiple,
        altProofOpenA,
        altProofMixedA,
        proofOpenB,
        proofMixedB,
        altProofOpenB,
        altProofMixedB
    };
}

module.exports = generateProofs