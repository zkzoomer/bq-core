const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const poseidon = require("../src/poseidon.js");
const keccak256 = require('keccak256')

const { multipleChoiceRootA, multipleChoiceRootB, openAnswersRootA, openAnswersRootB } = require('./helpers/testRoots')
const { ZERO_ADDRESS } = constants;

const testURI = 'https://exampletest.io';
const credentialsGained = 'Test verified';

function shouldBehaveLikeERC721 (approveRevertMessage, transferRevertMessage, owner, newOwner, solver, altSolver, operator, other) {
    /* shouldSupportInterfaces([
        'ERC165',
        'ERC721',
    ]); */

    context('with minted tokens', function () {
        it('passes', function () {
            console.log('The Tools You Need')
        })
    })

}

module.exports = {
    shouldBehaveLikeERC721
}
