# How to Solve Tests

A [Block Qualified test](../../direct-interfacing/bq-tests/README.md) can be either multiple choice, open answer or mixed. This is given by the value for the _testType_, which is described under [the _Test_ struct](../../direct-interfacing/bq-tests/the-test-struct.md). The answers we need to provide will depend on the kind of test:

- **Multiple choice tests**: we will need to provide an array containing the answers for each of the questions, in order. As the test is multiple choice, there should be a list of possible answers provided by the credential issuer from which the solver should pick. The credential issuer can choose to define these as they wish, but we recommend the following structure:
    - Defining the multiple choices as being A, B, C, ...
    - Assigning an increasing integer to each: A => 1, B => 2, C => 3, ...
    - Using 0 for questions that need not be answered
This is the structured followed for the bqSDK, where the user can just provide a list of numbers as their solution. Each of these numbers will map into one of the multiple choices given. 

    As the proof needs to be generated with an array of length 64, the bqSDK will then fill up this array with zeros until its length is 64.

- **Open answers tests**: we will also need to provide an array containing the answers for each of the questions, in order. The credential issuer can choose to define how these operate, but we recommend the following structure:
    - Hashing each of the user's answers via [keccak256](https://www.npmjs.com/package/keccak256)
    - Using these hashed answers to generate the proof
This is the structure followed for the bqSDK, where the user can just provide a list of strings of their answers. Each of these answers will be hashed via keccak256 to generate the proofs with.

    As the proof needs to be generated with an array of length 64, the bqSDK will then fill up this array with ```keccak256("")``` until its length is 64.

- **Mixed tests**: as they incorporate both test types into one, each of its components will be solved as described above.