const { ethers, artifacts } = require("hardhat");
const { poseidonContract } =  require("circomlibjs");
const {
    shouldBehaveLikeERC721,
    shouldBehaveLikeERC721Metadata,
    shouldBehaveLikeERC721Enumerable,
} = require('./ERC721.behavior');
const { shouldBehaveLiketestCreator } = require('./testCreator.behavior')

const testCreator = artifacts.require('TestCreator')
const Credentials = artifacts.require('Credentials')
const Valid = artifacts.require('Valid')
const Malicious = artifacts.require('Malicious')
let poseidon

contract('testCreator', function (accounts) {
    const name = "Block Qualified tests"
    const symbol = "BQT"
    const approveRevertMessage = "BQT: cannot approve tests"
    const transferRevertMessage = "BQT: cannot transfer tests"

    beforeEach(async function () {
        [account] = await ethers.getSigners();

        const P2 = new ethers.ContractFactory(
            poseidonContract.generateABI(2),
            poseidonContract.createCode(2),
            account
        )

        poseidon = await P2.deploy()
        this.testCreator = await testCreator.new(poseidon.address)
        const _credentials = await this.testCreator.credentialsContract()
        /* this.credentials = (new ethers.Contract(_credentials, credentialsAbi)).deployed() */
        this.credentials = await Credentials.at(_credentials)

        this.valid = await Valid.new('Valid', 'VALID')
        this.malicious = await Malicious.new()

        this.token = this.testCreator
    })

    shouldBehaveLikeERC721(approveRevertMessage, transferRevertMessage, ...accounts);
    shouldBehaveLikeERC721Metadata('ERC721', name, symbol, ...accounts);
    shouldBehaveLikeERC721Enumerable('ERC721', ...accounts)
    shouldBehaveLiketestCreator(...accounts)
})