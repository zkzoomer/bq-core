pragma circom 2.0.0;

include "./hasher.circom";
include "./get_merkle_root.circom";

template VerifyMultipleChoiceAnswers(k) {
    // A tree of height k has 2**k leaves in it, these are the total number of questions the test has
    var nQuestions = 2**k;

    // Ansers given by the user, as an array of integers that are mapped with the multiple choices
    // EG: A --> 1, B --> 2, C --> 3, D --> 4, ...
    signal input answers[nQuestions];
    // Cryptographic salt, must be stored and voided inside the smart contract once used
    signal input salt;
    // Merkle root of the user's answers
    signal output solutionHash;

    // Corresponds to the Merkle root of putting these answers into a tree, the given user's proposed solution
    // The real solving hash is stored in the smart contract, result of the actual solution
    component merkleRoot = GetMerkleRoot(k);
    for (var i = 0; i < nQuestions; i++) {
        merkleRoot.leaves[i] <== answers[i];
    }

    // Add hidden signals to make sure that tampering with salt will invalidate the snark proof
    signal saltSquare;
    saltSquare <== salt * salt;

    // This solution hash will be checked inside the smart contract to see if it is valid
    solutionHash <== merkleRoot.root;
}
