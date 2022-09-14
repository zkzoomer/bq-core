const fs = require("fs");
const poseidon = require("./poseidon.js");
const poseidonMerkle = require('./poseidonMerkle.js');

const leafArray = Array.from({length: 64}, (_, i) => 4)
const salt = "50"

const len = 50
const correctAnswers = new Array(len).fill(poseidon([0]));
correctAnswers[0] = poseidon(['350'])
correctAnswers[1] = poseidon(['250'])

const userAnswers = new Array(len).fill(0)

const inputs = {
    multipleChoiceAnswers: leafArray,
    salt: salt,
    openAnswersHash: correctAnswers,
    openAnswers: userAnswers
}

fs.writeFileSync(
    "../proof/mixed_test/test_files/input.json",
    JSON.stringify(inputs, (key, value) => 
        typeof value === 'bigint'
            ? value.toString() 
            : value // return everything else unchanged
    ),
    "utf-8"
);