# Using a _bqTest_ Object in Reading Mode

First we will need to define a new reading mode _bqTest_. We can do so simply by running:

```js
const readModeTest = await bqTest.readMode(
    testId,
    ethersProvider,
    testCreatorAddress
)
```

Where:
- **_testId_** is the unique integer indentifier of the test you wish to load.
- **_ethersProvider_** is a valid [ethers.providers.JsonRpcProvider](https://docs.ethers.io/v5/api/providers/jsonrpc-provider/) which will be used to retreive the necessary data.
- **_testCreatorAddress_** is the corresponding smart contract address of the [TestCreator](./contracts/TestCreator.sol) smart contract to interact with.

As the protocol still lacks an official deployed contract, this test creator address is left for the user to define after they themselves deploy it. In future versions this will be given a default value deployed on a specified chain.