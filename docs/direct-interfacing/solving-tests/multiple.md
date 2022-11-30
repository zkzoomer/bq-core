# Solving a Multiple Choice Test

We first need to generate the corresponding proof by running:

```js
const snarkjs = require("snarkjs");
const fs = require("fs");

const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    {
        // 64-value array, where each item is the solver's solution to the corresponding multiple choice question
        answers: ANSWERS_ARRAY,  
        // PUBLIC - decimal value of the address that will be the one receiving the credential
        salt: SALT  
    }, 
    "multiple.wasm", 
    "multiple.zkey"
);
```

The resulting public signals will be a two value array: one output signal and one input signal. These are the resulting Merkle root, and the used salt, in that order. When calling the smart contract, this salt (which is the recipient address as decimal) is given separately.
    
This resulting Merkle root gets checked inside the smart contract with the one that the credential issuer provided as the defining multiple choice hash (as explained above) for this *testId*. If they match, the solver is credited a non-transferable BQC (Block Qualified Credential) NFT that is linked to this test.

The files used above refer to [multiple.wasm](../../../proof/multiple/multiple.wasm) and [multiple.zkey](../../../proof/multiple/multiple.zkey).