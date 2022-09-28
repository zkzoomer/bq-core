const { ethers, artifacts } = require("hardhat");
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

contract('testCreator', function (accounts) {
    const name = "Block Qualified tests"
    const symbol = "BQT"
    const approveRevertMessage = "BQT: cannot approve tests"
    const transferRevertMessage = "BQT: cannot transfer tests"

    beforeEach(async function () {
        [account] = await ethers.getSigners();

        this.testCreator = await testCreator.new()
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