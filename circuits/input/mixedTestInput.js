const fs = require("fs");
const poseidon = require("./poseidon.js");
const poseidonMerkle = require('./poseidonMerkle.js');

const leafArray = Array.from({length: 64}, (_, i) => 4)
const multipleChoiceSalt = "250"

const len = 50
const correctAnswers = new Array(len).fill(poseidon([0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470]));
correctAnswers[0] = poseidon(['350'])
correctAnswers[1] = poseidon(['250'])
const userAnswers = new Array(len).fill(0)
const openAnswersSalt = "150"

const inputs = {
    multipleChoiceAnswers: leafArray,
    multipleChoiceSalt: multipleChoiceSalt,
    openAnswersHash: correctAnswers,
    openAnswers: userAnswers,
    openAnswersSalt: openAnswersSalt
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