pragma circom 2.0.0;

include "./verify_multiple_choice_answers.circom";

// Answer verifier for a maximum of 64 multiple choice questions
component main {public [salt]} = VerifyMultipleChoiceAnswers(6);