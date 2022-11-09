const { ethers, artifacts } = require("hardhat");
const {
    shouldBehaveLikeERC721,
    shouldBehaveLikeERC721Metadata,
    shouldBehaveLikeERC721Enumerable,
} = require('./ERC721.behavior');
const { shouldBehaveLikeCredentials } = require('./Credentials.behavior')

const testCreator = artifacts.require('TestCreator')
const Credentials = artifacts.require('Credentials')

contract('Credentials', function (accounts) {
    const name = "Block Qualified Credentials"
    const symbol = "BQC"
    const approveRevertMessage = "BQC: cannot approve credentials"
    const transferRevertMessage = "BQC: cannot transfer credentials"

    beforeEach(async function () {
        [account] = await ethers.getSigners();

        this.testCreator = await testCreator.new()
        const _credentials = await this.testCreator.credentialsContract()
        /* this.credentials = (new ethers.Contract(_credentials, credentialsAbi)).deployed() */
        this.credentials = await Credentials.at(_credentials)

        this.token = this.credentials
    })

    shouldBehaveLikeERC721(approveRevertMessage, transferRevertMessage, ...accounts);
    shouldBehaveLikeERC721Metadata('ERC721', name, symbol, ...accounts);
    shouldBehaveLikeERC721Enumerable('ERC721', ...accounts)
    shouldBehaveLikeCredentials(...accounts)
})