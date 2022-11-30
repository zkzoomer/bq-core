# Verifying a Proof

We can verify whether a solution is valid for an already defined _bqTest_ in solve mode (_solveModeTest_) by doing:

```js
await solveModeTest.verifySolutionProof( solutionProof )
```

Which will return true if the proof is valid, and false otherwise. 

**WARNING:** Note that this only means that the verifier (that is, the smart contract) will accept this proof. This does not necessarily grant the credential if, for example, the grade is below the minimum required. The smart contract will always revert if the proof is not valid, that is, if this method returns false.

// TODO: add examples