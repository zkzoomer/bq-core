# Retrieving Data From a _bqTest_ Object

Once defined, the _bqTest_ object loads all the necessary information into memory, which can be accessed via the methods described below.

For this section we will make use of the testnet deployed contracts to provide implementation examples. First, we will define a new _bqTest_ object in reading mode by doing:

```js
const readModeTest = await bqTest.readMode(
    '1',
    ethersProvider,
    '0x403E6BBCB3Ddbe3487c09E8827e5dEf058FE6db4'
)
```

Where, for this example, _ethersProvider_ is a valid [ethers.providers.JsonRpcProvider](https://docs.ethers.io/v5/api/providers/jsonrpc-provider/) for the Mumbai testnet, since this is were the testing smart contracts are located. An exam has already been created on [TestCreator.sol](https://mumbai.polygonscan.com/address/0x403E6BBCB3Ddbe3487c09E8827e5dEf058FE6db4#code), with _testId = 1_.

The bqSDK allows us to easily retrieve data about this defined test:

- **_stats_**: returns the stats for this test, that is, the [_Test_ struct](../../direct-interfacing/bq-tests/the-test-struct.md) for this test. This attribute will return the entire Test struct:

```js
> console.log(readModeTest.stats)
> [
  50,
  64,
  1,
  1,
  0,
  0,
  '0x0000000000000000000000000000000000000000',
  'Test Credential',
  testType: 50,
  nQuestions: 64,
  minimumGrade: 1,
  solvers: 1,
  timeLimit: 0,
  requiredPass: '0x0000000000000000000000000000000000000000',
]    
```

But we can also choose to query its individual keys:

```js
> console.log(readModeTest.stats.testType)
> 50   
```

The meaning of each of these keys is given inside the definition of [the _Test_ struct](../../direct-interfacing/bq-tests/the-test-struct.md)

- **_isValid_**: returns whether this test is currently solvable or not. A test is valid immediately after being minted, and can only be invalidated by the owner, which is a permanent action.

```js
> console.log(readModeTest.isValid)
> true
```

- **_URI_**: returns the test URI.

```js
> console.log(readModeTest.URI)
> 'https://gateway.ipfs.io/ipfs/QmcniBv7UQ4gGPQQW2BwbD4ZZHzN3o3tPuNLZCbBchd1zh'
```

- **_holdersNumber_**: returns the number of holders for this credential, that is, the amount of people who have solved the test.

```js
> console.log(readModeTest.holdersNumber)
> 1
```

- **_async holdersList()_**: returns the list of the accounts that have received this credential.

```js
> const holders = await readModeTest.holdersList()
> console.log(holders)
> [ '0x1B02c971d0322DB82170FB7950D45D26Efc5853B' ]
```

- **_async holdsCredential(address)_**: returns whether the specified _address_ has received this credential.

```js
> const holderOne = await readModeTest.holdsCredential('0x1B02c971d0322DB82170FB7950D45D26Efc5853B')
> console.log(holderOne)
> true
>
> const holderTwo = await readModeTest.holdsCredential('0xd3a10e16851A160CC486A96Bf884F4d406f02Ffa')
> console.log(holderTwo)
> false
```

Note that you may not get exactly the same values as provided here as other users solve this demo test.