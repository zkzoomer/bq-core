// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

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

contract TestCreator is ERC165Storage, IERC721, IERC721Metadata, IERC721Enumerable, Ownable, ReentrancyGuard {
    using SafeMath for uint8;
    using SafeMath for uint32;
    using SafeMath for uint256;
    using Address for address;
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableMap for EnumerableMap.UintToAddressMap;
    using Strings for uint256;

    // Revert messages -- Block Qualified tests cannot be transferred
    // This is done to aid with credentials: one can verify on-chain the address that created a test,
    // that is, the owner of the corresponding Block Qualified test NFT.
    string approveRevertMessage = "BQT: cannot approve tests";
    string transferRevertMessage = "BQT: cannot transfer tests";

    // Smart contract for verifying tests
    TestVerifier public verifierContract;
    // Smart contract for giving credentials
    Credentials public credentialsContract;

    // Mapping from holder address to their (enumerable) set of owned tokens
    mapping (address => EnumerableSet.UintSet) private _holderTokens;

    // Enumerable mapping from token ids to their owners
    EnumerableMap.UintToAddressMap private _tokenOwners;

    // Number of tests that have been created
    uint256 private _ntests;

    // Token name
    string private _name;

    // Token symbol
    string private _symbol;

    struct Test {
        uint8 testType;
        uint8 nQuestions;  // number of open answer questions the test has
        uint8 minimumGrade;  // out of 100, minimum mark the user must get to obtain the credential
        uint24 solvers;
        uint24 credentialLimit;
        uint32 timeLimit;
        address requiredPass;
        uint256 gasFund;
        string credentialsGained;
    }

    // Mapping defining each test
    mapping(uint256 => Test) private _tests;
    
    // Mapping with the necessary info for the different kinds of tests
    mapping(uint256 => uint256) private _multipleChoiceRoot;  // Merkle root of the multiple choice tree
    mapping(uint256 => uint256) private _openAnswersRoot;  // Merkle root of the answer hashes tree
    mapping(uint256 => uint256[]) private _openAnswersHashes;  // Array containing the correct answer hashes for open answer tests

    // Mapping for token URIs
    mapping (uint256 => string) private _tokenURIs;  // URL containing the test

    // Salts that have been already used before for submitting solutions
    mapping (uint256 => bool) public usedSalts;

    /**
     * @dev Initializes the contract by setting a `name` and a `symbol` and deploying the Credentials and TestVerifier contracts
     */
    constructor () {
        _name = "Block Qualified tests";
        _symbol = "BQT";

        credentialsContract = new Credentials();
        verifierContract = new TestVerifier();

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
     * @dev Creates a new multiple choice/open answer/mixed test, storing the defining hashes on chain
     *
     * We assume the credential issuer will provide a solvable test and specify the actual number of questions it has
     */
    function createTest(
        uint8 _testType,
        uint8 _nQuestions,
        uint8 _minimumGrade,
        uint24 _credentialLimit,
        uint32 _timeLimit,
        uint256[] calldata _solvingHashes,
        address _requiredPass,
        string memory _credentialsGained,
        string memory _testURI
    ) external payable onlyOwner {
        // Increase the number of tests available
        _ntests++;
        uint256 _testId = _ntests;

        require(_timeLimit > block.timestamp, "Time limit is in the past");
        require(_credentialLimit > 0, "Credential limit must be above zero");
        if(_requiredPass != address(0)) {
            require(RequiredPass(_requiredPass).balanceOf(msg.sender) >= 0);  // dev: invalid required pass address provided
        }
        require(_nQuestions >= 1 && _nQuestions <= 64, "Invalid number of questions");
        require(_minimumGrade > 0 && _minimumGrade <= 100, "Invalid minimum grade");
        
        // Storing the test type information
        if (_testType == 0) {  // Open answers test, providing the [answerHashesRoot]
            _openAnswersRoot[_testId] = _solvingHashes[0];
        } else if (_testType > 0 && _testType < 100) {  /// Mixed test, providing [solutionHash, answerHashesRoot]
            _multipleChoiceRoot[_testId] = _solvingHashes[0];
            _openAnswersRoot[_testId] = _solvingHashes[1];
        } else if (_testType == 100) {  // Multiple choice test, providing the [solutionHash]
            require(_minimumGrade == 100, "Multiple choice test must have 100 as minimum grade");
            require(_nQuestions == 1, "Multiple choice test must have 1 as number of open questions");
            _multipleChoiceRoot[_testId] = _solvingHashes[0];
        } else {
            revert("Invalid test type");
        }

        // Setting the given URI that holds all of the questions
        _tokenURIs[_testId] = _testURI;

        // Defining the test object for this testId
        _tests[_testId] = Test(
            _testType,          // testType
            _nQuestions,        // nQuestions
            _minimumGrade,
            0,                  // solvers
            _credentialLimit,   // credentialLimit
            _timeLimit,         // timeLimit
            _requiredPass,      // requiredPass
            msg.value,          // gasFund
            _credentialsGained  // credentialsGained
        );

        // Minting this new nft
        _holderTokens[msg.sender].add(_testId);
        _tokenOwners.set(_testId, msg.sender);
        emit Transfer(address(0), msg.sender, _testId);
    }

    /**
     * @dev Creates a new multiple choice/open answer/mixed test, storing the defining hashes on chain
     *
     * We assume the credential issuer will provide a solvable test and specify the actual number of questions it has
     * For the first iteration of the protocol, only the
     */
    function verifyTestAnswers(uint256 testId, uint256[] memory answerHashes) external {
        require(_exists(testId), "Test does not exist");
        require(_tests[testId].testType < 100, "Test is not open answer or mixed");
        require(_openAnswersHashes[testId].length == 0, "Test was already verified");
        require(ownerOf(testId) == msg.sender, "Verifying test that is not own");
        require(answerHashes.length == _tests[testId].nQuestions, "Invalid number provided");
        /* require(verifierContract.verifyTestAnswers(answerHashes, _openAnswersRoot[testId]), "Answers provided do not verify test"); */
        _openAnswersHashes[testId] = answerHashes;
    } 
    
    /**
     * @dev Returns the struct that defines a Test
     */
    function getTest(uint256 testId) external view returns (Test memory) {
        require(_exists(testId), "Test does not exist");
        return _tests[testId];
    }

    /**
     * @dev Returns the solution hash that defines a multiple choice test
     * Also used with mixed tests
     */
    function getMultipleChoiceRoot(uint256 testId) external view returns (uint256) {
        require(_exists(testId), "Test does not exist");
        require(_tests[testId].testType > 0 && _tests[testId].testType <= 100, "Test is not multiple choice or mixed");
        return _multipleChoiceRoot[testId];
    }

    /**
     * @dev Returns the list of solution hashes that define an open answer test
     * Also used with mixed tests
     */
    function getOpenAnswersRoot(uint256 testId) external view returns (uint256) {
        require(_exists(testId), "Test does not exist");
        require(_tests[testId].testType < 100, "Test is not open answer or mixed");
        return _openAnswersRoot[testId];
    }

    /**
     * @dev Returns the list of solution hashes that define an open answer test, if specified
     * Also used with mixed tests
     */
    function getOpenAnswersHashes(uint256 testId) external view returns (uint256[] memory) {
        require(_exists(testId), "Test does not exist");
        require(_tests[testId].testType < 100, "Test is not open answer or mixed");
        require(_openAnswersHashes[testId].length > 0, "Test was not verified");
        return _openAnswersHashes[testId];
    }

    /**
     * @dev Returns if a given test exists
     */
    function testExists(uint256 testId) external view returns (bool) {
        return _exists(testId);
    }

    /**
     * @dev Returns if a given test is still valid
     */
    function testIsValid(uint256 testId) external view returns (bool) {
        require(_exists(testId), "Test does not exist");
        return _tests[testId].testType != 255;
    }

    /**
     * @dev Returns the test URI, which contains inside the questions
     */
    function tokenURI(uint256 testId) external view override returns (string memory) {
        require(_exists(testId), "Test does not exist");
        return _tokenURIs[testId];
    }

    /**
     * @dev Allows the owner of a test to increase its gas fund
     */
    function fundTest(uint256 testId) external payable {
        require(msg.value > 0);  // Must send value
        require(_exists(testId), "Test does not exist");
        require(ownerOf(testId) == msg.sender, "Funding test that is not own");
        require(_tests[testId].testType != 255, "Test has been deleted and can no longer be funded");
        _tests[testId].gasFund += msg.value;
    }

    /**
     * @dev Allows the owner of a test to no longer recognize it as valid by making it impossible to solve
     * Invalidating a test is final
     */
    function invalidateTest(uint256 testId) external nonReentrant {
        require(_exists(testId), "Test does not exist");
        require(_tests[testId].testType != 255, "Test was already invalidated");
        require(ownerOf(testId) == msg.sender, "Invalidating test that is not own");

        // Test still lives on chain for reference, but can no longer be solved.
        _tests[testId].testType = 255;

        // Returns the remaining gas fund to the owner
        payable(msg.sender).transfer(_tests[testId].gasFund);

        emit Transfer(msg.sender, address(0), testId);
    }

    /**
     * @dev Allows users to attempt a test solution, minting a Credentials NFT if successful with their results
     */
    function solveTest(
        uint256 testId, 
        uint[2] calldata a,
        uint[2][2] calldata b,
        uint[2] calldata c,
        uint[] calldata input  
    ) external nonReentrant {
        uint256 gasAtStart = gasleft();  // Gas refund

        require(_exists(testId), "Solving test that does not exist");
        
        uint256 result;

        if ( _tests[testId].testType == 0 ) {  // Open answers test, providing [results, answerHashesRoot, salt]
            require(input.length == 3);  // @dev invalid input length
            require(!usedSalts[input[2]], "Salt was already used");
            
            _validateSolving(testId);

            // Ensuring the open answer test being solved is the one selected
            require(input[1] == _openAnswersRoot[testId], "Solving for another test");

            // Verify solution and get result
            require(verifierContract.verifyOpenProof(a, b, c, input), "Invalid proof");
            result = (input[0] + _tests[testId].nQuestions > 64) ?  // prevent underflow
                100 * (input[0] + _tests[testId].nQuestions - 64) / _tests[testId].nQuestions
            :
                0;
            require(result >= _tests[testId].minimumGrade, "Grade is below minimum");

            usedSalts[input[2]] = true;

        } else if ( _tests[testId].testType > 0 && _tests[testId].testType < 100 ) {  // Mixed test, providing [solutionHash, results, answersHashRoot, multipleChoiceSalt, openAnswersSalt]
            require(input.length == 5);  // @dev invalid input length
            require(!usedSalts[input[3]] && !usedSalts[input[4]], "Salt was already used");

            _validateSolving(testId);

            // Ensuring the open answer test being solved is the one selected
            require(input[2] == _openAnswersRoot[testId], "Solving for another test");

            // Verify solution and get result
            require(verifierContract.verifyMixedProof(a, b, c, input), "Invalid proof");

            // The testType being below 100 means it is a mixed test, and its value represents the weight of the multiple choice test
            result = (input[0] == _multipleChoiceRoot[testId] ? _tests[testId].testType : 0) 
                + 
                (
                (input[1] + _tests[testId].nQuestions > 64) ?
                    (input[1] + _tests[testId].nQuestions - 64) * (100 - _tests[testId].testType) / _tests[testId].nQuestions
                :
                    0
                );
            require(result >= _tests[testId].minimumGrade, "Grade is below minimum");

            usedSalts[input[3]] = true;
            usedSalts[input[4]] = true;

        } else if ( _tests[testId].testType == 100 ) {  // Multiple choice test, providing [solutionHash, salt]
            require(input.length == 2);  // @dev invalid input length
            
            require(!usedSalts[input[1]], "Salt was already used");

            _validateSolving(testId);
        
            // Verify solution and get result
            require(verifierContract.verifyMultipleProof(a, b, c, input), "Invalid proof");
            result = 100;

            require(input[0] == _multipleChoiceRoot[testId], "Wrong solution");

            usedSalts[input[1]] = true;

        } else if ( _tests[testId].testType == 255 ) {
            revert("Test has been deleted and can no longer be solved");
        } 

        if (credentialsContract.getResults(msg.sender, testId) == 0) {
            // If the user had not received this credential, it increases the number of solvers
            _tests[testId].solvers++;
        } else {
            require(result > credentialsContract.getResults(msg.sender, testId), "Your existing credential has a better result");
        }

        credentialsContract.giveCredentials(msg.sender, testId, result);

        // Refunds gas to solver from the testId fund
        uint256 gasRefund = (gasAtStart - gasleft() + 40000) * tx.gasprice;
        if (_tests[testId].gasFund >= gasRefund) {
            _tests[testId].gasFund -= gasRefund;
            payable(msg.sender).transfer(gasRefund);
        } 
    }

    /**
     * @dev Verifies that the test can be solved by msg.sender
     */
    function _validateSolving(uint256 testId) internal view {
        require(msg.sender != ownerOf(testId), "Test cannot be solved by owner");
        require(_tests[testId].solvers < _tests[testId].credentialLimit, "Maximum number of credentials reached");
        require(block.timestamp <= _tests[testId].timeLimit, "Time limit for this credential reached");
        if (_tests[testId].requiredPass != address(0)) {
            require(RequiredPass(_tests[testId].requiredPass).balanceOf(msg.sender) > 0, "Solver does not own the required token");
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
    function ownerOf(uint256 testId) public view virtual override returns (address) {
        return _tokenOwners.get(testId, "ERC721: owner query for nonexistent token");
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
        (uint256 testId, ) = _tokenOwners.at(index);
        return testId;
    }

    /**
     * @dev See {IERC721-approve}.
     *
     * Only present to be ERC-721 compliant. tests cannot be transferred, and as such cannot be approved for spending.
     */
    function approve(address /* _approved */, uint256 /* _testId */) public view virtual override {
        revert(approveRevertMessage);
    }

    /**
     * @dev See {IERC721-getApproved}.
     *
     * Only present to be ERC-721 compliant. tests cannot be transferred, and as such are never approved for spending.
     */
    function getApproved(uint256 /* testId */) public view virtual override returns (address) {
        return address(0);
    }

    /**
     * @dev See {IERC721-setApprovalForAll}.
     *
     * Only present to be ERC721 compliant. tests cannot be transferred, and as such cannot be approved for spending.
     */
    function setApprovalForAll(address /* _operator */, bool /* _approved */) public view virtual override {
        revert(approveRevertMessage);
    }

    /**
     * @dev See {IERC721-isApprovedForAll}.
     *
     * Only present to be ERC-721 compliant. tests cannot be transferred, and as such are never approved for spending.
     */
    function isApprovedForAll(address /* owner */, address /* operator */) public view virtual override returns (bool) {
        return false;
    }

    /**
     * @dev See {IERC721-transferFrom}.
     *
     * Only present to be ERC721 compliant. tests cannot be transferred.
     */
    function transferFrom(address /* from */, address /* to */, uint256 /* testId */) public view virtual override {
        revert(transferRevertMessage);
    }

    /**
     * @dev See {IERC721-safeTransferFrom}.
     */
    function safeTransferFrom(address from, address to, uint256 testId) public virtual override {
        safeTransferFrom(from, to, testId, "");
    }

    /**
     * @dev See {IERC721-safeTransferFrom}.
     *
     * Only present to be ERC721 compliant. tests cannot be transferred.
     */
    function safeTransferFrom(address /* from */, address /* to */, uint256 /* testId */, bytes memory /* _data */) public view virtual override {
        revert(transferRevertMessage);
    }

    /**
     * @dev Returns whether `testId` exists.
     *
     * Tokens start existing when they are minted (`_mint`),
     * and stop existing when they are burned (`_burn`).
     */
    function _exists(uint256 testId) internal view virtual returns (bool) {
        return _tokenOwners.contains(testId);
    }
}