import { ethers } from 'ethers'
// @ts-ignore
import { groth16 } from "snarkjs";
import keccak256 from 'keccak256'

import { Grade, SolutionProof, Stats } from "./types/index";
import testCreatorAbi from '../artifacts/contracts/TestCreator.sol/TestCreator.json'
import credentialsAbi from '../artifacts/contracts/Credentials.sol/Credentials.json'
import { poseidon, rootFromLeafArray } from './utils/poseidon'

// Verification keys
import openVerificationKey from "../proof/open/open_verification_key.json"
import mixedVerificationKey from "../proof/mixed/mixed_verification_key.json"
import multipleVerificationKey from "../proof/multiple/multiple_verification_key.json"

export default class bqTest {
    #testId: number
    #isValid: boolean
    #solveMode: boolean
    #stats: Stats
    #testURI: string

    // Test defining hashes
    #multipleChoiceRoot = ""
    #openAnswersHashes: string[]

    // Deployed contracts
    #testCreatorContract: ethers.Contract
    #credentialContract: ethers.Contract

    /**
     * Initializes and returns a new bqTest object
     * @returns new bqTest object
     */
    private constructor ( 
        testId: number,
        isValid: boolean,
        solveMode: boolean,
        stats: Stats,
        testURI: string,
        testCreatorContract: ethers.Contract,
        credentialContract: ethers.Contract,
        multipleChoiceRoot: string = "",
        openAnswerHashes: string[] = [],
    ) {
        this.#testId = testId
        this.#isValid = isValid
        this.#solveMode = solveMode
        this.#stats = stats,
        this.#testURI = testURI,
        this.#testCreatorContract = testCreatorContract
        this.#credentialContract = credentialContract

        this.#testCreatorContract = testCreatorContract
        this.#credentialContract = credentialContract

        this.#multipleChoiceRoot = multipleChoiceRoot
        this.#openAnswersHashes = openAnswerHashes
    }

    /**
     * Initializes and returns a new bqTest object in reading mode, this is done by writing:
     * const test = await bqTest.readMode(params...)
     * @returns new bqTest object in readMode
     */
    static async readMode (
        testId: number,
        ethersProvider: ethers.providers.JsonRpcProvider,
        testCreatorAddress: string,
        credentialsAddress: string
    ) {
        const data = await bqTest.loadData(testId, ethersProvider, testCreatorAddress, credentialsAddress)

        return new bqTest(
            testId, 
            data.isValid, 
            false,
            data.stats, 
            data.testURI, 
            data.testCreatorContract, 
            data.credentialsContract,
        )
    }

    /**
     * Initializes and returns a new bqTest object in solving mode, this is done by writing:
     * const test = await bqTest.solveMode(params...)
     * @returns new bqTest object in solveMode
     */
    static async solveMode (
        testId: number,
        ethersProvider: ethers.providers.JsonRpcProvider,
        testCreatorAddress: string,
        credentialsAddress: string,
        openAnswersHashes: string[] = null as any,
    ) {
        const data = await bqTest.loadData(testId, ethersProvider, testCreatorAddress, credentialsAddress)

        var openAnswersRoot = ""
        var multipleChoiceRoot = ""

        if ( data.stats.testType < 100 ) {  // Test includes an open answer component
            if ( data.stats.testType === 0 ) {  // pure open answer test
                openAnswersRoot = await data.testCreatorContract.getOpenAnswersRoot(testId)
            } else if ( data.stats.testType > 0 && data.stats.testType < 100 ) {  // mixed test
                multipleChoiceRoot = await data.testCreatorContract.getMultipleChoiceRoot(testId)
                openAnswersRoot = await data.testCreatorContract.getOpenAnswersRoot(testId)
            }

            // Retrieving open answer hashes from on-chain if they were not provided
            if ( !openAnswersHashes ) {
                try {
                    openAnswersHashes = await data.testCreatorContract.getOpenAnswersHashes(testId)
                } catch (err) {
                    throw new Error('Test cannot be solved as it is missing the open answers hashes')
                }
            }

            // Verify that the open answer hashes are valid
            const fullOpenAnswerHashes = new Array(64).fill(
                poseidon([BigInt('0x' + keccak256("").toString('hex'))]).toString()
            )
            fullOpenAnswerHashes.forEach( (_, i) => { if (i < openAnswersHashes.length) {
                fullOpenAnswerHashes[i] = openAnswersHashes[i]
            }})
            if ( rootFromLeafArray(fullOpenAnswerHashes).toString() !== openAnswersRoot.toString() ) {
                throw new Error('Test cannot be solved because the open answer hashes are invalid')
            }

        } else if ( data.stats.testType === 100 ) {  // multiple choice test
            multipleChoiceRoot = await data.testCreatorContract.getMultipleChoiceRoot(testId)
        }

        return new bqTest(
            testId, 
            data.isValid, 
            false,
            data.stats, 
            data.testURI, 
            data.testCreatorContract, 
            data.credentialsContract,
            multipleChoiceRoot,
            openAnswersHashes
        )
    }

