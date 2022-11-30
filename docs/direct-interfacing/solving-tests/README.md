# Solving a Test

Anyone can attempt to solve a Block Qualified Test (BQT). The only restrictions are the credential limit, the time limit, the required pass, as defined on [the Test struct](../bq-tests/the-test-struct.md).

Successfully solving a Block Qualified Test (BQT), will grant the solver a Block Qualified Credential (BQC) NFT. These are, much like BQTs, non-transferable ERC-721 tokens, and they are linked to the BQT they originate from. Each credential is forever linked to its _solver_.

Solving a test is done by calling the following function inside the [TestCreator.sol](../../../contracts/TestCreator.sol) smart contract:

```
    function solveTest(
        uint256 testId, 
        address recipient,
        uint[2] calldata a,
        uint[2][2] calldata b,
        uint[2] calldata c,
        uint[] calldata input  
    ) external nonReentrant { ... }
```

Where *testId* is the unique identifier for the test to solve, and _recipient_ is the address of the _solver_, who would receive, if successful, the credential NFT.

The remaining parameters are used to verify the proof. Remember that this proof is how the solver shows that they know the solution (complete or partial) to a given test, without revealing their answers. 

How this proof is computed, the actual proof (the *a*, *b*, and *c* parameters), and the contents of the *input* array, again depend on the test type of this *testId*. Computing these proofs can be done using [snarkjs](https://github.com/iden3/snarkjs), which is what gets used under the [bqSDK](../../bqsdk/README.md).