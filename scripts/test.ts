const keccak256 = require('keccak256')
const snarkjs = require("snarkjs");
const random = require("random-bigint")

const multvkey = require("./proof/multiple_verification_key.json")

snarkjs.groth16.fullProve(
    {
        answers: new Array(64).fill(0),  
        salt: random(256).toString()
    }, 
    "./proof/multiple.wasm", 
    "./proof/multiple.zkey"
).then(( {proof, publicSignals} ) => { 

    console.log(proof)
    console.log(publicSignals)

    snarkjs.groth16.verify(
        multvkey, publicSignals, proof
    ).then( (res) => { console.log(res) })
})
