# Minting a New Test

We can do so by calling the following function inside the [TestCreator.sol](../../../contracts/TestCreator.sol) smart contract:
```
    function createTest(
        uint8 _testType,
        uint8 _nQuestions,
        uint8 _minimumGrade,
        uint24 _credentialLimit,
        uint32 _timeLimit,
        uint256[] calldata _solvingHashes,
        address _requiredPass,
        string memory _credentialsGained,
        string memory _testURI
    ) external { ... }
```

The values for *_testType*, *_nQuestions*, *_minimumGrade*, *_credentialLimit*, *_timeLimit*, *_requiredPass*, *_credentialsGained*, and *_testURI* are as defined for [the Test struct](../bq-tests/the-test-struct.md).

The values given for *_solvingHashes* will depend on the test type specified:
    - **Multiple choice test**: single value array, containing the root of the multiple choice Merkle tree, where each leaf is the correct choice out of the given ones, as described above.
    - **Open answers test**: single value array, containing the root of the open answers Merkle tree, where each leaf is the hash of the corresponding correct answer, as described above.
    - **Mixed test**: double value array, with the first value being the hash that defines the multiple choice test component, and the second value being the hash that defines the open answers component.

As a result of calling this function, the credential issuer will be credited a non-transferable BQT (Block Qualified Test) NFT to their wallet. This NFT will be identifiable via its unique *tokenID* (interchangeably called *testId*), which will be used for its interactions.