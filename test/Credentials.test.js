/* const { ethers, artifacts } = require("hardhat");

const generateProofs = require('./helpers/generateProofs')
const { shouldBehaveLikeCredentials } = require("./Credentials.behavior")
const {
    shouldBehaveLikeERC721,
    shouldBehaveLikeERC721Metadata,
    shouldBehaveLikeERC721Enumerable,
} = require('./ERC721.behavior')

const testCreator = artifacts.require('TestCreator')
const Credentials = artifacts.require('Credentials')

contract('Credentials', function (accounts) {
    const name = "Block Qualified Credentials"
    const symbol = "BQC"
    const approveRevertMessage = "BQC: cannot approve credentials"
    const transferRevertMessage = "BQC: cannot transfer credentials"

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

        this.token = this.credentials
    })

    shouldBehaveLikeERC721(approveRevertMessage, transferRevertMessage, ...accounts);
    shouldBehaveLikeERC721Metadata('ERC721', name, symbol, ...accounts);
    shouldBehaveLikeERC721Enumerable('ERC721', ...accounts)
    shouldBehaveLikeCredentials(...accounts)
}) */