    /**
     * Loads and returns the data that is needed for both reading mode and solving mode test objects
     * @returns data needed to initialize test objects
     */
    private static async loadData(
        testId: number,
        ethersProvider: ethers.providers.JsonRpcProvider,
        testCreatorAddress: string,
        credentialsAddress: string,
    ) {
        const testCreatorContract = new ethers.Contract(testCreatorAddress, testCreatorAbi.abi, ethersProvider)
        const credentialsContract = new ethers.Contract(credentialsAddress, credentialsAbi.abi, ethersProvider)
        const stats = await testCreatorContract.getTest(testId)
        const testURI = await testCreatorContract.tokenURI(testId)
        const isValid = stats.testType === 255
        
        return {
            isValid,
            stats,
            testURI,
            testCreatorContract,
            credentialsContract
        }
    }

    
    /**
     * Returns the grade obtained for the given solution in this test 
     * @returns grade and correct answers obtained for the given solution.
     */
    gradeSolution( openAnswers: string[] = [], multipleChoiceAnswers: number[] = [] ): Grade {
        if ( !this.#solveMode ) {
            throw new Error('Test cannot be solved as it was not initialized in solveMode')
        }

        const getMultipleChoiceAnswersResult = ( multipleChoiceAnswers: number[] ): number => {
            // Filling the array to 64 values
            const answersArray = new Array(64).fill(0)
            answersArray.forEach( (_, i) => { if ( i < multipleChoiceAnswers.length ) { 
                answersArray[i] = multipleChoiceAnswers[i] as number 
            }})
    
            // Checking if test is passed and returning the result
            return rootFromLeafArray(answersArray) === this.#multipleChoiceRoot ? 100 : 0
        }

        const getOpenAnswersResult = ( openAnswers: string[] ): { nCorrect: number, resultsArray: boolean[], testResult: number } => {
            let nCorrect = 0
            const resultsArray = new Array(openAnswers.length).fill(false)
            for (var i = 0; i < 64; i++) {
                if ( i < openAnswers.length ) {
                    if ( poseidon([BigInt('0x' + keccak256(openAnswers[i]).toString('hex'))]).toString() === this.#openAnswersHashes[i] ) {
                        // Correct answer only if hash matches
                        nCorrect++
                        resultsArray[i] = true
                    }
                } else {
                    nCorrect++  // Default hash is always correct, simply filling to 64
                }
            }

            const testResult = (nCorrect + openAnswers.length > 64) ?  // prevent underflow
                100 * (nCorrect + openAnswers.length - 64) / openAnswers.length
            :
                0;

            return {
                nCorrect,
                resultsArray,
                testResult
            }
        }

        if ( this.#stats.testType === 0 ) {  // open answers test
            // All answers must be provided - even if an empty ""
            if ( openAnswers.length !== this.#stats.nQuestions ) { throw new RangeError('Some questions were left unanswered') }
            
            const { resultsArray, testResult } = getOpenAnswersResult(openAnswers)

            // Returning Grade object
            return {
                grade: testResult,
                minimumGrade: this.#stats.minimumGrade,
                pass: testResult >= this.#stats.minimumGrade,
                nQuestions: openAnswers.length,
                multipleChoiceGrade: 0,
                openAnswerGrade: testResult,
                multipleChoiceWeight: 0,
                openAnswerResults: resultsArray,
            }

        } else if ( this.#stats.testType > 0 && this.#stats.testType < 100 ) {  // mixed test
            // Multiple choice answers provided must be numbers and less than 64 in number
            if ( !(multipleChoiceAnswers as any[]).every(i => { return typeof i === 'number' }) ) { 
                throw new TypeError('Answers must be numbers representing the multiple choices') 
            }
            if ( multipleChoiceAnswers.length <= 64 ) { throw new RangeError('Surpassed maximum number of answers for a test') }
            // All open answers must be provided - even if an empty ""
            if ( openAnswers.length !== this.#stats.nQuestions ) { throw new RangeError('Some questions were left unanswered') }

            // Open answer component
            const { nCorrect, resultsArray, testResult } = getOpenAnswersResult(openAnswers)
            // Multiple choice component
            const multipleChoiceResult = getMultipleChoiceAnswersResult(multipleChoiceAnswers)

            const result = multipleChoiceResult * this.#stats.testType  // weighted contribution of the multiple choice part
                + 
                (
                (nCorrect + openAnswers.length > 64) ?
                    (nCorrect + openAnswers.length - 64) * (100 - this.#stats.testType) / openAnswers.length
                :
                    0
                );
            return {
                grade: result,
                minimumGrade: this.#stats.minimumGrade,
                pass: result >= this.#stats.minimumGrade,
                nQuestions: openAnswers.length,
                multipleChoiceGrade: multipleChoiceResult,
                openAnswerGrade: testResult,
                multipleChoiceWeight: this.#stats.testType,
                openAnswerResults: resultsArray,
            }

        } else if ( this.#stats.testType === 100 ) {  // multiple choice test
            // Answers provided must be numbers and less than 64 in number
            if ( !(multipleChoiceAnswers as any[]).every(i => { return typeof i === 'number' }) ) { 
                throw new TypeError('Answers must be numbers representing the multiple choices') 
            }
            if ( multipleChoiceAnswers.length <= 64 ) { throw new RangeError('Surpassed maximum number of answers for a test') }
            
            // Returning the grade object
            const result = getMultipleChoiceAnswersResult(multipleChoiceAnswers)
            return {
                grade: result,
                minimumGrade: 100,
                pass: result === 100,
                nQuestions: multipleChoiceAnswers.length,
                multipleChoiceGrade: result,
                openAnswerGrade: 0,
                multipleChoiceWeight: 100,
                openAnswerResults: [],
            }
        } else {  // test was invalidated
            throw new Error('Test is invalidated and cannot be solved')
        }

    }

    /**
     * Returns the grade obtained for the given solution in this test 
     * @returns zk proof of the solution.
     */
    async generateSolutionProof( 
        recipient: string, 
        openAnswers: string[] = [], 
        multipleChoiceAnswers: number[] = [] 
    ): Promise<SolutionProof> {
        if ( !ethers.utils.isAddress(recipient) ) {
            throw new TypeError('Address given for the recipient is not valid')
        }
        if ( !this.#solveMode ) {
            throw new Error('Test cannot be solved as it was not initialized in solveMode')
        }

        const credentialBalance = (await this.#credentialContract.balanceOf(recipient)).toString()
        const salt = BigInt(ethers.utils.solidityKeccak256(['address', 'uint256'], [recipient, credentialBalance])).toString()

        if ( this.#stats.testType === 0 ) {  // open answers test
            // All answers must be provided - even if an empty ""
            if ( openAnswers.length !== this.#stats.nQuestions ) { throw new RangeError('Some questions were left unanswered') }

            // Generating proof and public signals
            const { proof, publicSignals } = await groth16.fullProve(
                {
                    answersHash: this.#openAnswersHashes, 
                    answers: getOpenAnswersArray(openAnswers),
                    salt
                }, 
                "../proof/open/open.wasm", 
                "../proof/open/open.zkey"
            );

            return {
                a: [proof.pi_a[0].toString(), proof.pi_a[1].toString()],
                b: [
                    [proof.pi_b[0][0].toString(), proof.pi_b[0][1].toString()], 
                    [proof.pi_b[1][0].toString(), proof.pi_b[1][1].toString()]
                ],
                c: [proof.pi_c[0].toString(), proof.pi_c[1].toString()],
                input: publicSignals,
                recipient
            }

        } else if ( this.#stats.testType > 0 && this.#stats.testType < 100 ) {  // mixed test
            // Multiple choice answers provided must be numbers and less than 64 in number
            if ( !(multipleChoiceAnswers as any[]).every(i => { return typeof i === 'number' }) ) { 
                throw new TypeError('Answers must be numbers representing the multiple choices') 
            }
            if ( multipleChoiceAnswers.length <= 64 ) { throw new RangeError('Surpassed maximum number of answers for a test') }
            // All open answers must be provided - even if an empty ""
            if ( openAnswers.length !== this.#stats.nQuestions ) { throw new RangeError('Some questions were left unanswered') }

            const { proof, publicSignals } = await groth16.fullProve(
                {   
                    multipleChoiceAnswers: getMultipleChoiceAnswersArray(multipleChoiceAnswers),
                    openAnswersHash: this.#openAnswersHashes, 
                    openAnswers: getOpenAnswersArray(openAnswers),
                    salt
                }, 
                "../proof/mixed/mixed_test.wasm", 
                "../proof/mixed/mixed.zkey"
            );

            return {
                a: [proof.pi_a[0].toString(), proof.pi_a[1].toString()],
                b: [
                    [proof.pi_b[0][0].toString(), proof.pi_b[0][1].toString()], 
                    [proof.pi_b[1][0].toString(), proof.pi_b[1][1].toString()]
                ],
                c: [proof.pi_c[0].toString(), proof.pi_c[1].toString()],
                input: publicSignals,
                recipient
            }

        } else if ( this.#stats.testType === 100 ) {  // multiple choice test
            // Answers provided must be numbers and less than 64 in number
            if ( !(multipleChoiceAnswers as any[]).every(i => { return typeof i === 'number' }) ) { 
                throw new TypeError('Answers must be numbers representing the multiple choices') 
            }
            if ( multipleChoiceAnswers.length <= 64 ) { throw new RangeError('Surpassed maximum number of answers for a test') }
            
            // Generating proof and public signals
            const { proof, publicSignals } = await groth16.fullProve(
                {
                    answers: getMultipleChoiceAnswersArray(multipleChoiceAnswers),  
                    salt
                }, 
                "../proof/multiple/multiple.wasm", 
                "../proof/multiple/multiple.zkey"
            );

            return {
                a: [proof.pi_a[0].toString(), proof.pi_a[1].toString()],
                b: [
                    [proof.pi_b[0][0].toString(), proof.pi_b[0][1].toString()], 
                    [proof.pi_b[1][0].toString(), proof.pi_b[1][1].toString()]
                ],
                c: [proof.pi_c[0].toString(), proof.pi_c[1].toString()],
                input: publicSignals,
                recipient
            }

        } else {  // test was invalidated
            throw new Error('Test is invalidated and cannot be solved')
        }
        
        function getMultipleChoiceAnswersArray(multipleChoiceAnswers: number[]): number[] {
            const answersArray = new Array(64).fill(0)
            answersArray.forEach( (_, i) => { if ( i < multipleChoiceAnswers.length ) { 
                answersArray[i] = multipleChoiceAnswers[i] as number 
            }})
            return answersArray
        }

        function getOpenAnswersArray( openAnswers: string[] ): string[] {
            const resultsArray = new Array(64).fill(
                poseidon([BigInt('0x' + keccak256("").toString('hex'))]).toString()
            )
            resultsArray.forEach( (_, i) => { if (i < openAnswers.length) {resultsArray[i] = openAnswers[i]} })
            return resultsArray
        }
    }

    /**
     * Verifies that the solution proof given will be accepted by the smart contract
     * @returns if the zk proof of the solution is valid.
     */
    async verifySolutionProof(proof: SolutionProof): Promise<boolean> {
        if ( !this.#solveMode ) {
            throw new Error('Test cannot be solved as it was not initialized in solveMode')
        }

        let vkey
        if ( this.#stats.testType === 0 ) { 
            vkey = openVerificationKey
        } else if ( this.#stats.testType > 0 && this.#stats.testType < 100 ) {
            vkey = mixedVerificationKey
        } else if ( this.#stats.testType === 100 ) {
            vkey = multipleVerificationKey
        } else {
            throw new Error('Test is invalidated and cannot be solved')
        }

        return groth16.verify(
            vkey,
            proof.input,
            proofToSnarkjs(proof.a, proof.b, proof.c)
        )

        function proofToSnarkjs(
            a: [string, string],
            b: [[string, string], [string, string]], 
            c: [string, string]
        ) {
            return {
                pi_a: [
                    a[0], a[1], '1'
                ],
                pi_b: [
                    [b[0][0], b[0][1]],
                    [b[1][0], b[1][1]],
                    ['1', '0']
                ],
                pi_c: [
                    c[0], c[1], '1'
                ],
                protocol: 'groth16',
                curve: 'bn128'
            }
        }
    }

    /**
     * Generates the transaction object to be signed with the given solution attempt
     * @returns the solving transaction object to be signed
     */
    generateSolutionTransaction(proof: SolutionProof): Promise<ethers.UnsignedTransaction> {
        if ( !this.#solveMode ) {
            throw new Error('Test cannot be solved as it was not initialized in solveMode')
        }
        
        return this.#testCreatorContract.populateTransaction.solveTest(
            this.#testId,
            proof.recipient,
            proof.a,
            [[proof.b[0][1], proof.b[0][0]], [proof.b[1][1], proof.b[1][0]]],  // Order changes on the verifier smart contract
            proof.c,
            proof.input.slice(0, -1)  // salt is computed at smart contract level using the specified recipient
        )
    }

    /**
     * Returns the stats for this test, that is, the Test struct for this test
     * @returns Test struct.
     */
    get stats(): Stats {
        return this.#stats
    }

    /**
     * Returns whether this test is solvable or not
     * @returns if test is valid.
     */
    get isValid(): boolean {
        return this.#isValid
    }

    /**
     * Returns whether this test URI
     * @returns test URI.
     */
    get URI(): string {
        return this.#testURI
    }

    /**
     * Returns the total number of holders for this credential 
     * @returns number of holders.
     */
    get holdersNumber(): number {
        return this.#stats.solvers
    }

    /**
     * Returns the total number of holders for this credential 
     * @returns number of holders.
     */
    async holdersList(): Promise<string[]> {
        return this.#credentialContract.credentialReceivers(this.#testId)
    }

    /**
     * Returns if an address has solved this test and thus holds the credential
     * @returns test URI.
     */
    async holdsCredential(address: string): Promise<boolean> {
        const addy = ethers.utils.getAddress(address)
        const holders = this.holdersList()

        return addy in holders
    }

}