// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "./verifiers/OpenAnswerVerifier.sol";
import "./verifiers/MultipleChoiceVerifier.sol";
import "./verifiers/MixedTestVerifier.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

interface IPoseidon {
    function poseidon(uint256[2] calldata) external pure returns(uint256);
}

contract TestVerifier {
    using SafeMath for uint256;
    using SafeMath for uint32;

    // Smart contract for hashing with the Poseidon algorithm
    IPoseidon public poseidonHasher;

    MultipleChoiceVerifier multipleChoiceVerifier;
    OpenAnswerVerifier openAnswerVerifier;
    MixedTestVerifier mixedTestVerifier;

    struct Proof {
        uint[2] a;
        uint[2][2] b;
        uint[2] c;
        uint[] input;
    }

    constructor (address _poseidonHasher) {
        multipleChoiceVerifier = new MultipleChoiceVerifier();
        openAnswerVerifier = new OpenAnswerVerifier();
        mixedTestVerifier = new MixedTestVerifier();

        poseidonHasher = IPoseidon(_poseidonHasher);
    }

    function _verifyMultipleChoiceSolution(uint256 solvingHash, uint256 salt, uint256 solutionHash) internal view returns (bool verified) {
        verified = solvingHash == poseidonHasher.poseidon([salt, solutionHash]) ? true : false;
    }

    function getMultipleChoiceResults(
        uint solutionHash, 
        uint[2] calldata a,
        uint[2][2] calldata b,
        uint[2] calldata c,
        uint[2] calldata input
    ) external view returns(uint256 result) {
        require(multipleChoiceVerifier.verifyProof(a, b, c, input), "Invalid proof");
        result = _verifyMultipleChoiceSolution(input[0], input[1], solutionHash) ? 100 : 0;
    }

    function getOpenAnswerResults(
        uint[2] calldata a,
        uint[2][2] calldata b,
        uint[2] calldata c,
        uint[51] calldata input
    ) external view returns(uint256 result) {
        require(openAnswerVerifier.verifyProof(a, b, c, input), "Invalid proof");
        result = input[0];
    }

    function getMixedTestResults(
        uint solutionHash, 
        uint[2] calldata a,
        uint[2][2] calldata b,
        uint[2] calldata c,
        uint[53] calldata input
    ) external view returns(uint256 result) {
        // results: multiple choice test +100, +1 per open ended question for max of 50 -> can later get managed on frontend
        require(mixedTestVerifier.verifyProof(a, b, c, input), "Invalid proof");
        result = _verifyMultipleChoiceSolution(input[0], input[2], solutionHash) ? 100 : 0;
        result += input[1];
    }

}

