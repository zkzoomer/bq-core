import { Grade, SolutionProof, Stats } from "./types";

export default class bqTest {
    private _testId: number
    private _isValid: boolean
    private _stats: Stats
    private _testURI: string

    // Test defining hashes
    private _multipleChoiceRoot: string
    private _openAnswersRoot: string
    private _openAnswersHashes: string[]

    constructor(
        testId: number,
        verifyExistence = false,
        openAnswersHashes: string[] = null as any,
    ) {
        if ( verifyExistence ) {
            // Revert if test does not exist, user can assume they do when creating a new object

        }
        
    }

    /**
     * Returns the stats for this test, that is, the Test struct for this test
     * @returns Test struct.
     */
    get test(): Stats {
        if ( !this._stats ) { this._storeTest() }
        return null as unknown as Stats
    }

    /**
     * Returns whether this test is solvable or not
     * @returns if test is valid.
     */
     get isValid(): boolean {
        if ( !this._isValid ) { this._storeIsValid() }
        return this._isValid
    }

    /**
     * Returns whether this test URI
     * @returns test URI.
     */
    get URI(): string {
        if ( !this._testURI ) { this._storeTestURI() }
        return this._testURI
    }

    /**
     * Returns the total number of holders for this credential 
     * @returns number of holders.
     */
    get holdersNumber(): number {
        if ( !this._stats ) { this._storeTest() }
        return this._stats.solvers
    }

    /**
     * Returns the total number of holders for this credential 
     * @returns number of holders.
     */
    get holdersList(): string[] {
        // TODO
        return [""]
    }

    /**
     * Returns if an address has solved this test and thus holds the credential
     * @returns test URI.
     */
    holdsCredential(address: string): boolean {
        // TODO
        return true
    }

    /**
     * Returns the grade obtained for the given solution in this test 
     * @returns grade and correct answers obtained for the given solution.
     */
    gradeSolution(answers: string[]): Grade {
        // First gets the necessary hashes if they have not been retrieved yet
        // Reverts if the open answer hashes are not available now
        // TODO
        return null as unknown as Grade
    }

    /**
     * Returns the grade obtained for the given solution in this test 
     * @returns zk proof of the solution.
     */
    generateSolutionProof(answers: string[]): SolutionProof {
        // TODO
        return null as unknown as SolutionProof
    }

    /**
     * Verifies that the solution proof given will be accepted by the smart contract
     * @returns if the zk proof of the solution is valid.
     */
    verifySolutionProof(proof: SolutionProof): boolean {
        // TODO
        return true
    }

    /**
     * Generates the transaction object to be signed with the given solution attempt
     * @returns the solving transaction object to be signed
     */
    generateSolutionTransaction(proof: SolutionProof): any {
        // TODO
        return null
    }

    /**
     * Stores the Test struct as a class attribute
     */
    private _storeIsValid() {
        // TODO
        this._isValid = true
    }

    /**
     * Stores the test URI as a class attribute
     */
    private _storeTestURI() {
        // TODO
        this._testURI = "filler"
    }

    /**
     * Stores the Test struct as a class attribute
     */
    private _storeTest() {
        
    }
}