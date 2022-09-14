pragma circom 2.0.0;

include "./verify_multiple_choice_answers.circom";
include "./verify_open_answers.circom";

template MixedTest(k, n) {
    // Number of multiple choice questions, which are the leaves in the answers tree
    var m = 2**k;

    // The multiple choice part of the test requires the leaves in the answers tree and the salt
    signal input multipleChoiceAnswers[m];
    signal input salt;
    // The open ended part of the test requires the hashes of the answers as well as the user's answers
    signal input openAnswersHash[n];
    signal input openAnswers[n];

    // Output signals, the test result is computed at the smart contract level
    signal output solvingHash;
    signal output correctNumber;

    component multipleChoicePart = VerifyMultipleChoiceAnswers(k);
    component openAnswerPart = VerifyOpenAnswers(n);

    multipleChoicePart.salt <== salt;

    for (var i = 0; i < m; i++) {
        multipleChoicePart.answers[i] <== multipleChoiceAnswers[i];
    }

    for (var i = 0; i < n; i++) {
        openAnswerPart.answersHash[i] <== openAnswersHash[i];
        openAnswerPart.answers[i] <== openAnswers[i];
    }

    solvingHash <== multipleChoicePart.solvingHash;
    correctNumber <== openAnswerPart.correctNumber;
}

component main {public [salt, openAnswersHash]} = MixedTest(6, 50);
