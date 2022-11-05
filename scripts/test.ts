const keccak256 = require('keccak256')
const poseidon = require("./utils/poseidon.js");

const ff = require("ffjavascript")

console.log(poseidon(['89477152217924674838424037953991966239322087453347756267410168184682657981552']))

console.log([
    poseidon([BigInt('0x' + keccak256("sneed's").toString('hex'))]).toString(), 
    poseidon([BigInt('0x' + keccak256('feed').toString('hex'))]).toString(),
    poseidon([BigInt('0x' + keccak256('seed').toString('hex'))]).toString()
])