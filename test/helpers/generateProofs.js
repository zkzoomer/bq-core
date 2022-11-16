const keccak256 = require("keccak256")

const { bqTest } = require("../../src/bqTest")
const {
    multipleChoiceRootA,
    multipleChoiceRootB,
    answerHashesA,
    answerHashesB,
    openAnswersRootA,
    openAnswersRootB,
    multipleChoiceAnswersA,
    multipleChoiceAnswersB,
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

    // multipleA
    await testCreatorContract.createTest(100, 1, 100, 0, 0, [multipleChoiceRootA], ZERO_ADDY, fillText, fillText)
    const multipleA = await bqTest.solveMode(1, ethersProvider, testCreatorContract.address)

    const proofMultipleA = await multipleA.generateSolutionProof({ recipient: solverSignerAddress, multipleChoiceAnswers: multipleChoiceAnswersA })
    expect( await multipleA.verifySolutionProof(proofMultipleA) ).to.be.true
    /* const altProofMultipleA = await multipleA.generateSolutionProof({ recipient: altSolverSignerAddress, multipleChoiceAnswers: multipleChoiceAnswersA })
    expect( await multipleA.verifySolutionProof(altProofMultipleA) ).to.be.true */

    await multipleA.sendSolutionTransaction( solverSigner, proofMultipleA )
    /* await multipleA.sendSolutionTransaction( altSolverSigner, altProofMultipleA )

    // multipleB
    await testCreatorContract.createTest(100, 1, 100, 0, 0, [multipleChoiceRootB], ZERO_ADDY, fillText, fillText)
    const multipleB = await bqTest.solveMode(2, ethersProvider, testCreatorContract.address)

    const proofMultipleB = await multipleB.generateSolutionProof({ recipient: solverSignerAddress, multipleChoiceAnswers: multipleChoiceAnswersB })
    expect( await multipleB.verifySolutionProof(proofMultipleB) ).to.be.true
    const altProofMultipleB = await multipleB.generateSolutionProof({ recipient: altSolverSignerAddress, multipleChoiceAnswers: multipleChoiceAnswersB })
    expect( await multipleB.verifySolutionProof(altProofMultipleB) ).to.be.true

    await multipleB.sendSolutionTransaction( solverSigner, proofMultipleB )
    await multipleB.sendSolutionTransaction( altSolverSigner, altProofMultipleB ) */

    // openA
    await testCreatorContract.createTest(0, 3, 1, 0, 0, [openAnswersRootA], ZERO_ADDY, fillText, fillText)
    const openA = await bqTest.solveMode(2, ethersProvider, testCreatorContract.address, answerHashesA)
    /* const openA = await bqTest.solveMode(3, ethersProvider, testCreatorContract.address, answerHashesA) */

    const proofOpenA = await openA.generateSolutionProof({ recipient: solverSignerAddress, openAnswers: openAnswersA })
    expect( await openA.verifySolutionProof(proofOpenA) ).to.be.true
    /* const altProofOpenA = await openA.generateSolutionProof({ recipient: altSolverSignerAddress, openAnswers: openAnswersA })
    expect( await openA.verifySolutionProof(altProofOpenA) ).to.be.true */

    await openA.sendSolutionTransaction( solverSigner, proofOpenA )
    /* await openA.sendSolutionTransaction( altSolverSigner, altProofOpenA )

    // openB
    await testCreatorContract.createTest(0, 64, 1, 0, 0, [openAnswersRootB], ZERO_ADDY, fillText, fillText)
    const openB = await bqTest.solveMode(4, ethersProvider, testCreatorContract.address, answerHashesB)
    
    const proofOpenB = await openB.generateSolutionProof({ recipient: solverSignerAddress, openAnswers: openAnswersB })
    expect( await openB.verifySolutionProof(proofOpenB) ).to.be.true
    const altProofOpenB = await openB.generateSolutionProof({ recipient: altSolverSignerAddress, openAnswers: altOpenAnswersB })
    expect( await openB.verifySolutionProof(altProofOpenB) ).to.be.true

    await openB.sendSolutionTransaction( solverSigner, proofOpenB )
    await openB.sendSolutionTransaction( altSolverSigner, altProofOpenB ) */

    // mixedA
    await testCreatorContract.createTest(50, 3, 1, 0, 0, [multipleChoiceRootA, openAnswersRootA], ZERO_ADDY, fillText, fillText)
    const mixedA = await bqTest.solveMode(3, ethersProvider, testCreatorContract.address, answerHashesA)
    /* const mixedA = await bqTest.solveMode(5, ethersProvider, testCreatorContract.address, answerHashesA) */

    const proofMixedA = await mixedA.generateSolutionProof({ recipient: solverSignerAddress, openAnswers: openAnswersA, multipleChoiceAnswers: multipleChoiceAnswersA })
    expect( await mixedA.verifySolutionProof(proofMixedA) ).to.be.true
    /* const altProofMixedA = await mixedA.generateSolutionProof({ recipient: altSolverSignerAddress, openAnswers: openAnswersA, multipleChoiceAnswers: multipleChoiceAnswersA })
    expect( await mixedA.verifySolutionProof(altProofMixedA) ).to.be.true */

    await mixedA.sendSolutionTransaction( solverSigner, proofMixedA )
    /* await mixedA.sendSolutionTransaction( altSolverSigner, altProofMixedA )

    // mixedB
    await testCreatorContract.createTest(50, 64, 1, 0, 0, [multipleChoiceRootB, openAnswersRootB], ZERO_ADDY, fillText, fillText)
    const mixedB = await bqTest.solveMode(6, ethersProvider, testCreatorContract.address, answerHashesB)
    
    const proofMixedB = await mixedB.generateSolutionProof({ recipient: solverSignerAddress, openAnswers: openAnswersB, multipleChoiceAnswers: multipleChoiceAnswersB })
    expect( await mixedB.verifySolutionProof(proofMixedB) ).to.be.true
    const altProofMixedB = await mixedB.generateSolutionProof({ recipient: altSolverSignerAddress, openAnswers: altOpenAnswersB, multipleChoiceAnswers: multipleChoiceAnswersB })
    expect( await mixedB.verifySolutionProof(altProofMixedB) ).to.be.true

    await mixedB.sendSolutionTransaction( solverSigner, proofMixedB )
    await mixedB.sendSolutionTransaction( altSolverSigner, altProofMixedB ) */

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
    /* const gradeMultipleB = multipleB.gradeSolution({ multipleChoiceAnswers : multipleChoiceAnswersB })
    expect(gradeMultipleB).to.deep.equal({
        grade: 100,
        minimumGrade: 100,
        pass: true,
        nQuestions: 1,
        multipleChoiceGrade: 100,
        openAnswerGrade: 0,
        multipleChoiceWeight: 100,
        openAnswerResults: [],
    }) */
    
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
    /* const gradeOpenB = openB.gradeSolution({ openAnswers: openAnswersB })
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
    }) */

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
    /* const gradeMixedB = mixedB.gradeSolution({ openAnswers: openAnswersB, multipleChoiceAnswers: multipleChoiceAnswersB })
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
    }) */

    return {
        proofMultipleA,
        /* altProofMultipleA,
        proofMultipleB,
        altProofMultipleB, */
        proofOpenA,
        /* altProofOpenA,
        proofOpenB,
        altProofOpenB, */
        proofMixedA,
        /* altProofMixedA,
        proofMixedB,
        altProofMixedB,  */
    };
}

module.exports = generateProofs