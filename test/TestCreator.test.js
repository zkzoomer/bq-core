const { ethers, artifacts } = require("hardhat");

const generateProofs = require('./helpers/generateProofs')
const {
    shouldBehaveLikeERC721,
    shouldBehaveLikeERC721Metadata,
    shouldBehaveLikeERC721Enumerable,
} = require('./ERC721.behavior');

const testCreator = artifacts.require('TestCreator')
const Credentials = artifacts.require('Credentials')
const Valid = artifacts.require('Valid')
const Malicious = artifacts.require('Malicious')

contract('testCreator', function (accounts) {
    const name = "Block Qualified Tests"
    const symbol = "BQT"
    const approveRevertMessage = "BQT: cannot approve tests"
    const transferRevertMessage = "BQT: cannot transfer tests"

    // Generating all the necessary proofs. Tx need to be solved after generating each, as generating proofs using bqTest
    // will look at the credential balance for the recipient to generate the solving salt.
    before(async function () {
        [_1, _2, solverSigner, altSolverSigner] = await ethers.getSigners();

        const testContract = await testCreator.new()

        this.proofs = await generateProofs(testContract, ethers.provider, solverSigner, altSolverSigner)
    })

    beforeEach(async function () {
        this.testCreator = await testCreator.new()
        const credentialsAddress = await this.testCreator.credentialsContract()
        this.credentials = await Credentials.at(credentialsAddress)

        this.valid = await Valid.new('Valid', 'VALID')
        this.malicious = await Malicious.new()

        this.token = this.credentials
    })

    shouldBehaveLikeERC721(approveRevertMessage, transferRevertMessage, ...accounts);
    shouldBehaveLikeERC721Metadata('ERC721', name, symbol, ...accounts);
    shouldBehaveLikeERC721Enumerable('ERC721', ...accounts)
    /* shouldBehaveLikeTestCreator(...accounts) */
})