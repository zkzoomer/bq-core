# Verifying a Test

The owner of a test can choose to _'verify it'_ by providing the open answer hashes needed to solve it directly on-chain. We can do so by calling the following function inside the [TestCreator.sol](../../../contracts/TestCreator.sol) smart contract:

```
function verifyTestAnswers(
    uint256 testId,
    uint256[] memory answerHashes
)
```

And providing it the _answerHashes_ (open answer hashes) for the given _testId_. Bear in mind that, once set, these answer hashes cannot be overwritten.

We assume that the _credential issuer_ will provide the correct _answerHashes_ necessary to solve their credential. Even though the smart contract could define a way to verify this, it is after all in the credential issuer best interest to give tests that are solvable.