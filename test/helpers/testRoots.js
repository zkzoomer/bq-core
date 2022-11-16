const keccak256 = require('keccak256')

const { poseidon, rootFromLeafArray } = require("../../src/poseidon.js")

// Hereon we define a series of tests to be used when testing the smart contracts / scripts

// Multiple choice tests
const leafArrayA = Array.from({length: 64}, (_, i) => 1)
const leafArrayB = Array.from({length: 64}, (_, i) => 2)

const multipleChoiceRootA = rootFromLeafArray(leafArrayA).toString()
const multipleChoiceRootB = rootFromLeafArray(leafArrayB).toString()

// open answer test
const answerHashesA = Array(64).fill(
    poseidon([BigInt('0x' + keccak256("").toString('hex'))]).toString()
);
answerHashesA[0] = poseidon([BigInt('0x' + keccak256("sneed's").toString('hex'))]).toString()
answerHashesA[1] = poseidon([BigInt('0x' + keccak256('feed').toString('hex'))]).toString()
answerHashesA[2] = poseidon([BigInt('0x' + keccak256('seed').toString('hex'))]).toString()

const answerHashesB = new Array(64).fill(
    poseidon([BigInt('0x' + keccak256("deenz").toString('hex'))]).toString()
);

const openAnswersRootA = rootFromLeafArray(answerHashesA).toString()
const openAnswersRootB = rootFromLeafArray(answerHashesB).toString()

const multipleChoiceAnswersA = Array.from({length: 64}, (_, i) => 1)
const multipleChoiceAnswersB = Array.from({length: 64}, (_, i) => 2)

const openAnswersA = [
    "sneed's",
    'feed',
    'seed'
]

const openAnswersB = new Array(64).fill("deenz")
openAnswersB[0] = "tree"
openAnswersB[1] = "fiddy"
const altOpenAnswersB = new Array(64).fill("deenz")

module.exports = {
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
}