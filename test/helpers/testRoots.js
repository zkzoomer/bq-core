import keccak256 from 'keccak256'
import { ethers } from 'ethers'

import { poseidon, rootFromLeafArray } from "../../src/utils/poseidon.js"

// Hereon we define a series of tests to be used when testing the smart contracts / scripts

// Multiple choice tests
const leafArrayA = Array.from({length: 64}, (_, i) => 1)
const leafArrayB = Array.from({length: 64}, (_, i) => 2)

export const multipleChoiceRootA = rootFromLeafArray(leafArrayA)
export const multipleChoiceRootB = rootFromLeafArray(leafArrayB)

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

export const openAnswersRootA = rootFromLeafArray(answerHashesA)
export const openAnswersRootB = rootFromLeafArray(answerHashesB)