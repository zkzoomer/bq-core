# bq - Block Qualified
Get an NFT verifying your credentials by solving tests directly on-chain. 
Powered by ZK-SNARKS.

A sort of sequel to [Block Qualified](https://github.com/0xdeenz/bq), this repo extends and improves on its use cases while focusing just on the backend.

# Documentation
## The Test Object
A test is defined inside the smart contract as a struct containing the following values:
```
    struct Test {
        uint8 testType;  
        uint8 nQuestions;  
        uint8 minimumGrade;  
        uint24 solvers;  
        uint24 credentialLimit;
        uint32 timeLimit;
        address requiredPass;
        uint256 prize;
        string credentialsGained;
    }
```

These values represent the following:
- **testType**: The smart contract supports defining either a multiple choice test, an open answers test, or a mixture of both:
    - **Multiple choice test**: They can have a maximum of 64 questions, where solvers select their correct answers from the choices offered as a list (think A, B, C, D...). 
    
        To define these, you specify a ***testType = 100***. You will also need to specify ***nQuestions = 1*** and ***minmumGrade = 100***. This is by convention, because the way these tests get solved is by providing a proof that you know all of the answers. The only way to gain this kind of credential is to ace the test.

    - **Open answers test**: They can have a maximum of 64 questions, where solvers input their own full solution to each question. Note that possible answers do not have to be provided as a list, the solver is expected to provide a solution from just the question statement.
        
        To define these, you specify a ***testType = 0***. These tests allow for more flexible grading, the result of the test will be the percentage of answers correctly answered.

    - **Mixed test**: These tests combine the previous two kinds into a single proof. Both multiple choice and open answers parts can have up to 64 questions, and each function independently in the same way as described above.

        To define these, you sepecify a ***0 < testType < 100***. This value will specify the weight (as a percentage) of the multiple choice part of this mixed test towards the final grade, which will only be given if this multiple choice section is aced. The remaining part of the grade will come from the open answers component, which has the same flexible grading as described above.

- **nQuestions**: Representing the number of questions the open answers component of this test has, and is used to compute the end mark when solving. The value must be ***1 <= nQuestions <= 64***. For multiple choice tests (*testType = 100*), it is defined as being ***nQuestions = 1***.

- **minimumGrade**: Representing the minimum grade the solver must get to obtain this credential, out of 100. The value must be ***1 <= minimumGrade <= 100***. For multiple choice tests (*testType = 100*), it is defined as being ***minimumGrade = 100***.

- **solvers**: Number of unique addresses who have obtained this credential. The smart contract keeps count of this value.

- **credentialLimit**: Maximum number of unique addresses that can obtain this credential. After this number is reached, all attempts to solve this credential will revert.

- **timeLimit**: In Unix time, limit after which it will not be possible to gain the credential.

- **requiredPass**: Intended as a way to restrict the solving of this credential only to holders a given pass. This represents a smart contract address which must implement a function with the following signature:

    ```function ownerOf(uint256 _tokenId) external view returns (address);```

    Upon solving this test, the solver's will be required to have a balance for this contract address. Note that this can support both ERC-20 and ERC-721 tokens.

- **prize**: Bounty to be given to the first solver of this credential.

- **credentialsGained**: A short description of the credential that can be gained by solving this test

Each test also defines their tokenURI, an external resource containing the questions that make up the test.

## How Tests Work

Tests are solved by providing a zero-knowledge proof where the solver proves their knowledge of the solution, *but without revealing it*. This is done differently for multiple choice tests and open answers tests:

- **Multiple choice test**: The solver provides a proof of their knowledge of the leaves of a Merkle that hash into a specific (and public) root. Each leaf represents a multiple choice question within the test, for a maximum of 64. As this is a multiple choice test, the solver should be informed about the possible solutions from which to choose from for each question. That is, the value of the leaf they will use in their Merkle tree when providing their solution. 

    It is recommended that the possible leaf values map to the letters representing the choices offered: 1 for A, 2 for B, 3 for C... The value 0 is reserved for non-used questions, as the Merkle tree must contain 64 leaves, those leaves that don't have a question assigned to them should take the value 0.

    When creating a test, the credential issuer will need to provide the root of the Merkle tree of the test. This Merkle tree will have at its leaves the choice solution to each of the multiple choice questions, ideally in the numbered format specified above. To gain the credential, the solver will have to prove their knowledge of the preimage of a Merkle tree that hashes into this root.

- **Open answers test**: Within the proof, the solver shows their knowledge of the preimage of various hashes, which represent **their** answers to the 64 questions of the test. These each get compared to the hashes of the actual answers, adding a mark for each correct answer. As part of the output, the proof shows the number of correct answers the solver got.

    The correct answer hashes, which ought to be provided to the solver, get hashed into a Merkle tree. The root of this tree gets sent on chain to verify that the solver is attempting a solution for the appropriate test.

    The credential issuer is tasked with making the **hashes of the correct answers** known, so that the solver can use them as the necessary input for their solution attempt proof. It is recommended that these be provided as part of the *tokenURI*.

    By convention, the hash of a correct answer is defined as follows:

    ```hash = Poseidon( keccak256( CORRECT_ANSWER ) )```

    As such, the solver's actual answers need to be hashed via *keccak256* before being sent as inputs to compute their proofs. Credential issuers may still choose to define the hash of a correct answer differently.

The Merkle trees specified above are all constructed using the SNARK-friendly Poseidon hashing function. 

Remember that mixed tests are a combination of both, and include both types of solving as described into a single proof.

## Creating a Test

This is done by calling the following function inside the smart contract:

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
    ) external payable { ... }
