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
        uint solvingHash,
        uint salt
    ) public view returns(uint256) {
        require(multipleChoiceVerifier.verifyProof(a, b, c, [solvingHash, salt]), "Invalid proof");
        require(_verifyMultipleChoiceSolution(solvingHash, salt, solutionHash), "Wrong solution");
        // Only returns 100 if the proof is verified and the test was solved accordingly
        return 100;
    }

    function getOpenAnswerResults(
        uint[2] calldata a,
        uint[2][2] calldata b,
        uint[2] calldata c,
        uint result, 
        uint salt,
        uint[] memory answerHashes
    ) public view returns(uint256) {
        require(openAnswerVerifier.verifyProof(a, b, c, result, salt, answerHashes), "Invalid proof");
        require(result > 0, "No correct answers");
        return result;
    }

    function getMixedTestResults(
        uint solutionHash, 
        uint[2] calldata a,
        uint[2][2] calldata b,
        uint[2] calldata c,
        uint solvingHash,
        uint result,
        uint multipleChoiceSalt, 
        uint openAnswersSalt,
        uint[] memory answerHashes
    ) public view returns(uint256) {
        // results: multiple choice test +100, +1 per open ended question for max of 50 -> can later get managed on frontend
        require(mixedTestVerifier.verifyProof(a, b, c, solvingHash, result, multipleChoiceSalt, openAnswersSalt, answerHashes), "Invalid proof");
        uint _result = result + (_verifyMultipleChoiceSolution(solvingHash, multipleChoiceSalt, solutionHash) ? 100 : 0);
        require(_result > 0, "Wrong solution and no correct answers"); 
        return _result;
    }

}

