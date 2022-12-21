# How to Write a Test

The *_testURI_* is an external resource that holds more information about the test, like the questions it comprises. The credential issuer can choose to define this however they see fit.

We recommend this resource points to a JSON file that contains the test questions under the `test` key, which in itself is another object with the following structure:

```
{
    ...
    "test": {
        "1": {
            "question": "MULTIPLE_CHOICE_QUESTION_TEXT",
            "answers": {
                "1": "MULTIPLE_CHOICE_ANSWER_ONE_TEXT",
                "2": "MULTIPLE_CHOICE_ANSWER_TWO_TEXT",
                ...
            }
        },
        "2": {
            "question": "OPEN_ANSWER_QUESTION_TEXT",
        },
        ...
    }
    ...
}
```

The structure is therefore different for multiple choice and open answer questions: only the multiple choice questions must define the possible answers to the question. If the test is mixed, we recommend the multiple choice questions to go before the open answer questions.

You can choose to define in the other fields of this JSON file things like: test author, test description, external links...