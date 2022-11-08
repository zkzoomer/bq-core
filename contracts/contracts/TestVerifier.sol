// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.7;

import "./Pairing.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

interface IPoseidon {
    function poseidon(uint256[2] calldata) external pure returns(uint256);
}

contract TestVerifier {
    using SafeMath for uint256;
    using SafeMath for uint32;
    using Pairing for *;

    uint256 snark_scalar_field = 21888242871839275222246405745257275088548364400416034343698204186575808495617;

    struct VerifyingKey {
        Pairing.G1Point alfa1;
        Pairing.G2Point beta2;
        Pairing.G2Point gamma2;
        Pairing.G2Point delta2;
        Pairing.G1Point[] IC;
    }
    
    struct Proof {
        Pairing.G1Point A;
        Pairing.G2Point B;
        Pairing.G1Point C;
    }

    /* /// @return r bool true if the tree with answerHashes at its leaves hashes into answersRoot at the top
    function verifyTestAnswers(
        uint[] calldata answerHashes,
        uint answersRoot
    ) public view returns(bool r) {
        return true;
        // To be added in v2
        // For v1, only owner can publish tests so we can safely assume the answer hashes provided are correct
        // For v2, verifying answer hashes may be used to increase reputation of the test
    } */
    
    /**
     * @dev Verifies that a solving proof is correct for any of the kinds of tests
     */
    function verifyProof(
        uint8 testType,
        uint[2] calldata a,
        uint[2][2] calldata b,
        uint[2] calldata c,
        uint[] calldata input,
        uint salt
    ) public view returns (bool r) {
        Proof memory proof;
        proof.A = Pairing.G1Point(a[0], a[1]);
        proof.B = Pairing.G2Point([b[0][0], b[0][1]], [b[1][0], b[1][1]]);
        proof.C = Pairing.G1Point(c[0], c[1]);

        uint[] memory inputValues = new uint[](input.length);
        for(uint i = 0; i < input.length; i++){
            inputValues[i] = input[i];
        }

        VerifyingKey memory vk;
        if (testType == 0) {
            vk = openVerifyingKey();
        } else if (testType > 0 && testType < 100) {
            vk = mixedVerifyingKey();
        } else if (testType == 100) {
            vk = multipleVerifyingKey();
        } else {
            revert();
        }
        
        require(input.length + 1 == vk.IC.length,"verifier-bad-input");
        Pairing.G1Point memory vk_x = Pairing.G1Point(0, 0);

        for (uint i = 0; i < input.length - 1; i++) {
            require(input[i] < snark_scalar_field,"verifier-gte-snark-scalar-field");
            vk_x = Pairing.addition(vk_x, Pairing.scalar_mul(vk.IC[i + 1], input[i]));
        }
        // Adding salt separetely, always the last of the public inputs of the proof
        require(salt < snark_scalar_field,"verifier-gte-snark-scalar-field");
        vk_x = Pairing.addition(vk_x, Pairing.scalar_mul(vk.IC[input.length], salt));

        vk_x = Pairing.addition(vk_x, vk.IC[0]);
        if (!Pairing.pairingProd4(
            Pairing.negate(proof.A), proof.B,
            vk.alfa1, vk.beta2,
            vk_x, vk.gamma2,
            proof.C, vk.delta2
        )) return false;
        return true;
    }

    function multipleVerifyingKey() internal pure returns (VerifyingKey memory vk) {
        vk.alfa1 = Pairing.G1Point(
            20491192805390485299153009773594534940189261866228447918068658471970481763042,
            9383485363053290200918347156157836566562967994039712273449902621266178545958
        );

        vk.beta2 = Pairing.G2Point(
            [4252822878758300859123897981450591353533073413197771768651442665752259397132,
             6375614351688725206403948262868962793625744043794305715222011528459656738731],
            [21847035105528745403288232691147584728191162732299865338377159692350059136679,
             10505242626370262277552901082094356697409835680220590971873171140371331206856]
        );
        vk.gamma2 = Pairing.G2Point(
            [11559732032986387107991004021392285783925812861821192530917403151452391805634,
             10857046999023057135944570762232829481370756359578518086990519993285655852781],
            [4082367875863433681332203403145435568316851327593401208105741076214120093531,
             8495653923123431417604973247489272438418190587263600148770280649306958101930]
        );
        vk.delta2 = Pairing.G2Point(
            [8521342259665813950734259773262613831958773301268863906293699426637242842279,
             13686539095956844087728711208603372036427829124302040186590361549008963564964],
            [18343201147632388619156092089176107531666634135092967919251498114555688963702,
             8967039363998139653169116772887311199120552930247783431598167821445906806339]
        );
        vk.IC = new Pairing.G1Point[](3);
        
        vk.IC[0] = Pairing.G1Point( 
            12003302397568222974419635637140073175967412217153380137968206402483244103290,
            9910023685584006386745197358089479098453724395516512195572705180756515221642
        );                                      
        
        vk.IC[1] = Pairing.G1Point( 
            21247887558809586397036146726178877375239911207903076203079084252885346428971,
            8159660199290498370633032160995837259052170217244132774976061252009717600961
        );                                      
        
        vk.IC[2] = Pairing.G1Point( 
            17546907458604639823539783798191577478265602336271088123304593774782601627408,
            17295184015622672469629974037056802329565968363239469425499743044963167282463
        );                                      
        
    }

    function openVerifyingKey() internal pure returns (VerifyingKey memory vk) {
        vk.alfa1 = Pairing.G1Point(
            20491192805390485299153009773594534940189261866228447918068658471970481763042,
            9383485363053290200918347156157836566562967994039712273449902621266178545958
        );

        vk.beta2 = Pairing.G2Point(
            [4252822878758300859123897981450591353533073413197771768651442665752259397132,
             6375614351688725206403948262868962793625744043794305715222011528459656738731],
            [21847035105528745403288232691147584728191162732299865338377159692350059136679,
             10505242626370262277552901082094356697409835680220590971873171140371331206856]
        );
        vk.gamma2 = Pairing.G2Point(
            [11559732032986387107991004021392285783925812861821192530917403151452391805634,
             10857046999023057135944570762232829481370756359578518086990519993285655852781],
            [4082367875863433681332203403145435568316851327593401208105741076214120093531,
             8495653923123431417604973247489272438418190587263600148770280649306958101930]
        );
        vk.delta2 = Pairing.G2Point(
            [8071419909206804094591849048502848755108701024788855475180771317175669313172,
             18551840086537397529057331748015269025930147153451448630273504434069550166528],
            [6586895893357821999764113875421398868940428311604208225003301420172799011978,
             11543130811852428839139789864770610971433523477073969081998608610072720922904]
        );
        vk.IC = new Pairing.G1Point[](4);
        
        vk.IC[0] = Pairing.G1Point( 
            21297939756107246116511552680387351930673058222001297095795981661706897735010,
            14146447007095851741508670274841801939805049964473733587978071594554762824809
        );                                      
        
        vk.IC[1] = Pairing.G1Point( 
            8648893803997054926531464223018425273119422899566805052119516571470542303114,
            9291031740534785184644085071308899529903605233301242616808285197492230034477
        );                                      
        
        vk.IC[2] = Pairing.G1Point( 
            1573719990390173098386861466007306416028170593135076393994568160231122288586,
            599114322511849502877160751052508857303741718205244132946500814250066676579
        );                                      
        
        vk.IC[3] = Pairing.G1Point( 
            20212035562860361052598509564037667491004279108684898865109044094033599689394,
            11718977736261763319294392670085432800905026796798810894229302716934605907230
        );                                      
        
    }

    function mixedVerifyingKey() internal pure returns (VerifyingKey memory vk) {
        vk.alfa1 = Pairing.G1Point(
            20491192805390485299153009773594534940189261866228447918068658471970481763042,
            9383485363053290200918347156157836566562967994039712273449902621266178545958
        );

        vk.beta2 = Pairing.G2Point(
            [4252822878758300859123897981450591353533073413197771768651442665752259397132,
             6375614351688725206403948262868962793625744043794305715222011528459656738731],
            [21847035105528745403288232691147584728191162732299865338377159692350059136679,
             10505242626370262277552901082094356697409835680220590971873171140371331206856]
        );
        vk.gamma2 = Pairing.G2Point(
            [11559732032986387107991004021392285783925812861821192530917403151452391805634,
             10857046999023057135944570762232829481370756359578518086990519993285655852781],
            [4082367875863433681332203403145435568316851327593401208105741076214120093531,
             8495653923123431417604973247489272438418190587263600148770280649306958101930]
        );
        vk.delta2 = Pairing.G2Point(
            [1398674077556833678603205869745338382511550197017630381065919344139460104494,
             3014141459090505000095030624372489917693795198773335116263491328276630340608],
            [13120479026136517116042114711188667637087197991302448027210388274283188943543,
             2574771322543516116015805901471831513661013547873595798463432239126309871117]
        );
        vk.IC = new Pairing.G1Point[](5);
        
        vk.IC[0] = Pairing.G1Point( 
            14155345604055684351163947724917572363108847821610365204579461296099680625381,
            19543653799576809482705428705528944656891684447819372864147170191951017492218
        );                                      
        
        vk.IC[1] = Pairing.G1Point( 
            20624197777557376468131647555770346775563608477840508747355293185166141661007,
            11619535823484280447784795416488920389615945400689208455300337490991179587908
        );                                      
        
        vk.IC[2] = Pairing.G1Point( 
            10879447754828881957950437551558208942626009411851829347069695902533194935886,
            19311203311908225941421562853455621078181860115135617405030256370530717686081
        );                                      
        
        vk.IC[3] = Pairing.G1Point( 
            4616964579542984904263001135438691960099359314679217465351513952475506094503,
            16288090011615554457693551706090018009744015529776207671087244901049307672496
        );                                      
        
        vk.IC[4] = Pairing.G1Point( 
            5082804802667679445422316896498188613190134367124049158170348187335333533166,
            18604442687066796988077159560553385165827087913330405728706188415927414340778
        );   
    }
}

