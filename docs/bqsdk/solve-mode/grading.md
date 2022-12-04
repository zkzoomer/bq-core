# Grading a Solution

First we need to define a new _bqTest_ object in solve mode by doing:

```js
const gradedSolution = solveModeTest.gradeSolution({
    openAnswers,
    multipleChoiceAnswers
})
```

Where:
- **_openAnswers_**: is an array containing the open answers for each of the questions. This value needs to be provided if the test being solved is either open answer or mixed, and left empty otherwise.
- **_multipleChoiceAnswers_**: is an array containing the answer choices (1 for A, 2 for B, ...) for each of the questions. This value needs to be provided if the test being solved is either multiple choice or mixed, and left empty otherwise.

Calling this method will return an object which will include the following values:

- **_grade_**: the resulting grade out of 100.
- **_minimumGrade_**: the minimum grade required to obtain this credential
- **_pass_**: Whether this solution would obtain this credential.
- **_nQuestions_**: the number of questions that define this test
- **_multipleChoiceGrade_**: the grade obtained in the multiple choice part of the test
- **_openAnswerGrade_**: the grade obtained in the opne answer part of the test
- **_multipleChoiceWeigh_**: the percentage the multiple choice component counts towards the final grade
- **_openAnswerResults_**: list containing the results for each of the answers, that is, whether they were correct or not.

When we call on the deployed contract on testnet:

```js
> console.log(
    solveModeTest.gradeSolution({
        openAnswers: new Array(64).fill("deenz"), 
        multipleChoiceAnswers: Array.from({length: 64}, (_, i) => 1)
    })
)
> {
    grade: 100,
    minimumGrade: 1,
    pass: true,
    nQuestions: 64,
    multipleChoiceGrade: 100,
    openAnswerGrade: 100,
    multipleChoiceWeight: 50,
    openAnswerResults: [
        true, true, true, true, true, true, true,
        true, true, true, true, true, true, true,
        true, true, true, true, true, true, true,
        true, true, true, true, true, true, true,
        true, true, true, true, true, true, true,
        true, true, true, true, true, true, true,
        true, true, true, true, true, true, true,
        true, true, true, true, true, true, true,
        true, true, true, true, true, true, true,
        true
    ]
}
```