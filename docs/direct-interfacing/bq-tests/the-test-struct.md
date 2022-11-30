# The Test Struct

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
        string credentialsGained;
    }
```

These values represent the following:
- **testType**: The smart contract supports defining either a multiple choice test, an open answers test, or a mixture of both:
    - **Multiple choice test**: They can have a maximum of 64 questions, where solvers select their correct answers from the choices offered as a list (think A, B, C, D...). 
    
        To define these, you specify a ***testType = 100***. You will also need to specify ***nQuestions = 1*** and ***minimumGrade = 100***. This is by convention, because the way these tests get solved is by providing a proof that you know all of the answers. The only way to gain this kind of credential is to ace the test.

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

- **credentialsGained**: A short description of the credential that can be gained by solving this test

Each test also defines their tokenURI, an external resource containing the questions that make up the test.