const keccak256 = require('keccak256')

const { poseidon, rootFromLeafArray } = require("../../src/poseidon.js")

// Hereon we define a series of tests to be used when testing the smart contracts / scripts

// Multiple choice tests
const leafArray = Array.from({length: 64}, (_, i) => 1)

const multipleChoiceRoot = rootFromLeafArray(leafArray).toString()

// open answer test
const answerHashesA = [
    poseidon([BigInt('0x' + keccak256("sneed's").toString('hex'))]).toString(),
    poseidon([BigInt('0x' + keccak256('feed').toString('hex'))]).toString(),
    poseidon([BigInt('0x' + keccak256('seed').toString('hex'))]).toString()
]

//
const fullAnswerHashesA = Array(64).fill(
    poseidon([BigInt('0x' + keccak256("").toString('hex'))]).toString()
);
fullAnswerHashesA.forEach( (_, i) => { if (i < answerHashesA.length) {
    fullAnswerHashesA[i] = answerHashesA[i]
}})

const answerHashesB = new Array(64).fill(
    poseidon([BigInt('0x' + keccak256("deenz").toString('hex'))]).toString()
);

const openAnswersRootA = rootFromLeafArray(fullAnswerHashesA).toString()
const openAnswersRootB = rootFromLeafArray(answerHashesB).toString()

const multipleChoiceAnswers = Array.from({length: 64}, (_, i) => 1)

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
    multipleChoiceRoot,
    answerHashesA,
    answerHashesB,
    openAnswersRootA,
    openAnswersRootB,
    multipleChoiceAnswers,
    openAnswersA,
    openAnswersB,
    altOpenAnswersB
}