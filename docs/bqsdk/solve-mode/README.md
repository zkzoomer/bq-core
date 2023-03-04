# Using a _bqTest_ Object in Solving Mode

First, we will need to define a new solving mode _bqTest_. We can do so simply by running:

```js
const solveModeTest = await bqTest.solveMode(
    testId,
    ethersProvider,
    testCreatorAddress,
    openAnswerHashes = null
)
```

The initialization is the same as in [reading mode](../read-mode/README.md), except for the additional _openAnswerHashes_ parameter, used for both open answer and mixed tests. 

If left undefined, _openAnswerHashes_ will be retreived from the blockchain. For this, it must have been defined prior by the _credential issuer_ [verifying their test](../../direct-interfacing/creating-tests/verifying-test.md), else the test will not be solvable. Multiple choice tests need not define this parameter.

As the protocol still lacks an official deployed contract, this test creator address is left for the user to define after they themselves deploy it. In future versions this will be given a default value deployed on a specified chain.

When defined on solve mode, a _bqTest_ object can be used to 
- [Grade solutions](grading.md)
- [Generate the corresponding proofs](generating-proof.md) 
- [Verify generated proofs](verifying-proof.md)
- [Sending the solving transactions on chain](sending-tx.md)

For each of these sections we will make use of the testnet deployed [TestCreator.sol](https://mumbai.polygonscan.com/address/0x403E6BBCB3Ddbe3487c09E8827e5dEf058FE6db4#code) to provide implementation examples, and thus we define:

```js
const solveModeTest = await bqTest.solveMode(
    '1',
    ethersProvider,
    '0x403E6BBCB3Ddbe3487c09E8827e5dEf058FE6db4'
)
```

We provide no _openAnswerHashes_ as the test has already been verified on-chain. You will not need to define this data as the bqTest object will retrieve it directly from the blockchain.