```

The values for *_testType*, *_nQuestions*, *_minimumGrade*, *_credentialLimit*, *_timeLimit*, *_requiredPass*, *_credentialsGained*, and *_testURI* are as defined above. The *prize* value for this test will be the ETH amount that was sent to the smart contract as part of this function call.

The values given for *_solvingHashes* will depend on the test type specified:
    - **Multiple choice test**: single value array, containing the root of the multiple choice Merkle tree, where each leaf is the correct choice out of the given ones, as described above.
    - **Open answers test**: single value array, containing the root of the open answers Merkle tree, where each leaf is the hash of the corresponding correct answer, as described above.
    - **Mixed test**: double value array, with the first value being the hash that defines the multiple choice test component, and the second value being the hash that defines the open answers component.

As a result of calling this function, the credential issuer will be credited a non-transferable BQT (Block Qualified Test) NFT to their wallet. This NFT will be identifiable via its unique *tokenID* (interchangeably called *testId*), which will be used for its interactions.

## Invalidating a Test

This is done by calling the following function inside the smart contract:

```
    function invalidateTest(uint256 testId) external { ... }
```

Invalidating a certain test can only be done by the owner of the corresponding *testId*. 

As a result of the invalidation, the test will no longer be solveable by anyone, which is represented on-chain by a *testType = 255*. If the test has an unclaimed bounty (that is, a prize was specified but no one got to claim it), it will be refunded to the test owner.

The test, and all its attributes will still be viewable on-chain. Similarly, the obtained credential NFTs will still live on chain, but their corresponding *testType* will show that they are now invalidated.

## Solving a Test

This is done by calling the following function inside the smart contract:

```
    function solveTest(
        uint256 testId, 
        uint[2] calldata a,
        uint[2][2] calldata b,
        uint[2] calldata c,
        uint[] calldata input
    ) external nonReentrant { ... }
