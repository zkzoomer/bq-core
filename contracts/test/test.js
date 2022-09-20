const keccak256 = require('keccak256')
const poseidon = require("./utils/poseidon.js");


console.log(BigInt('0x' + keccak256('').toString('hex')))

console.log([
    poseidon([BigInt('0x' + keccak256("sneed's").toString('hex'))]), 
    poseidon([BigInt('0x' + keccak256('feed').toString('hex'))]),
    poseidon([BigInt('0x' + keccak256('&').toString('hex'))]),
    poseidon([BigInt('0x' + keccak256('seed').toString('hex'))])
])