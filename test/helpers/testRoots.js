const keccak256 = require('keccak256')

const { poseidon, rootFromLeafArray } = require("../../src/poseidon.js")

// Hereon we define a series of tests to be used when testing the smart contracts / scripts

// Multiple choice tests
const leafArrayA = Array.from({length: 64}, (_, i) => 1)
const leafArrayB = Array.from({length: 64}, (_, i) => 2)

const multipleChoiceRootA = rootFromLeafArray(leafArrayA)
const multipleChoiceRootB = rootFromLeafArray(leafArrayB)

// open answer test
const answerHashesA = Array(64).fill(
    poseidon([BigInt('0x' + keccak256("").toString('hex'))])
);
answerHashesA[0] = poseidon([BigInt('0x' + keccak256("sneed's").toString('hex'))])
answerHashesA[1] = poseidon([BigInt('0x' + keccak256('feed').toString('hex'))])
answerHashesA[2] = poseidon([BigInt('0x' + keccak256('seed').toString('hex'))])

const answerHashesB = new Array(64).fill(
    poseidon([BigInt('0x' + keccak256("deenz").toString('hex'))])
);

const openAnswersRootA = rootFromLeafArray(answerHashesA)
const openAnswersRootB = rootFromLeafArray(answerHashesB)

module.exports = {
    multipleChoiceRootA,
    multipleChoiceRootB,
    answerHashesA,
    answerHashesB,
    openAnswersRootA,
    openAnswersRootB
}