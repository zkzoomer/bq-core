# Invalidating a Test

We can do so by calling the following function inside the [TestCreator.sol](../../../contracts/TestCreator.sol) smart contract:

```
    function invalidateTest(uint256 testId) external { ... }
```

Invalidating a certain test can only be done by the owner of the corresponding *testId*. 

As a result of the invalidation, the test will no longer be solveable by anyone, which is represented on-chain by a *testType = 255*. 

The test, and all its attributes will still be viewable on-chain. Similarly, the obtained credential NFTs will still live on chain, but their corresponding *testType* will show that they are now invalidated.