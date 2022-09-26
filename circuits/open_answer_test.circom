pragma circom 2.0.0;

include "./verify_open_answers.circom";

// Answer verifier for a maximum of 50 open answer questions
component main {public [salt]} = VerifyOpenAnswers(6);