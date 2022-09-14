pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circomlib/circuits/poseidon.circom";

template VerifyOpenAnswers(nQuestions) {
    // Hashes of the correct answers
    signal input answersHash[nQuestions];
    // The solver's answers
    signal input answers[nQuestions];
    // Number of the solver's answers that are correct
    // Starts at zero, is increased on correct answer, the test result is computed at the smart contract level
    signal output correctNumber;
    var _correctNumber = 0;  

    // Each question requires a proof that the solver has a preimage that results in a given hash, and this hash
    // needs to be compared with the correct answer hash - this will grant a point
    component hashers[nQuestions];
    component comparators[nQuestions];

    for (var i = 0; i < nQuestions; i++) {
        hashers[i] = Poseidon(1);
        comparators[i] = IsEqual();

        hashers[i].inputs[0] <== answers[i];
        comparators[i].in[0] <== answersHash[i];
        comparators[i].in[1] <== hashers[i].out;

        // Only if the correct answer hash and the provided answer hash are the same does a point get awarded
        _correctNumber += comparators[i].out;
    }   

    // Feedback on which questions were answered correctly can be managed at the frontend level, by looking at
    // the correct answer hashes 
    correctNumber <== _correctNumber;
}