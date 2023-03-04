const keccak256 = require('keccak256')
const { poseidon, rootFromLeafArray } = require("../../src/poseidon")

const correctMultipleChoiceAnswers = new Array(64).fill('1') 
const correctOpenAnswers = new Array(64).fill('deenz') 

console.log("multipleChoiceRoot: ", rootFromLeafArray(getMultipleChoiceAnswersArray(correctMultipleChoiceAnswers)).toString())
console.log("answerHashesRoot: ", rootFromLeafArray(getOpenAnswersArray(correctOpenAnswers)).toString())
console.log("answerHashes: ", getOpenAnswersArray(correctOpenAnswers))

function getMultipleChoiceAnswersArray( multipleChoiceAnswers ) {
    const answersArray = new Array(64).fill('0')
    answersArray.forEach( (_, i) => {
        if ( i < multipleChoiceAnswers.length ) { 
            if (Array.isArray(multipleChoiceAnswers[i])) {
                answersArray[i] = multipleChoiceAnswers[i].sort().join('')
            } else {
                answersArray[i] = multipleChoiceAnswers[i].toString()
            }
        }
    })
    return answersArray
}

function getOpenAnswersArray( openAnswers ) {
    const resultsArray = new Array(64).fill(
        BigInt('0x' + keccak256("").toString('hex'))
    )
    resultsArray.forEach( (_, i) => { if (i < openAnswers.length) {
        resultsArray[i] = poseidon([BigInt('0x' + keccak256(openAnswers[i]).toString('hex'))])
    }})
    return resultsArray
}
