const { task } = require("hardhat/config")

task("create-test", "Creates a test")
  .addPositionalParam("testCreatorContract")
  .addPositionalParam("testType")
  .addPositionalParam("nQuestions")
  .addPositionalParam("minimumGrade")
  .addPositionalParam("credentialLimit")
  .addPositionalParam("timeLimit")
  .addPositionalParam("multipleChoiceRoot")
  .addPositionalParam("answerHashesRoot")
  .addPositionalParam("requiredPass")
  .addPositionalParam("credentialsGained")
  .addPositionalParam("testURI")
  .setAction(async (taskArgs) => {
    const testCreatorArtifact = artifacts.require('TestCreator')
    const testCreator = await testCreatorArtifact.at(taskArgs.testCreatorContract)
    
    const solvingHashes = [];
    if (taskArgs.multipleChoiceRoot !== '0') {
      solvingHashes.push(taskArgs.multipleChoiceRoot)
    }
    if (taskArgs.answerHashesRoot !== '0') {
      solvingHashes.push(taskArgs.answerHashesRoot)
    }

    const requiredPass = taskArgs.requiredPass !== '0' ? taskArgs.requiredPass : '0x0000000000000000000000000000000000000000'
    
    await testCreator.createTest(
      taskArgs.testType,
      taskArgs.nQuestions,
      taskArgs.minimumGrade,
      taskArgs.credentialLimit,
      taskArgs.timeLimit,
      solvingHashes,
      requiredPass,
      taskArgs.credentialsGained,
      taskArgs.testURI
    )

    const data = await testCreator.getTest('1')
    console.log(data)
  })
