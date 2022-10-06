// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "./TestCreator.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/interfaces/IERC721.sol";
import "@openzeppelin/contracts/interfaces/IERC721Enumerable.sol";
import "@openzeppelin/contracts/interfaces/IERC721Metadata.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165Storage.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract Credentials is ERC165Storage, IERC721, IERC721Metadata, IERC721Enumerable, Ownable {
    using SafeMath for uint256;
    using Address for address;
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableSet for EnumerableSet.AddressSet;
    using Strings for uint256;

    // Revert messages -- Block Qualified Credentials cannot be transferred
    // This is done to aid with credentials: one can verify on-chain the address that created a test,
    // that is, the owner of the corresponding Block Qualified test NFT.
    string approveRevertMessage = "BQC: cannot approve credentials";
    string transferRevertMessage = "BQC: cannot transfer credentials";

    // Owner contract, the test creator
    TestCreator testContract;

    // Mapping from address to their (enumerable) set of received credentials
    mapping (address => EnumerableSet.UintSet) private _receivedCredentials;

    // Mapping from testId to a mapping from address to the result they got in the credential
    mapping(uint256 => mapping(address => uint256)) private _credentialReceiverResults;

    // Mapping from credential IDs to their (enumerable) set of receiver addresses
    mapping (uint256 => EnumerableSet.AddressSet) private _credentialReceivers;

    // Token name
    string private _name;

    // Token symbol
    string private _symbol;

    constructor () {

        _name = "Block Qualified Credentials";
        _symbol = "BQC";

        testContract = TestCreator(msg.sender);

        // register the supported interfaces to conform to ERC721 via ERC165
        /*
        *     bytes4(keccak256('balanceOf(address)')) == 0x70a08231
        *     bytes4(keccak256('ownerOf(uint256)')) == 0x6352211e
        *     bytes4(keccak256('approve(address,uint256)')) == 0x095ea7b3
        *     bytes4(keccak256('getApproved(uint256)')) == 0x081812fc
        *     bytes4(keccak256('setApprovalForAll(address,bool)')) == 0xa22cb465
        *     bytes4(keccak256('isApprovedForAll(address,address)')) == 0xe985e9c5
        *     bytes4(keccak256('transferFrom(address,address,uint256)')) == 0x23b872dd
        *     bytes4(keccak256('safeTransferFrom(address,address,uint256)')) == 0x42842e0e
        *     bytes4(keccak256('safeTransferFrom(address,address,uint256,bytes)')) == 0xb88d4fde
        *
        *     => 0x70a08231 ^ 0x6352211e ^ 0x095ea7b3 ^ 0x081812fc ^
        *        0xa22cb465 ^ 0xe985e9c5 ^ 0x23b872dd ^ 0x42842e0e ^ 0xb88d4fde == 0x80ac58cd
        */
        _registerInterface(0x80ac58cd);

        /*
        *     bytes4(keccak256('name()')) == 0x06fdde03
        *     bytes4(keccak256('symbol()')) == 0x95d89b41
        *     bytes4(keccak256('tokenURI(uint256)')) == 0xc87b56dd
        *
        *     => 0x06fdde03 ^ 0x95d89b41 ^ 0xc87b56dd == 0x5b5e139f
        */
        _registerInterface(0x5b5e139f);

        /*
        *     bytes4(keccak256('totalSupply()')) == 0x18160ddd
        *     bytes4(keccak256('tokenOfOwnerByIndex(address,uint256)')) == 0x2f745c59
        *     bytes4(keccak256('tokenByIndex(uint256)')) == 0x4f6ccce7
        *
        *     => 0x18160ddd ^ 0x2f745c59 ^ 0x4f6ccce7 == 0x780e9d63
        */
        _registerInterface(0x780e9d63);
    }

    /**
     * @dev See {IERC721Metadata-name}.
     */
    function name() public view virtual override returns (string memory) {
        return _name;
    }

    /**
     * @dev See {IERC721Metadata-symbol}.
     */
    function symbol() public view virtual override returns (string memory) {
        return _symbol;
    }

    /**
     * @dev Mints a new credentials NFT corresponding to the multiple choice test defined by its `testId`
     */
    function giveCredentials(address receiver, uint256 testId, uint256 results) external onlyOwner {
        /* require(!_receivedCredentials[receiver].contains(testId), "Solver already gained credentials"); */

        // Sets or updates the receiver's test results
        _credentialReceiverResults[testId][receiver] = results;

        // Mints a new credential NFT if it does not exist yet
        if (!_receivedCredentials[receiver].contains(testId)) { 
            _receivedCredentials[receiver].add(testId);
            _credentialReceivers[testId].add(receiver);
            
            // Emits a transfer event giving the credentials from the test smart contract to the receiver
            emit Transfer(address(testContract), receiver, testId);
        }
    }

    // If test is invalid you can see it by checking the credential itself
    // YOu cannot burn them because if it got compromiused and a bunch of people minted them you would not be able to burn em all in the delete tx

    /**
     * @dev Returns the credentials string, obtained from the test contract
     */
    function getCredential(uint256 testId) external view returns (string memory) {
        require(testContract.testExists(testId), "test does not exist");

        return testContract.getTest(testId).credentialsGained;
    }

    /**
     * @dev Returns the original test type of the credential: 0, 1 or 2
     */
    function getCredentialType(uint256 testId) external view returns (uint8) {
        require(testContract.testExists(testId), "test does not exist");

        return testContract.getTest(testId).testType;
    }

    /**
     * @dev Returns the credential result
     */
    function getResults(address receiver, uint256 testId) external view returns (uint) {
        return _credentialReceiverResults[testId][receiver];
    }

    /**
     * @dev Returns the credentials tokenURI, which is linked to the test contract
     */
    function tokenURI(uint256 testId) external view override returns (string memory) {
        return testContract.tokenURI(testId);
    }
    
    /**
     * @dev See {IERC721-ownerOf}.
     *
     * Here owner represents ownership of the original test NFT
     */
    function ownerOf(uint256 testId) public view virtual override returns (address) {
        return testContract.ownerOf(testId);
    }

    /**
     * @dev See {IERC721-balanceOf}.
     *
     * Returns the number of Credentials received by an address
     */
    function balanceOf(address _owner) public view virtual override returns (uint256) {
        require(_owner != address(0), "ERC721: balance query for the zero address");
        return _receivedCredentials[_owner].length();
    }

    /**
     * @dev See {IERC721Enumerable-totalSupply}.
     *
     * The `totalSupply` is defined as the number of VALID Credentials that have been given
     */
    function totalSupply() public view virtual override returns (uint256 count) {
        uint256 nTokens = testContract.totalSupply();
        for (uint256 i = 0; i < nTokens; ++i) {
            uint256 testId = testContract.tokenByIndex(i);
            count += _credentialReceivers[testId].length();
        }
    }

    /**
     * @dev See {IERC721Enumerable-tokenOfOwnerByIndex}.
     *
     * Returns the Soulbound Card received by an address at a given index
     */
    function tokenOfOwnerByIndex(address _owner, uint256 index) public view virtual override returns (uint256) {
        require(index < balanceOf(_owner), "Index out of bounds");
        return _receivedCredentials[_owner].at(index);
    }

    /**
     * @dev See {IERC721Enumerable-tokenByIndex}.
     *
     * Returns the corresponding test by index
     */
    function tokenByIndex(uint256 index) public view virtual override returns (uint256) {
        return testContract.tokenByIndex(index);
    }

    /**
     * @dev Returns the list of addresses that received a credential defined by a `testId`
     */
    function credentialReceivers(uint256 testId) public view returns (address[] memory) {
        return _credentialReceivers[testId].values();
    }

    /**
     * @dev Returns the list of credentials that an address `receiver` got
     */
    function receivedCredentials(address receiver) public view returns (uint256[] memory) {
        return _receivedCredentials[receiver].values();
    }

    /**
     * @dev See {IERC721-approve}.
     *
     * Only present to be ERC-721 compliant. Credentials cannot be transferred, and as such cannot be approved for spending.
     */
    function approve(address /* _approved */, uint256 /* _testId */) public view virtual override {
        revert(approveRevertMessage);
    }

    /**
     * @dev See {IERC721-getApproved}.
     *
     * Only present to be ERC-721 compliant. Credentials cannot be transferred, and as such are never approved for spending.
     */
    function getApproved(uint256 /* testId */) public view virtual override returns (address) {
        return address(0);
    }

    /**
     * @dev See {IERC721-setApprovalForAll}.
     *
     * Only present to be ERC-721 compliant. Credentials cannot be transferred, and as such cannot be approved for spending.
     */
    function setApprovalForAll(address /* _operator */, bool /* _approved */) public view virtual override {
        revert(approveRevertMessage);
    }

    /**
     * @dev See {IERC721-isApprovedForAll}.
     *
     * Only present to be ERC-721 compliant. Credentials cannot be transferred, and as such are never approved for spending.
     */
    function isApprovedForAll(address /* owner */, address /* operator */) public view virtual override returns (bool) {
        return false;
    }

    /**
     * @dev See {IERC721-transferFrom}.
     *
     * Only present to be ERC721 compliant. Credentials cannot be transferred.
     */
    function transferFrom(address /* from */, address /* to */, uint256 /* testId */) public view virtual override {
        revert(transferRevertMessage);
    }

    /**
     * @dev See {IERC721-safeTransferFrom}.
     *
     * Only present to be ERC721 compliant. Credentials cannot be transferred.
     */
    function safeTransferFrom(address from, address to, uint256 testId) public virtual override {
        safeTransferFrom(from, to, testId, "");
    }

    /**
     * @dev See {IERC721-safeTransferFrom}.
     *
     * Only present to be ERC721 compliant. Credentials cannot be transferred.
     */
    function safeTransferFrom(address /* from */, address /* to */, uint256 /* testId */, bytes memory /* _data */) public view virtual override {
        revert(transferRevertMessage);
    }
    
}