```

Where *testId* is the unique identifier for the test to solve, and the remaining parameters are used to verify the proof. Remember that this proof is how the solver shows that they know the solution (complete or partial) to a given test, without revealing their answers.

As part of computing a proof, the solver provides a salt: an arbitrary integer that makes each proof unique. These salts get voided at the smart contract level, so that the same proof cannot be used twice, preventing credential forging.

How this proof is computed, the actual proof (the *a*, *b*, and *c* parameters), and the contents of the *input* array, again depend on the test type of this *testId*. Computing these proofs can be done using [snarkjs](https://github.com/iden3/snarkjs). A sample proof generation follows:

- **Multiple choice test**: 

    ```js
    const snarkjs = require("snarkjs");
    const fs = require("fs");

    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        {
            // 64-value array, where each item is the solver's solution to the corresponding multiple choice question
            answers: ANSWERS_ARRAY,  
            // PUBLIC - Arbitrary integer that makes the proof unique. Must not have been used before inside the smart contract
            salt: SALT  
        }, 
        "multiple_choice_test.wasm", 
        "multiple.zkey"
    );
    ```
    The resulting public signals will be a two value array, containing the resulting Merkle root, and the used salt, in that order. This resulting Merkle root gets checked inside the smart contract with the one that the credential issuer provided as the defining multiple choice hash (as explained above) for this *testId*. If they match, the solver is credited a non-transferable BQC (Block Qualified Credential) NFT that is linked to this test.

    The files used above refer to [multiple_choice_test.wasm](./circuits/proof/multiple_choice_test/multiple_choice_test_js/multiple_choice_test.wasm) and [multiple.zkey](./circuits/proof/multiple_choice_test/multiple.zkey).


- **Open answers test**:

    ```js
    const snarkjs = require("snarkjs");
    const fs = require("fs");

    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        {
            // PUBLIC - 64-value array, where each item is the hash of the correct answer to the corresponding open answers question
            answersHash: ANSWERS_HASH_ARRAY, 
            // 64-value array, where each item is the solver's answer to the corresponding open answers question 
            answers: ANSWERS_ARRAY,
            // PUBLIC - Arbitrary integer that makes the proof unique. Must not have been used before inside the smart contract
            salt: SALT  
        }, 
        "open_answer_test.wasm", 
        "open.zkey"
    );
    ```
    The resulting public signals will be a three value array, containing the number of correct answers, the corresponding open answers test Merkle root, and the used salt, in that order. 
    
    This resulting Merkle root gets checked inside the smart contract with the one that the credential issuer provided as the defining open answers hash (as defined above) for this *testId*. If they match and the solver's grade (out of 100) is above the specified minimum for this *testId*, the solver is credited a non-transferable BQC (Block Qualified Credential) NFT that is linked to this test.

    The files used above refer to [open_answer_test.wasm](./circuits/proof/open_answer_test/open_answer_test_js/open_answer_test.wasm) and [open.zkey](./circuits/proof/open_answer_test_js/open.zkey).

- **Mixed test**: 

    ```js
    const snarkjs = require("snarkjs");
    const fs = require("fs");

    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        {   
            // 64-value array, where each item is the solver's solution to the corresponding multiple choice question
            multipleChoiceAnswers: MULTIPLE_CHOICE_ANSWERS_ARRAY,
            // PUBLIC - Arbitrary integer that makes the proof unique. Must not have been used before inside the smart contract
            multipleChoiceSalt: SALT_MULTIPLE_CHOICE_COMPONENT,
            // PUBLIC - 64-value array, where each item is the hash of the correct answer to the corresponding open answers question
            openAnswersHash: ANSWERS_HASH_ARRAY, 
            // 64-value array, where each item is the solver's answer to the corresponding open answers question 
            openAnswers: ANSWERS_ARRAY,
            // PUBLIC - Arbitrary integer that makes the proof unique. Must not have been used before inside the smart contract
            openAnswersSalt: SALT_OPEN_ANSWERS_COMPONENT  
        }, 
        "mixed_test.wasm", 
        "mixed.zkey"
    );
    ```
    One can see that the inputs for generating this single proof are a combination of the inputs necessary to generate the proofs defined above. The resulting public signals will be a five value array, containing: the resulting Merkle root for the multiple choice component, the number of correct answers for the open answers component, the corresponding open answer test Merkle root, and the salts for the multiple choice and open answers parts, in that order.

    These two resulting Merkle roots get checked inside the smart contract the same way as described above for each of the components of the mixed test. If the resulting grade, which is a sum of the multiple choice component (weighted by the value of *testType*) and the open answers component, is above the specified minimum for this *testId*, the solver is credited a non-transferable BQC (Block Qualified Credential) NFT that is linked to this test.

    The files used above refer to [mixed_test.wasm](./circuits/proof/mixed_test/mixed_test_js/mixed_test.wasm) and [mixed.zkey](./circuits/proof/mixed_test/mixed.zkey).
    

## Miscellaneous
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



Used salts are stored in a public mapping inside the smart contract, named *usedSalts*. Although it is unlikely that a randomly generated *uint256* would result in salt collision, it is possible to check if a given salt has already been used by calling the following view function:

```
    function usedSalts(uint256) public view returns(bool) { ... }
```

Both BQT and BQC NFTs are non-transferable ERC-721 compatible tokens, and will show up as part of the issuer/solver balance on explorers such as Etherscan.


#
#### Stay tuned for a full integration with [useWeb3](https://www.useweb3.xyz/).
#### Reach out on Twitter: https://twitter.com/0xdeenz

