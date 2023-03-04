# Using the bqSDK

The bqSDK is centered around the _bqTest_ object. You can import it at the top of your file by doing:

```javascript
import { bqTest } from "bq-core"
```

This can be used in two different ways:
- **Reading mode**: to just retrieve the on-chain data that defines a test.
- **Solving mode**: extending on the reading mode usability, it also allows you to grade solutions, generate and verify the corresponding proofs, and post solving transactions.

The examples provided here have been done using deployed contracts on the Mumbai testnet. An exam has already been created on [TestCreator.sol](https://mumbai.polygonscan.com/address/0xECe4239a93F97e52aE88b64228d38e39195B9e9A#code), with the following characteristics:
- _**testType = 50**_, meaning it is a mixed test where the multiple choice component accounts for 50% of the grade.
- _**nQuestions = 64**_, meaning the open answer component of this mixed test consists of 64 questions.
- _**minimumGrade = 1**_, so to obtain this credential we only need to get 1/100 on the test.
- _**credentialLimit = 0**_, there is no limit to the number of credentials that can be minted.
- _**timeLimit = 0**_, there is no limit in time to solve the test and obtain the credential.
- _**solvingHashes = [104. . .053, 102. . .551]**_, which represent the roots of the multiple choice answer tree and the open answer tree. These are the result of setting every multiple choice answer to *A* (which means, using a value of 1), and every open answer to *deenz*.
- _**requiredPass = 0x000. . .000**_, so there is no NFT holding requirement to obtain the test.
- _**credentialsGained = Test Credential**_
- _**testURI = https://twitter.com/0xdeenz**_

You can learn more about how the Test object is defined internally by referring to the [Block Qualified tests](../direct-interfacing/bq-tests/README.md) section.