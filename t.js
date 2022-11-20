const { ethers } = require('ethers')

const recipient = 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
console.log(recipient.toString())
console.log(ethers.utils.isAddress(recipient.toString()))