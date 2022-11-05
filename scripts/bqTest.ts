import { ethers } from 'ethers'

const keccak256 = require('keccak256')
const snarkjs = require("snarkjs");
const fs = require("fs");

import { rootFromLeafArray } from './utils/poseidonMerkle'
import { Grade, SolutionProof, Stats } from "./types";
import testCreatorAbi from './abi/TestCreator.json'
import credentialsAbi from './abi/Credentials.json'

const poseidon = require('./utils/poseidon')

export default class bqTest {
    private _testId: number
    private _isValid = true
    private _stats: Stats
    private _testURI: string

    // Test defining hashes
    private _multipleChoiceRoot: string
    private _openAnswersRoot: string
    private _openAnswersHashes: string[]

    // Deployed contracts
    private _testCreatorContract: ethers.Contract
    private _credentialContract: ethers.Contract

    constructor (
        testId: number,
        ethersProvider: ethers.providers.JsonRpcProvider,
        openAnswersHashes: string[] = null as any,
        testCreatorAddress: string,
        credentialsAddress: string
    ) {
        this._testId = testId

        this._openAnswersHashes = openAnswersHashes

        this._testCreatorContract = new ethers.Contract(testCreatorAddress, testCreatorAbi.abi, ethersProvider)
        this._credentialContract = new ethers.Contract(credentialsAddress, credentialsAbi.abi, ethersProvider)
    }

    /**
     * Initializes the test object by retrieving the necessary data from on-chain
     */
    async init() {
        this._stats = await this._testCreatorContract.getTest(this._testId)
        this._testURI = await this._testCreatorContract.tokenURI(this._testId)
        
        if ( this._stats.testType === 0 ) {  // open answers test
            this._openAnswersRoot = await this._testCreatorContract.getOpenAnswersRoot(this._testId)
            if ( !this._openAnswersHashes ) {
                // TODO - if this fails, test cannot be solved
                this._openAnswersHashes = await this._testCreatorContract.getOpenAnswersHashes(this._testId)
            }
        } else if ( this._stats.testType > 0 && this._stats.testType < 100 ) {  // mixed test
            this._multipleChoiceRoot = await this._testCreatorContract.getMultipleChoiceRoot(this._testId)
            this._openAnswersRoot = await this._testCreatorContract.getOpenAnswersRoot(this._testId)
            if ( !this._openAnswersHashes ) {
                // TODO - if this fails, test cannot be solved
                this._openAnswersHashes = await this._testCreatorContract.getOpenAnswersHashes(this._testId)
            }
        } else if ( this._stats.testType === 100 ) {  // multiple choice test
            this._multipleChoiceRoot = await this._testCreatorContract.getMultipleChoiceRoot(this._testId)
        } else {  // test was invalidated
            this._isValid = false
        }
    }

    /**
     * Returns the grade obtained for the given solution in this test 
     * @returns grade and correct answers obtained for the given solution.
     */
    gradeSolution( openAnswers: string[] = [], multipleChoiceAnswers: number[] = [] ): Grade {

        if ( this._stats.testType === 0 ) {  // open answers test
            // All answers must be provided - even if an empty ""
            if ( openAnswers.length !== this._stats.nQuestions ) { throw new RangeError('Some questions were left unanswered') }
            
            const { resultsArray, testResult } = getOpenAnswersResult(openAnswers)

            // Returning Grade object
            return {
                grade: testResult,
                minimumGrade: this._stats.minimumGrade,
                pass: testResult >= this._stats.minimumGrade,
                nQuestions: openAnswers.length,
                multipleChoiceGrade: 0,
                openAnswerGrade: testResult,
                multipleChoiceWeight: 0,
                openAnswerResults: resultsArray,
            }

        } else if ( this._stats.testType > 0 && this._stats.testType < 100 ) {  // mixed test
            // Multiple choice answers provided must be numbers and less than 64 in number
            if ( !(multipleChoiceAnswers as any[]).every(i => { return typeof i === 'number' }) ) { 
                throw new TypeError('Answers must be numbers representing the multiple choices') 
            }
            if ( multipleChoiceAnswers.length <= 64 ) { throw new RangeError('Surpassed maximum number of answers for a test') }
            // All open answers must be provided - even if an empty ""
            if ( openAnswers.length !== this._stats.nQuestions ) { throw new RangeError('Some questions were left unanswered') }

            // Open answer component
            const { nCorrect, resultsArray, testResult } = getOpenAnswersResult(openAnswers)
            // Multiple choice component
            const multipleChoiceResult = getMultipleChoiceAnswersResult(multipleChoiceAnswers)

            const result = multipleChoiceResult * this._stats.testType  // weighted contribution of the multiple choice part
                + 
                (
                (nCorrect + openAnswers.length > 64) ?
                    (nCorrect + openAnswers.length - 64) * (100 - this._stats.testType) / openAnswers.length
                :
                    0
                );
            return {
                grade: result,
                minimumGrade: this._stats.minimumGrade,
                pass: result >= this._stats.minimumGrade,
                nQuestions: openAnswers.length,
                multipleChoiceGrade: multipleChoiceResult,
                openAnswerGrade: testResult,
                multipleChoiceWeight: this._stats.testType,
                openAnswerResults: resultsArray,
            }

        } else if ( this._stats.testType === 100 ) {  // multiple choice test
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

        function getMultipleChoiceAnswersResult( multipleChoiceAnswers: number[] ): number {
            // Filling the array to 64 values
            const answersArray = new Array(64).fill(0)
            answersArray.forEach( (_, i) => { if ( i < multipleChoiceAnswers.length ) { 
                answersArray[i] = multipleChoiceAnswers[i] as number 
            }})
    
            // Checking if test is passed and returning the result
            return rootFromLeafArray(answersArray) === this._multipleChoiceRoot ? 100 : 0
        }

        function getOpenAnswersResult( openAnswers: string[] ): { nCorrect: number, resultsArray: boolean[], testResult: number } {
            let nCorrect = 0
            const resultsArray = new Array(openAnswers.length).fill(false)
            for (var i = 0; i < 64; i++) {
                if ( i < openAnswers.length ) {
                    if ( poseidon([BigInt('0x' + keccak256(openAnswers[i]).toString('hex'))]).toString() === this._openAnswersHashes[i] ) {
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
     * Returns the stats for this test, that is, the Test struct for this test
     * @returns Test struct.
     */
    get stats(): Stats {
        return this._stats
    }

    /**
     * Returns whether this test is solvable or not
     * @returns if test is valid.
     */
    get isValid(): boolean {
        return this._isValid
    }

    /**
     * Returns whether this test URI
     * @returns test URI.
     */
    get URI(): string {
        return this._testURI
    }

    /**
     * Returns the total number of holders for this credential 
     * @returns number of holders.
     */
    get holdersNumber(): number {
        return this._stats.solvers
    }

    /**
     * Returns the total number of holders for this credential 
     * @returns number of holders.
     */
    async holdersList(): Promise<string[]> {
        return this._credentialContract.credentialReceivers(this._testId)
    }

    /**
     * Returns if an address has solved this test and thus holds the credential
     * @returns test URI.
     */
    async holdsCredential(address: string): Promise<boolean> {
        const addy = ethers.utils.getAddress(address)
        const holders = await this.holdersList()

        return addy in holders
    }

}