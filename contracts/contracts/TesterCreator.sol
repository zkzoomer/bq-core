// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Credentials.sol";
import "./TestVerifier.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/interfaces/IERC721.sol";
import "@openzeppelin/contracts/interfaces/IERC721Enumerable.sol";
import "@openzeppelin/contracts/interfaces/IERC721Metadata.sol";
import "@openzeppelin/contracts/interfaces/IERC721Receiver.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165Storage.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

interface RequiredPass {
    function balanceOf(address _owner) external view returns (uint256);
}

contract TesterCreator is TestVerifier, ERC165Storage, IERC721, IERC721Metadata, IERC721Enumerable, ReentrancyGuard {
    using SafeMath for uint8;
    using SafeMath for uint32;
    using SafeMath for uint256;
    using Address for address;
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableMap for EnumerableMap.UintToAddressMap;
    using Strings for uint256;

    // Revert messages -- Block Qualified Testers cannot be transferred
    // This is done to aid with credentials: one can verify on-chain the address that created a test,
    // that is, the owner of the corresponding Block Qualified Tester NFT.
    string approveRevertMessage = "BQT: cannot approve testers";
    string transferRevertMessage = "BQT: cannot transfer testers";

    // Smart contract for giving credentials
    Credentials public credentialsContract;

    // Mapping from holder address to their (enumerable) set of owned tokens
    mapping (address => EnumerableSet.UintSet) private _holderTokens;

    // Enumerable mapping from token ids to their owners
    EnumerableMap.UintToAddressMap private _tokenOwners;

    // Number of testers that have been created
    uint256 private _nTesters;

    // Token name
    string private _name;

    // Token symbol
    string private _symbol;

    // TODO: tight pack it
    struct Test {
        uint8 testType;
        uint256 prize;
        uint32 solvers;
        uint32 timeLimit;
        uint32 credentialLimit;
        address requiredPass;
        string credentialsGained;
    }

    struct MixedTest {
        uint256 solutionHash;
        mapping(uint256 => uint256[]) answerHashes;
    }

    // Mapping defining each tester
    mapping(uint256 => Test) private _tests;
    // Mapping with the necessary info for the different kinds of tests
    mapping(uint256 => uint256) private _multipleChoiceTests;  // Solution hashes of each
    mapping(uint256 => uint256[]) private _openAnswerTests;  // All answer hashes of each

    // Mapping for token URIs
    mapping (uint256 => string) private _tokenURIs;  // URL containing the multiple choice test for each tester

    // Salts that have been already used before for submitting solutions
    mapping (uint256 => bool) public usedSalts;


    /**
     * @dev Initializes the contract by setting a `name` and a `symbol`
     */
    constructor (address _poseidonHasher) TestVerifier(_poseidonHasher) {
        _name = "Block Qualified Testers";
        _symbol = "BQT";

        credentialsContract = new Credentials();

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

    function createMultipleChoiceTest(
        string memory _testerURI, 
        uint256 _solutionHash, 
        uint32 _timeLimit,
        uint32 _credentialLimit,
        address _requiredPass,
        string memory _credentialGained
    ) external payable {
        // Increase the number of testers available
        _nTesters++;
        uint256 _testerId = _nTesters;

        _multipleChoiceTests[_testerId] = _solutionHash;

        _createTester(
            _testerId,
            0,
            _timeLimit,
            _credentialLimit,
            _requiredPass,
            _credentialGained,
            _testerURI
        );
    }

    function createOpenAnswerTest(
        string memory _testerURI, 
        uint256[] calldata _answerHashes, 
        uint32 _timeLimit,
        uint32 _credentialLimit,
        address _requiredPass,
        string memory _credentialGained
    ) external payable {
        require(_answerHashes.length <= 50, "Number of questions must be < 50");

        // Increase the number of testers available
        _nTesters++;
        uint256 _testerId = _nTesters;

        _openAnswerTests[_testerId] = _answerHashes;

        _createTester(
            _testerId,
            1,
            _timeLimit,
            _credentialLimit,
            _requiredPass,
            _credentialGained,
            _testerURI
        );

    }

    function createMixedTest(
        string memory _testerURI, 
        uint256 _solutionHash,
        uint256[] calldata _answerHashes, 
        uint32 _timeLimit,
        uint32 _credentialLimit,
        address _requiredPass,
        string memory _credentialGained
    ) external payable {
        require(_answerHashes.length <= 50, "Number of questions must be < 50");

        // Increase the number of testers available
        _nTesters++;
        uint256 _testerId = _nTesters;
        
        // A mixed test is simply a combination of a multiple choice test and an open answer test
        _multipleChoiceTests[_testerId] = _solutionHash;
        _openAnswerTests[_testerId] = _answerHashes;

        _createTester(
            _testerId,
            2,
            _timeLimit,
            _credentialLimit,
            _requiredPass,
            _credentialGained,
            _testerURI
        );

    }

    function _createTester(
        uint256 _testerId,
        uint8 _testType,
        uint32 _timeLimit,
        uint32 _credentialLimit,
        address _requiredPass,
        string memory _credentialGained,
        string memory _testerURI
    ) internal {
        require(_timeLimit > block.timestamp, "Time limit is in the past");
        require(_credentialLimit > 0, "Credential limit must be above zero");
        if(_requiredPass != address(0)) {
            require(RequiredPass(_requiredPass).balanceOf(msg.sender) >= 0);  // dev: invalid required pass address provided
        }

        // Setting the given URI that holds all of the questions
        _tokenURIs[_testerId] = _testerURI;

        // Defining the test object for this testerId
        _tests[_testerId] = Test(
            _testType,
            msg.value,
            0,
            _timeLimit,
            _credentialLimit,
            _requiredPass,
            _credentialGained
        );

        // Minting this new nft
        _holderTokens[msg.sender].add(_testerId);
        _tokenOwners.set(_testerId, msg.sender);
        emit Transfer(address(0), msg.sender, _testerId);
    }
    
    /**
     * @dev Returns the struct that defines a Test
     */
    function getTester(uint256 testerId) external view returns (Test memory) {
        require(_exists(testerId), "Test does not exist");
        return _tests[testerId];
    }

    /**
     * @dev Returns the solution hash that defines a multiple choice test
     * Also used with mixed tests
     */
    function getMultipleChoiceTest(uint256 testerId) external view returns (uint256 solutionHash) {
        require(_exists(testerId), "Test does not exist");
        uint8 _testType = _tests[testerId].testType;
        require(_testType == 0 || _testType == 2, "Test is not multiple choice or mixed");
        return _multipleChoiceTests[testerId];
    }

    /**
     * @dev Returns the list of solution hashes that define an open answer test
     * Also used with mixed tests
     */
    function getOpenAnswerTest(uint256 testerId) external view returns (uint256[] memory answerHashes) {
        require(_exists(testerId), "Test does not exist");
        uint8 _testType = _tests[testerId].testType;
        require(_testType == 1 || _testType == 2, "Test is not open answer or mixed");
        return _openAnswerTests[testerId];
    }

    /**
     * @dev Returns if a given tester is still valid, that is, if it exists
     */
    function testerExists(uint256 testerId) external view returns (bool) {
        return _exists(testerId);
    }

    /**
     * @dev Returns the test URI, which contains inside the questions
     */
    function tokenURI(uint256 testerId) external view override returns (string memory) {
        require(_exists(testerId), "Tester does not exist");
        return _tokenURIs[testerId];
    }

    /**
     * @dev Allows the owner of a tester to no longer recognize it as valid by essentially burning it
     * Deleting a test is **final**
     */
    function deleteTester(uint256 testerId) external {
        require(_exists(testerId), "Tester does not exist");
        require(ownerOf(testerId) == msg.sender, "Deleting tester that is not own");

        // Burns the token from the `msg.sender` holdings
        _holderTokens[msg.sender].remove(testerId);
        _tokenOwners.remove(testerId);

        bool wasSolved = _tests[testerId].solvers == 0 ? false : true;
        uint256 prize = _tests[testerId].prize;

        // Some still lives on chain but cannot be accessed by smart contract calls
        delete _tests[testerId];
        delete _tokenURIs[testerId];

        // Returns the funds to the owner if the test was never solved
        if (!wasSolved) {
            payable(msg.sender).transfer(prize);
        }

        emit Transfer(msg.sender, address(0), testerId);
    }

    /**
     * @dev Allows users to attempt a test solution, minting a Credentials NFT if successful with their results
     */
    function solveTester(
        uint256 testerId, 
        uint[2] calldata a,
        uint[2][2] calldata b,
        uint[2] calldata c,
        uint[] calldata input  // 0: [solvingHash, salt], 1: [result, salt], 2: [solvingHash, result, multipleChoiceSalt, openAnswersSalt]
    ) external nonReentrant {
        require(_exists(testerId), "Solving test that does not exist");

        Test memory _test = _tests[testerId];
        uint8 testType = _test.testType;
        uint256 results;
        if ( testType == 0 ) {  // Multiple choice test

            require(input.length == 2, "Invalid input length");
            require(!usedSalts[input[1]], "Salt was already used");

            _validateTester(testerId, _test);
        
            // Verify solution and get results
            results = getMultipleChoiceResults(
                _multipleChoiceTests[testerId],  // Solution hash
                a, 
                b, 
                c, 
                input[0],  // solvingHash
                input[1]   // salt
            );

            usedSalts[input[1]] = true;
            
        } else if ( testType == 1 ) {  // Open answer test

            require(input.length == 2, "Invalid input length");
            require(!usedSalts[input[1]], "Salt was already used");
            
            _validateTester(testerId, _test);
            uint[] memory answerHashes = _openAnswerTests[testerId];
        
            // Verify solution and get results
            results = getOpenAnswerResults(
                a, 
                b, 
                c, 
                input[0],  // result
                input[1],  // salt
                answerHashes  // answerHashes
            );

            usedSalts[input[1]] = true;

        } else if ( testType == 2 ) {  // Mixed test

            require(input.length == 4, "Invalid input length");
            require(!usedSalts[input[2]] && !usedSalts[input[3]], "Salt was already used");

            _validateTester(testerId, _test);
            uint[] memory answerHashes = _openAnswerTests[testerId];

            // Verify solution and get results
            results = getMixedTestResults(
                _multipleChoiceTests[testerId],  // Solution hash
                a, 
                b, 
                c, 
                input[0],  // solvingHash
                input[1],  // result
                input[2],  // multipleChoiceSalt
                input[3],  // openAnswersSalt
                answerHashes  // answerHashes
            );

            usedSalts[input[2]] = true;
            usedSalts[input[3]] = true;
        }

        if (_test.solvers == 0) { payable(msg.sender).transfer(_test.prize); }
        credentialsContract.giveCredentials(msg.sender, testerId, results);
        _tests[testerId].solvers++;
    }

    function _validateTester(uint256 testerId, Test memory _test) internal view {
        require(msg.sender != ownerOf(testerId), "Tester cannot be solved by owner");
        require(_test.credentialLimit == 0 || _test.solvers < _test.credentialLimit, "Maximum number of credentials reached");
        require(block.timestamp <= _test.timeLimit, "Time limit for this credential reached");
        if(_test.requiredPass != address(0)) {
            require(RequiredPass(_test.requiredPass).balanceOf(msg.sender) > 0, "Solver does not own the required token");
        }
    }

    /**
     * @dev See {IERC721-balanceOf}.
     */
    function balanceOf(address owner) public view virtual override returns (uint256) {
        require(owner != address(0), "ERC721: balance query for the zero address");
        return _holderTokens[owner].length();
    }

    /**
     * @dev See {IERC721-ownerOf}.
     */
    function ownerOf(uint256 tokenId) public view virtual override returns (address) {
        return _tokenOwners.get(tokenId, "ERC721: owner query for nonexistent token");
    }

    /**
     * @dev See {IERC721Enumerable-totalSupply}.
     */
    function totalSupply() public view virtual override returns (uint256 count) {
        return _tokenOwners.length();
    }

    /**
     * @dev See {IERC721Enumerable-tokenOfOwnerByIndex}.
     */
    function tokenOfOwnerByIndex(address _owner, uint256 index) public view virtual override returns (uint256) {
        require(index < balanceOf(_owner), "Index out of bounds");
        return _holderTokens[_owner].at(index);
    }

    /**
     * @dev See {IERC721Enumerable-tokenByIndex}.
     */
    function tokenByIndex(uint256 index) public view virtual override returns (uint256) {
        require(index < totalSupply(), "Index out of bounds");  
        (uint256 tokenId, ) = _tokenOwners.at(index);
        return tokenId;
    }

    /**
     * @dev See {IERC721-approve}.
     *
     * Only present to be ERC-721 compliant. Testers cannot be transferred, and as such cannot be approved for spending.
     */
    function approve(address /* _approved */, uint256 /* _tokenId */) public view virtual override {
        revert(approveRevertMessage);
    }

    /**
     * @dev See {IERC721-getApproved}.
     *
     * Only present to be ERC-721 compliant. Testers cannot be transferred, and as such are never approved for spending.
     */
    function getApproved(uint256 /* tokenId */) public view virtual override returns (address) {
        return address(0);
    }

    /**
     * @dev See {IERC721-setApprovalForAll}.
     *
     * Only present to be ERC721 compliant. Testers cannot be transferred, and as such cannot be approved for spending.
     */
    function setApprovalForAll(address /* _operator */, bool /* _approved */) public view virtual override {
        revert(approveRevertMessage);
    }

    /**
     * @dev See {IERC721-isApprovedForAll}.
     *
     * Only present to be ERC-721 compliant. Testers cannot be transferred, and as such are never approved for spending.
     */
    function isApprovedForAll(address /* owner */, address /* operator */) public view virtual override returns (bool) {
        return false;
    }

    /**
     * @dev See {IERC721-transferFrom}.
     *
     * Only present to be ERC721 compliant. Testers cannot be transferred.
     */
    function transferFrom(address /* from */, address /* to */, uint256 /* tokenId */) public view virtual override {
        revert(transferRevertMessage);
    }

    /**
     * @dev See {IERC721-safeTransferFrom}.
     */
    function safeTransferFrom(address from, address to, uint256 tokenId) public virtual override {
        safeTransferFrom(from, to, tokenId, "");
    }

    /**
     * @dev See {IERC721-safeTransferFrom}.
     *
     * Only present to be ERC721 compliant. Testers cannot be transferred.
     */
    function safeTransferFrom(address /* from */, address /* to */, uint256 /* tokenId */, bytes memory /* _data */) public view virtual override {
        revert(transferRevertMessage);
    }

    /**
     * @dev Returns whether `tokenId` exists.
     *
     * Tokens start existing when they are minted (`_mint`),
     * and stop existing when they are burned (`_burn`).
     */
    function _exists(uint256 tokenId) internal view virtual returns (bool) {
        return _tokenOwners.contains(tokenId);
    }

}