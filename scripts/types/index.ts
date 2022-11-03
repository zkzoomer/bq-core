export type Stats = {
    testType: number,
    nQuestions: number,
    minimumGrade: number,
    solvers: number,
    credentialLimit: number,
    timeLimit: number,
    requiredPass: string,
    gasFund: BigInt,
    credentialsGained: string,
}

export type Grade = {
    grade: number,
    minimumGrade: number,
    pass: boolean,
    nQuestions: number,
    multipleChoiceGrade: number,
    openAnswerGrade: number,
    multipleChoiceWeight: number,
    openAnswerResults: boolean[],
}

export type SolutionProof = {
    a: string[2],
    b: string[2][2],
    c: string[2],
    input: string[]
}