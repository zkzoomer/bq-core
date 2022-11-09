import { ethers } from 'ethers'

const keccak256 = require('keccak256')
const snarkjs = require("snarkjs");
const random = require('random-bigint')
const fs = require("fs");

import { rootFromLeafArray } from './utils/poseidonMerkle'
import { Grade, SolutionProof, Stats } from "./types";
import testCreatorAbi from '../artifacts/contracts/TestCreator.sol/TestCreator.json'
import credentialsAbi from '../artifacts/contracts/Credentials.sol/Credentials.json'

const poseidon = require('./utils/poseidon')

export default class bqTest {
    private _testId: number
    private _isValid = true
    private _stats: Stats
    private _testURI: string

    // Test defining hashes
    private _multipleChoiceRoot = ""
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
        this._stats = this._testCreatorContract.getTest(this._testId)
        this._testURI = this._testCreatorContract.tokenURI(this._testId)
        var openAnswersRoot = ""
        
        if ( this._stats.testType === 0 ) {  // open answers test
            openAnswersRoot = this._testCreatorContract.getOpenAnswersRoot(this._testId)
            if ( !this._openAnswersHashes ) {
                try {
                    this._openAnswersHashes = this._testCreatorContract.getOpenAnswersHashes(this._testId)
                } catch (err) {
                    throw new Error('Test cannot be solved as it misses the open answers hashes')
                }
            }
        } else if ( this._stats.testType > 0 && this._stats.testType < 100 ) {  // mixed test
            this._multipleChoiceRoot = this._testCreatorContract.getMultipleChoiceRoot(this._testId)
            openAnswersRoot = this._testCreatorContract.getOpenAnswersRoot(this._testId)
            if ( !this._openAnswersHashes ) {
                try {
                    this._openAnswersHashes = this._testCreatorContract.getOpenAnswersHashes(this._testId)
                } catch (err) {
                    throw new Error('Test cannot be solved as it misses the open answers hashes')
                }
            }
        } else if ( this._stats.testType === 100 ) {  // multiple choice test
            this._multipleChoiceRoot = this._testCreatorContract.getMultipleChoiceRoot(this._testId)
        } else {  // test was invalidated
            this._isValid = false
        }

        // Verify that the open answer hashes provided are valid
        const openAnswerHashes = new Array(64).fill(
            poseidon([BigInt('0x' + keccak256("").toString('hex'))]).toString()
        )
        openAnswerHashes.forEach( (_, i) => { if (i < this._openAnswersHashes.length) {
            openAnswerHashes[i] = this._openAnswersHashes[i]
        }})
        if ( rootFromLeafArray(openAnswerHashes).toString() !== openAnswersRoot.toString() ) {
            throw new Error('Test cannot be solved because the open answer hashes are invalid')
        }
    }

    /**
     * Returns the grade obtained for the given solution in this test 
     * @returns grade and correct answers obtained for the given solution.
     */
    gradeSolution( openAnswers: string[] = [], multipleChoiceAnswers: number[] = [] ): Grade {

        const getMultipleChoiceAnswersResult = ( multipleChoiceAnswers: number[] ): number => {
            // Filling the array to 64 values
            const answersArray = new Array(64).fill(0)
            answersArray.forEach( (_, i) => { if ( i < multipleChoiceAnswers.length ) { 
                answersArray[i] = multipleChoiceAnswers[i] as number 
            }})
    
            // Checking if test is passed and returning the result
            return rootFromLeafArray(answersArray) === this._multipleChoiceRoot ? 100 : 0
        }

        const getOpenAnswersResult = ( openAnswers: string[] ): { nCorrect: number, resultsArray: boolean[], testResult: number } => {
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

    }

    /**
     * Returns the grade obtained for the given solution in this test 
     * @returns zk proof of the solution.
     */
    async generateSolutionProof( openAnswers: string[] = [], multipleChoiceAnswers: number[] = [] ): Promise<SolutionProof> {
        if ( this._stats.testType === 0 ) {  // open answers test
            // All answers must be provided - even if an empty ""
            if ( openAnswers.length !== this._stats.nQuestions ) { throw new RangeError('Some questions were left unanswered') }

            // Generating proof and public signals
            const { proof, publicSignals } = snarkjs.groth16.fullProve(
                {
                    answersHash: this._openAnswersHashes, 
                    answers: getOpenAnswersArray(openAnswers),
                    salt: random(256).toString() 
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
                input: publicSignals
            }

        } else if ( this._stats.testType > 0 && this._stats.testType < 100 ) {  // mixed test
            // Multiple choice answers provided must be numbers and less than 64 in number
            if ( !(multipleChoiceAnswers as any[]).every(i => { return typeof i === 'number' }) ) { 
                throw new TypeError('Answers must be numbers representing the multiple choices') 
            }
            if ( multipleChoiceAnswers.length <= 64 ) { throw new RangeError('Surpassed maximum number of answers for a test') }
            // All open answers must be provided - even if an empty ""
            if ( openAnswers.length !== this._stats.nQuestions ) { throw new RangeError('Some questions were left unanswered') }

            const { proof, publicSignals } = snarkjs.groth16.fullProve(
                {   
                    multipleChoiceAnswers: getMultipleChoiceAnswersArray(multipleChoiceAnswers),
                    multipleChoiceSalt: random(256).toString() ,
                    openAnswersHash: this._openAnswersHashes, 
                    openAnswers: getOpenAnswersArray(openAnswers),
                    openAnswersSalt: random(256).toString()   
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
                input: publicSignals
            }

        } else if ( this._stats.testType === 100 ) {  // multiple choice test
            // Answers provided must be numbers and less than 64 in number
            if ( !(multipleChoiceAnswers as any[]).every(i => { return typeof i === 'number' }) ) { 
                throw new TypeError('Answers must be numbers representing the multiple choices') 
            }
            if ( multipleChoiceAnswers.length <= 64 ) { throw new RangeError('Surpassed maximum number of answers for a test') }
            
            // Generating proof and public signals
            const { proof, publicSignals } = snarkjs.groth16.fullProve(
                {
                    answers: getMultipleChoiceAnswersArray(multipleChoiceAnswers),  
                    salt: random(256).toString()
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
                input: publicSignals
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
        let vkey
        if ( this._stats.testType === 0 ) { 
            vkey = require("../proof/open/open_verification_key.json")
        } else if ( this._stats.testType > 0 && this._stats.testType < 100 ) {
            vkey = require("../proof/mixed/mixed_verification_key.json")
        } else if ( this._stats.testType === 100 ) {
            vkey = require("../proof/multiple/multiple_verification_key.json")
        } else {
            throw new Error('Test is invalidated and cannot be solved')
        }

        return snarkjs.groth16.verify(
            vkey,
            proof.input,
            proofToSnarkjs(proof.a, proof.b, proof.c)
        )

        function proofToSnarkjs(a, b, c) {
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
        return this._testCreatorContract.populateTransaction.solveTest(
            this._testId,
            proof.a,
            [[proof.b[0][1], proof.b[0][0]], [proof.b[1][1], proof.b[1][0]]],  // Order changes on the verifier smart contract
            proof.c,
            proof.input
        )
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
        const holders = this.holdersList()

        return addy in holders
    }

}