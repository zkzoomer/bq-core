/* const poseidon = require("./utils/poseidon.js");
const poseidonMerkle = require('./utils/poseidonMerkle.js');
const keccak256 = require('keccak256')

// Open asnwers test
const answerHashesA = [
    poseidon([BigInt('0x' + keccak256("sneed's").toString('hex'))]), 
    poseidon([BigInt('0x' + keccak256('feed').toString('hex'))]),
    poseidon([BigInt('0x' + keccak256('seed').toString('hex'))])
]
const answerHashesB = new Array(64).fill(
    poseidon([BigInt('0x' + keccak256("deenz").toString('hex'))])
);

const _answerHashesA = new Array(64).fill(poseidon([0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470]));
_answerHashesA[0] = poseidon([BigInt('0x' + keccak256("sneed's").toString('hex'))])
_answerHashesA[1] = poseidon([BigInt('0x' + keccak256('feed').toString('hex'))])
_answerHashesA[2] = poseidon([BigInt('0x' + keccak256('seed').toString('hex'))])

const answerHashesA_root = poseidonMerkle.rootFromLeafArray(_answerHashesA)
const answerHashesB_root = poseidonMerkle.rootFromLeafArray(answerHashesB)

// BIG PROBLEM HERE - read docs, understand wtf goin on
console.log(answerHashesA_root, answerHashesB_root)
console.log('0x' + keccak256("").toString('hex'))
console.log(BigInt('0x' + keccak256("").toString('hex')))
console.log(poseidon([BigInt('0x' + keccak256("").toString('hex'))]))
console.log(poseidon([BigInt("0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470")]))
console.log(poseidon([BigInt("89477152217924674838424037953991966239322087453347756267410168184682657981552")]))
console.log(BigInt("89477152217924674838424037953991966239322087453347756267410168184682657981552") - BigInt('0x' + keccak256("").toString('hex'))) */