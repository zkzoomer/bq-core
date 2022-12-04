const { bqTest } = require('./bqTest')
const { ethers } = require("hardhat")

const rpcUrl = 'https://rpc-mumbai.maticvigil.com'
const ethersProvider = new ethers.providers.JsonRpcProvider(rpcUrl)

async function main() {
    const readModeTest = await bqTest.readMode(
        1,
        ethersProvider,
        '0x403E6BBCB3Ddbe3487c09E8827e5dEf058FE6db4'
    )

    console.log(readModeTest.stats)

    console.log(readModeTest.isValid)

    console.log(readModeTest.URI)

    console.log(readModeTest.holdersNumber)

    const holders = await readModeTest.holdersList()
    console.log(holders)

    const holderOne = await readModeTest.holdsCredential('0x1B02c971d0322DB82170FB7950D45D26Efc5853B')
    console.log(holderOne)
    const holderTwo = await readModeTest.holdsCredential('0xd3a10e16851A160CC486A96Bf884F4d406f02Ffa')
    console.log(holderTwo)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })