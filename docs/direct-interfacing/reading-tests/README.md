# Reading Test Data

Other functions inside the the [TestCreator.sol](../../../contracts/TestCreator.sol) smart contract allow us to get more information about each test object.

The hashes that define each *testId* can be accessed via the following functions, depending on the *testType*:

- **Multiple choice test**: 

```
    function getMultipleChoiceRoot(uint256 testId) external view returns (uint256) { ... }
```

- **Open answers test**:

```
    function getOpenAnswersRoot(uint256 testId) external view returns (uint256) { ... }
```

- **Mixed test**: using both functions specified above, for each their multiple choice and open answers components.