const { ethers, artifacts } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners()

    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());

    const TestCreator = artifacts.require('TestCreator')
    const testCreator = await TestCreator.new()

    console.log("Deployed TesterCreator contract at: ", testCreator.address)
    // 0x403E6BBCB3Ddbe3487c09E8827e5dEf058FE6db4

    const credentials = await testCreator.credentialsContract()
    console.log("TesterCreator deployed Credentials contract at: ", credentials)
    // 0x1B54cCe0f362fF29696c710Fa86B9Add98164C88

    const verifier = await testCreator.verifierContract()
    console.log("TesterCreator deployed Credentials contract at: ", verifier)
    // 0xE6cd4a671d06D91E71c77173F85E3C043EE74DCF
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
});