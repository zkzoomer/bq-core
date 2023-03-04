# Solving an Open Choice Test

We first need to generate the corresponding proof by running:

```js
const snarkjs = require("snarkjs");
const fs = require("fs");

const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    {
        // 64-value array, where each item is the hash of the correct answer to the corresponding open answers question
        answersHash: ANSWERS_HASH_ARRAY, 
        // 64-value array, where each item is the solver's answer to the corresponding open answers question 
        answers: ANSWERS_ARRAY,
        // PUBLIC - decimal value of the address that will be the one receiving the credential
        salt: SALT  
    }, 
    "open.wasm", 
    "open.zkey"
);
```

The resulting public signals will be a three value array: two output signals and one input signal. These are the number of correct answers, the corresponding open answers test Merkle root, and the used salt, in that order. When calling the smart contract, this salt (which is the recipient address as decimal) is given separately.

This resulting Merkle root gets checked inside the smart contract with the one that the credential issuer provided as the defining open answers hash (as defined above) for this *testId*. If they match and the solver's grade (out of 100) is above the specified minimum for this *testId*, the solver is credited a non-transferable BQC (Block Qualified Credential) NFT that is linked to this test.

The files used above refer to [open.wasm](https://blockqualified.s3.us-east-2.amazonaws.com/open.wasm) and [open.zkey](https://blockqualified.s3.us-east-2.amazonaws.com/open.wasm).