// Used for a rough benchmarking of bruteforcing a test

const poseidon = require("./utils/poseidon");
const {performance} = require('perf_hooks');

function pairwiseHash (array) {
    if (array.length % 2 == 0){
        const arrayHash = []
        for (var i = 0; i < array.length; i = i + 2){
            arrayHash.push(poseidon(
                [array[i],array[i+1]]
            ))
        }
        return arrayHash
    } else {
        console.log('array must have even number of elements')
    }
}

function rootFromLeafArray (leafArray) {
    const depth = Math.log(leafArray.length) / Math.log(2);
    const tree = Array(depth);
    tree[depth - 1] = pairwiseHash(leafArray)
    for (var j = depth - 2; j >= 0; j--){
        tree[j] = pairwiseHash(tree[j+1])
    }

    return tree[0][0]
}

var startTime = performance.now();

/* const solutionHash = "11481683124583515813354814618530642487850261435394873262432335458572739484820"; // EVM - 1 / 60M */
const solutionHash = "1419135518939604204422572184284210640446362562156245257070470995843683457046"; // BQ - 1 / 1M
/* const solutionHash = "21421076569454423951786178106172865284394479228713571836562922203730387353868"; // [6, 6, 0, 0, 0, ...] root */
const nQuestions = 10;
const maxQuestions = 64;
const nAnswers = 4;
const defaultAnswer = "0";

var answers = new Array(maxQuestions).fill(0)
for ( var i = 0; i < nQuestions; i++ ) {
    answers[i] = 1;
}
const nIterations = nAnswers ** nQuestions;

var i = 0;
while ( i < nIterations ) {
    if ( i % 1000 === 0 ) {
        console.log(`iteration #${i}`)
    }
    const root = rootFromLeafArray(answers);
    if (root.toString() === solutionHash) { break; }
    i++;

    var j = nQuestions - 1;
    while (j >= 0) {
        const current = answers[j];
        if ( current + 1 != nAnswers ) { 
            answers[j] = current + 1;
            break; 
        } else {
            answers[j] = 1
            j--;
        }
    }

}

console.log(i);

var endTime = performance.now();

console.log(`Brute forcing took ${(endTime - startTime)/1000} milliseconds`);