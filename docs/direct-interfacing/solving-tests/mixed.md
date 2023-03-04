# Solving a Mixed Test

We first need to generate the corresponding proof by running:

```js
const snarkjs = require("snarkjs");
const fs = require("fs");

const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    {   
        // 64-value array, where each item is the solver's solution to the corresponding multiple choice question
        multipleChoiceAnswers: MULTIPLE_CHOICE_ANSWERS_ARRAY
        // 64-value array, where each item is the hash of the correct answer to the corresponding open answers question
        openAnswersHash: ANSWERS_HASH_ARRAY, 
        // 64-value array, where each item is the solver's answer to the corresponding open answers question 
        openAnswers: ANSWERS_ARRAY,
        // PUBLIC - decimal value of the address that will be the one receiving the credential
        salt: SALT 
    }, 
    "mixed.wasm", 
    "mixed.zkey"
);
```

One can see that the inputs for generating this single proof are a combination of the inputs necessary to generate the proofs defined above. The resulting public signals will be a four value array: three output signals and one input signal. These are the resulting Merkle root for the multiple choice component, the number of correct answers for the open answers component, the corresponding open answer test Merkle root, and the used salt, in that order. When calling the smart contract, this salt (which is the recipient address as decimal) is given separately.

These two resulting Merkle roots get checked inside the smart contract the same way as described above for each of the components of the mixed test. If the resulting grade, which is a sum of the multiple choice component (weighted by the value of *testType*) and the open answers component, is above the specified minimum for this *testId*, the solver is credited a non-transferable BQC (Block Qualified Credential) NFT that is linked to this test.

The files used above refer to [mixed.wasm](https://blockqualified.s3.us-east-2.amazonaws.com/mixed.wasm) and [mixed.zkey](https://blockqualified.s3.us-east-2.amazonaws.com/mixed.zkey).