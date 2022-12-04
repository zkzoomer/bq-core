# Generating the Proof for a Solution

We can grade a solution for an already defined _bqTest_ in solve mode (_solveModeTest_) by doing:

```js
const solutionProof = await solveModeTest.generateSolutionProof({ 
    recipient, 
    openAnswers, 
    multipleChoiceAnswers 
})
```
Where the values for _openAnswers_ and _multipleChoiceAnswers_ are as specified for [grading a solution](grading.md), and the _recipient_ is the address that would be receiving the credential NFT.

Calling this method will return a _proof_ object:

```js
> const solutionProof = await solveModeTest.generateSolutionProof({ 
    recipient = '0x1B02c971d0322DB82170FB7950D45D26Efc5853B', 
    openAnswers: new Array(64).fill("deenz"), 
    multipleChoiceAnswers: Array.from({length: 64}, (_, i) => 1)
})
>
> console.log(solutionProof)
> {
    a: [
        '5673833836592585982942796901846014778664013754791523307102412459908017327393',
        '20666511287951846969130299473018395146293214949126156370767188819890307628507'
    ],
    b: [
        [
            '2946985875815685687944787392891794439235075480602030015654913893408440644061',
            '11768077727474147224366683461069232074769268700740345930998592768853168572594'
        ],
        [
            '15108873303345268281390559537217805560764816821942115676772846938417241271092',
            '12027255309402519667768543958072792430265254655772962152857375202546491147870'
        ]
    ],
    c: [
            '1019745799089899547186644040094447740962313513472145953146138685568347983372'
    ],
    input: [
        '10483540708739576660440356112223782712680507694971046950485797346645134034053',
        '64',
        '10282115443811225193316982904069719962952397009781856710375312603370175331551',
        '154204900600760439539153201365215850075611563323'
    ],
    recipient: '0x1B02c971d0322DB82170FB7950D45D26Efc5853B'
}
```