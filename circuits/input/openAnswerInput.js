const fs = require("fs");
const poseidon = require("./poseidon.js");
const poseidonMerkle = require('./poseidonMerkle.js');

const len = 50
const correctAnswers = new Array(len).fill(poseidon([0]));
correctAnswers[0] = poseidon(['350'])
correctAnswers[1] = poseidon(['250'])

const userAnswers = new Array(len).fill(0)

const inputs = {
    answersHash: correctAnswers,
    answers: userAnswers
}

fs.writeFileSync(
    "../proof/open_answer_test/test_files/input.json",
    JSON.stringify(inputs, (key, value) => 
        typeof value === 'bigint'
            ? value.toString() 
            : value // return everything else unchanged
    ),
    "utf-8"
);