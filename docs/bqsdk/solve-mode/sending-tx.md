# Sending a Solution Transaction

Generating a solving proof for an already defined _bqTest_ in solve mode (_solveModeTest_) proves that you know a _certain_ solution. You will need the smart contract to verify whether this solution is valid, and grant you the credential if so. You can send a solution transaction by doing: 

```js
await solveModeTest.sendSolutionTransaction( 
    signer,
    proof
)
```

Where _proof_ is the result of [generating a proof](generating-proof.md), and _signer_ is a valid [ethers.Signer](https://docs.ethers.io/v5/api/signer/), which corresponds to the account that will send the solving transaction.

Note that the account that sends the solving transaction is not necessarily the account that _receives_ the credential. The recipient of the credential, also known as the _solver_, is embedded in the proof itself. This means that anyone can post someone else's proof without risk of cheating, allowing for transaction relaying to be built on top.

// TODO: add examples