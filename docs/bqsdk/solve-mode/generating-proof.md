# Generating the Proof for a Solution

We can grade a solution for an already defined _bqTest_ in solve mode (_solveModeTest_) by doing:

```js
const solutionProof = await solveModeTest.generateSolutionProof({ 
    recipient, 
    openAnswers, 
    multipleChoiceAnswers 
})
```
Where the values for _openAnswers_ and _multipleChoiceAnswers_ are as specified for [grading a solution](grading.md), and the _recipient_ is the address that would be receiving the credential NFT.

Calling this method will return a _proof_ object.

// TODO: add examples