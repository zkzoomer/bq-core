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

// TODO: add examples

- _stats()_: returns the stats for this test, that is, the [_Test_ struct](##the-test-object) for this test.

- _isValid()_: returns whether this test is currently solvable or not.

- _URI()_: returns the test URI.

- _holdersNumber()_: returns the number of holders for this credential, that is, the amount of people who have solved the test.

- **async** _holdersList()_: returns the list of the accounts that have received this credential.

- **async** _holdsCredential(address)_: returns whether the specified _address_ has received this credential.

