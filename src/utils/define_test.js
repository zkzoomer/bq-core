const { rootFromLeafArray } = require("../../src/poseidon")

const correctMultipleChoiceAnswers = []
const correctOpenAnswers = []

console.log("solutionHash: ", rootFromLeafArray(getMultipleChoiceAnswersArray(correctMultipleChoiceAnswers)).toString())
console.log("answerHashesRoot: ", rootFromLeafArray(getOpenAnswersArray(correctOpenAnswers)).toString())

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
        resultsArray[i] = BigInt('0x' + keccak256(openAnswers[i]).toString('hex'))
    }})
    return resultsArray
}
