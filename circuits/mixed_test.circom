pragma circom 2.0.0;

include "./verify_multiple_choice_answers.circom";
include "./verify_open_answers.circom";

template MixedTest(k, p) {
    // Number of multiple choice questions, which are the leaves in the answers tree
    var m = 2**k;
    // Number of open choice questions, also work as leaves
    var n = 2**p;

    // The multiple choice part of the test requires the leaves in the answers tree and the salt
    signal input multipleChoiceAnswers[m];
    signal input multipleChoiceSalt;
    // The open ended part of the test requires the hashes of the answers as well as the user's answers
    signal input openAnswersHash[n];
    signal input openAnswers[n];
    signal input openAnswersSalt;

    // Output signals, the test result is computed at the smart contract level
    signal output solutionHash;
    signal output correctNumber;
    signal output answersHashRoot;

    // A mixed test is composed of a multiple choice part and an open answer part
    component multipleChoicePart = VerifyMultipleChoiceAnswers(k);
    component openAnswerPart = VerifyOpenAnswers(p);

    // Uses two salts, both will be voided at the smart contract level
    multipleChoicePart.salt <== multipleChoiceSalt;
    openAnswerPart.salt <== openAnswersSalt;

    // Defining the multiple choice part
    for (var i = 0; i < m; i++) {
        multipleChoicePart.answers[i] <== multipleChoiceAnswers[i];
    }

    // Defining the open answer part
    for (var i = 0; i < n; i++) {
        openAnswerPart.answersHash[i] <== openAnswersHash[i];
        openAnswerPart.answers[i] <== openAnswers[i];
    }

    // Output signals
    solutionHash <== multipleChoicePart.solutionHash;
    correctNumber <== openAnswerPart.correctNumber;
    answersHashRoot <== openAnswerPart.answersHashRoot;
}

component main {public [multipleChoiceSalt, openAnswersSalt]} = MixedTest(6, 6);
