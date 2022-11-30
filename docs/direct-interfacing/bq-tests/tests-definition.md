# How Tests Work

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

The Merkle trees specified above are all constructed using the SNARK-friendly [Poseidon](https://www.poseidon-hash.info/) hashing function,. An implementation is provided on [poseidon.js](../../../src/poseidon.js).

Remember that mixed tests are a combination of both, and include both types of solving as described into a single proof.