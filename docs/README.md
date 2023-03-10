# Block Qualified Documentation

This document aims to be a comprehensive guide to the [bq-core](https://github.com/0xdeenz/bq-core) repository.

## Installing Block Qualified

You can add bq-core to your project by running:

```
npm i https://github.com/0xdeenz/bq-core.git  
```

or

```
yarn add bq-core@https://github.com/0xdeenz/bq-core.git
```

## What is Block Qualified?

Block Qualified aims to become an open education platform where users can create their own learning experience. Anyone can gain credentials that attest to their knowledge, or verify the qualifications of others. All of this being done directly on-chain, with verifiable data, and preserving the privacy of users via zk proofs.

Users can define their own on-chain exams where they evaluate some kind of knowledge. Anyone can come in an attempt to solve this test: if they do so, they prove that they have the necessary knowledge. We call the creator of the test the _credential issuer_, while _solvers_ are the ones gaining the credentials.

Exams and credentials both work as non-transferable ERC721 tokens. Exams, called Block Qualified Tests (BQT), are always linked to the _credential issuer_. Credentials, called Block Qualified Credentials (BQC), are always linked to one _solver_.

## Deployed Versions

Contracts have only been deployed _officially_ on the test networks for now. You can access these over at:

- TestCreator.sol: [0x879919ebA0A48B4AF966e2B43c16B17A906d4DE9](https://mumbai.polygonscan.com/address/0x879919ebA0A48B4AF966e2B43c16B17A906d4DE9#code)
- Credentials.sol: [0x8002C94BDad20F64ACE040C74eBFE262c0A0aE25](https://mumbai.polygonscan.com/address/0x8002C94BDad20F64ACE040C74eBFE262c0A0aE25#code)
- TestVerifier.sol: [0x23F5f7Fe1829f86C8C0bC35C4a2B068D664Eba9c](https://mumbai.polygonscan.com/address/0x23F5f7Fe1829f86C8C0bC35C4a2B068D664Eba9c#code)

## Help and Support

You can start a discussion on [GitHub](https://github.com/0xdeenz/bq-core).

If you wish to communicate directly, you can reach out on [Twitter](https://twitter.com/0xdeenz) or [Telegram](https://t.me/deenzdev).

