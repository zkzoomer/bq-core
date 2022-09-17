//
// Copyright 2017 Christian Reitwiessner
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//
// 2019 OKIMS
//      ported to solidity 0.6
//      fixed linter warnings
//      added requiere error messages
//
//
// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.6.11;
library Pairing {
    struct G1Point {
        uint X;
        uint Y;
    }
    // Encoding of field elements is: X[0] * z + X[1]
    struct G2Point {
        uint[2] X;
        uint[2] Y;
    }
    /// @return the generator of G1
    function P1() internal pure returns (G1Point memory) {
        return G1Point(1, 2);
    }
    /// @return the generator of G2
    function P2() internal pure returns (G2Point memory) {
        // Original code point
        return G2Point(
            [11559732032986387107991004021392285783925812861821192530917403151452391805634,
             10857046999023057135944570762232829481370756359578518086990519993285655852781],
            [4082367875863433681332203403145435568316851327593401208105741076214120093531,
             8495653923123431417604973247489272438418190587263600148770280649306958101930]
        );

/*
        // Changed by Jordi point
        return G2Point(
            [10857046999023057135944570762232829481370756359578518086990519993285655852781,
             11559732032986387107991004021392285783925812861821192530917403151452391805634],
            [8495653923123431417604973247489272438418190587263600148770280649306958101930,
             4082367875863433681332203403145435568316851327593401208105741076214120093531]
        );
*/
    }
    /// @return r the negation of p, i.e. p.addition(p.negate()) should be zero.
    function negate(G1Point memory p) internal pure returns (G1Point memory r) {
        // The prime q in the base field F_q for G1
        uint q = 21888242871839275222246405745257275088696311157297823662689037894645226208583;
        if (p.X == 0 && p.Y == 0)
            return G1Point(0, 0);
        return G1Point(p.X, q - (p.Y % q));
    }
    /// @return r the sum of two points of G1
    function addition(G1Point memory p1, G1Point memory p2) internal view returns (G1Point memory r) {
        uint[4] memory input;
        input[0] = p1.X;
        input[1] = p1.Y;
        input[2] = p2.X;
        input[3] = p2.Y;
        bool success;
        // solium-disable-next-line security/no-inline-assembly
        assembly {
            success := staticcall(sub(gas(), 2000), 6, input, 0xc0, r, 0x60)
            // Use "invalid" to make gas estimation work
            switch success case 0 { invalid() }
        }
        require(success,"pairing-add-failed");
    }
    /// @return r the product of a point on G1 and a scalar, i.e.
    /// p == p.scalar_mul(1) and p.addition(p) == p.scalar_mul(2) for all points p.
    function scalar_mul(G1Point memory p, uint s) internal view returns (G1Point memory r) {
        uint[3] memory input;
        input[0] = p.X;
        input[1] = p.Y;
        input[2] = s;
        bool success;
        // solium-disable-next-line security/no-inline-assembly
        assembly {
            success := staticcall(sub(gas(), 2000), 7, input, 0x80, r, 0x60)
            // Use "invalid" to make gas estimation work
            switch success case 0 { invalid() }
        }
        require (success,"pairing-mul-failed");
    }
    /// @return the result of computing the pairing check
    /// e(p1[0], p2[0]) *  .... * e(p1[n], p2[n]) == 1
    /// For example pairing([P1(), P1().negate()], [P2(), P2()]) should
    /// return true.
    function pairing(G1Point[] memory p1, G2Point[] memory p2) internal view returns (bool) {
        require(p1.length == p2.length,"pairing-lengths-failed");
        uint elements = p1.length;
        uint inputSize = elements * 6;
        uint[] memory input = new uint[](inputSize);
        for (uint i = 0; i < elements; i++)
        {
            input[i * 6 + 0] = p1[i].X;
            input[i * 6 + 1] = p1[i].Y;
            input[i * 6 + 2] = p2[i].X[0];
            input[i * 6 + 3] = p2[i].X[1];
            input[i * 6 + 4] = p2[i].Y[0];
            input[i * 6 + 5] = p2[i].Y[1];
        }
        uint[1] memory out;
        bool success;
        // solium-disable-next-line security/no-inline-assembly
        assembly {
            success := staticcall(sub(gas(), 2000), 8, add(input, 0x20), mul(inputSize, 0x20), out, 0x20)
            // Use "invalid" to make gas estimation work
            switch success case 0 { invalid() }
        }
        require(success,"pairing-opcode-failed");
        return out[0] != 0;
    }
    /// Convenience method for a pairing check for two pairs.
    function pairingProd2(G1Point memory a1, G2Point memory a2, G1Point memory b1, G2Point memory b2) internal view returns (bool) {
        G1Point[] memory p1 = new G1Point[](2);
        G2Point[] memory p2 = new G2Point[](2);
        p1[0] = a1;
        p1[1] = b1;
        p2[0] = a2;
        p2[1] = b2;
        return pairing(p1, p2);
    }
    /// Convenience method for a pairing check for three pairs.
    function pairingProd3(
            G1Point memory a1, G2Point memory a2,
            G1Point memory b1, G2Point memory b2,
            G1Point memory c1, G2Point memory c2
    ) internal view returns (bool) {
        G1Point[] memory p1 = new G1Point[](3);
        G2Point[] memory p2 = new G2Point[](3);
        p1[0] = a1;
        p1[1] = b1;
        p1[2] = c1;
        p2[0] = a2;
        p2[1] = b2;
        p2[2] = c2;
        return pairing(p1, p2);
    }
    /// Convenience method for a pairing check for four pairs.
    function pairingProd4(
            G1Point memory a1, G2Point memory a2,
            G1Point memory b1, G2Point memory b2,
            G1Point memory c1, G2Point memory c2,
            G1Point memory d1, G2Point memory d2
    ) internal view returns (bool) {
        G1Point[] memory p1 = new G1Point[](4);
        G2Point[] memory p2 = new G2Point[](4);
        p1[0] = a1;
        p1[1] = b1;
        p1[2] = c1;
        p1[3] = d1;
        p2[0] = a2;
        p2[1] = b2;
        p2[2] = c2;
        p2[3] = d2;
        return pairing(p1, p2);
    }
}
contract Verifier {
    using Pairing for *;
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
    function verifyingKey() internal pure returns (VerifyingKey memory vk) {
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
            [5879449485104133375439190268665990774713978376322283852526005317341067184523,
             15148626661268834835137498763563491596716831379725224553377215972941260755910],
            [3899379981012192229937767226070599199157167103681209647884870152726487365845,
             4877377330548282584758347865001276030973602027252831903656655129868209687767]
        );
        vk.IC = new Pairing.G1Point[](55);
        
        vk.IC[0] = Pairing.G1Point( 
            604684489280411115230231979903538806159536768397652558588683657969891818181,
            8925017758974691561906832642462326651305693766116975977414347796422839822201
        );                                      
        
        vk.IC[1] = Pairing.G1Point( 
            3428049080929557217878431805566302577802455100731818636889896743107047820927,
            4086605425048052001900943038742658046982516719979456973183373623562046401566
        );                                      
        
        vk.IC[2] = Pairing.G1Point( 
            9980998918566050719379430365367877466363037827172204913199867677110563766698,
            17624337993793141869336476443946612784582154340835104567659267523248439254393
        );                                      
        
        vk.IC[3] = Pairing.G1Point( 
            6857813845565479044713609369209802715031207967099755908777718309191976770884,
            17502365093209521224950876113299990334616129032131804691502759099644222052743
        );                                      
        
        vk.IC[4] = Pairing.G1Point( 
            10286766963329244953200143816706963705021221976716307790921004640648152840063,
            4301301137210339722595635374359537142654250518125744537889192731711350091605
        );                                      
        
        vk.IC[5] = Pairing.G1Point( 
            4746637183975804180009824844936084460903069008223581639025875976722609304403,
            13040262452658850986263836890473439793138448404371853069125816143606428859371
        );                                      
        
        vk.IC[6] = Pairing.G1Point( 
            21660621816646755168748310998889937695709390960477767505657237296439768651807,
            14128597321875765406783105424528773427679541065699938579907118159218684871903
        );                                      
        
        vk.IC[7] = Pairing.G1Point( 
            6249249552116159159936921886322265567695465598289610988174987927504055239340,
            6135627775148030506710637613127414350166758797628948990235382459060658764921
        );                                      
        
        vk.IC[8] = Pairing.G1Point( 
            21808345144954286740668766720154080513642544028613625731160312744752938864899,
            3255509029270822506527360034271190432489958834712991689008477043390609286180
        );                                      
        
        vk.IC[9] = Pairing.G1Point( 
            2904040884674287579446951676895062810621206004459173190151675059477015400736,
            21329291953254707279790206530492568246096072387030951443289143281608330089439
        );                                      
        
        vk.IC[10] = Pairing.G1Point( 
            14474321708477543114715225347407063509813421752934551423470368422895794196346,
            15623451543381724919330882855837517811612357358733301855933415653303261565646
        );                                      
        
        vk.IC[11] = Pairing.G1Point( 
            8492118446927021311043229438643767697729943024206216039326479804211672940261,
            11745067155308648759688738035593676361000572655766211259599876974416885390425
        );                                      
        
        vk.IC[12] = Pairing.G1Point( 
            7999787313047068807521436518767216531612224509956560216837014762345703321270,
            10219244000404648836302310821285881223387496805375682744908878644238116681159
        );                                      
        
        vk.IC[13] = Pairing.G1Point( 
            3748117352175567673976653388084989325561678408502494144695270445395091651537,
            9694327506767311590003721588955251182946607408072817974313551436106624610509
        );                                      
        
        vk.IC[14] = Pairing.G1Point( 
            873213243116820524093815494692674216579265924591478647770454584022952349989,
            10836394314883480980923325656962412791814483869994128223127755388896615875246
        );                                      
        
        vk.IC[15] = Pairing.G1Point( 
            8372915912667859866041098981272287194343314783145890393803916228031116031444,
            12484892046144001978998976639603605623686700592453964597164134207020683266454
        );                                      
        
        vk.IC[16] = Pairing.G1Point( 
            19737008171335606348011076012452724088098493093720470004913090818745160829490,
            8266907720863621304008270067721724466468284206987089280437883525938210942190
        );                                      
        
        vk.IC[17] = Pairing.G1Point( 
            11448117248947945878965457888781983016993789088738435157513492870938802981967,
            372154170117645025082138097854932195058866880893691093393136642977528878400
        );                                      
        
        vk.IC[18] = Pairing.G1Point( 
            21730241931086134687182693664877865782641181996363928313354227518170666785326,
            2418714866873439441937709008330705736592107682978823805680040583390392006202
        );                                      
        
        vk.IC[19] = Pairing.G1Point( 
            2546056218234301760456701018813363852983079828058160437721754112736264190630,
            16932616698511567949052277822129607298531613904992067409662772545619247107751
        );                                      
        
        vk.IC[20] = Pairing.G1Point( 
            2726590904104708785494207349720829775973143068442184701964651577312715589264,
            2417196654200163615342776211873516445205705104366219806569434196789859311409
        );                                      
        
        vk.IC[21] = Pairing.G1Point( 
            12152825033637984105754687560939599424946265174514158451530926166644110247450,
            2602531389706591688669475730225465046847118911320300594626617771574931279007
        );                                      
        
        vk.IC[22] = Pairing.G1Point( 
            15114350837678083971992172671648482687365810854466620218065100654603726404548,
            10663194735764535992128767603559189496447380248128364653574551886183944217665
        );                                      
        
        vk.IC[23] = Pairing.G1Point( 
            4474381928714042471245870528279567295972264667354953138848570162356374319873,
            6064156706963702003774643706071797158858565795447872984649455795442780020751
        );                                      
        
        vk.IC[24] = Pairing.G1Point( 
            3465666864132322643026382550526950485946866224038140795529750294769477481531,
            13400034612249617429188903236814122301559825187384035186534872151754264337126
        );                                      
        
        vk.IC[25] = Pairing.G1Point( 
            1151966989921811310771242021136991121207651052082192253875293277820683712755,
            1533935477665572136719040567423371477287437153872095108071751558590791271483
        );                                      
        
        vk.IC[26] = Pairing.G1Point( 
            7305923704569441002622023658785866179548790736146407443215759445339361484123,
            6788804071218072092763268594290760534934104640153779342007993271974038818409
        );                                      
        
        vk.IC[27] = Pairing.G1Point( 
            4307376145071231704944686518572272077351408790205835485645394145531677095501,
            1719604983412855787261308130974714007468469113026820846602897237328094529298
        );                                      
        
        vk.IC[28] = Pairing.G1Point( 
            2721082052439805193443325768559618998170400163451561374322083934778014297972,
            3416349662100678219770725001892739957386315909514182728702587576110992750462
        );                                      
        
        vk.IC[29] = Pairing.G1Point( 
            10100411823944820769546097574466836823345276094476911599889093496444294899645,
            20234543192028818320693358123965022024805840284171432062667989598811939449957
        );                                      
        
        vk.IC[30] = Pairing.G1Point( 
            1009867874554299553475975305867435314027510383535039239934204038336731914944,
            6660642501580752238080804582899531168483805009251779274935287617695546408137
        );                                      
        
        vk.IC[31] = Pairing.G1Point( 
            5171673242681670629581300088866643545742376453260059869373386489918895444001,
            21375338472155729943783230820555926247756551589169213846648577211323502311764
        );                                      
        
        vk.IC[32] = Pairing.G1Point( 
            12013305160310345837298367456461211689779706972498353711366022478881978755931,
            1282354140751769873099344978525364920637889012327524587117277902069630441971
        );                                      
        
        vk.IC[33] = Pairing.G1Point( 
            2943107210180168915003130336766833235895741758705699168994552857422687231027,
            17679950782476524014281919986624865787744815878854336043783202514541366940079
        );                                      
        
        vk.IC[34] = Pairing.G1Point( 
            2601547728219788737928271441435167471071783898646181852079942190598413593722,
            12100368004397777996630467881924144538093471945453485314465069259175256116093
        );                                      
        
        vk.IC[35] = Pairing.G1Point( 
            14839052771714605326938506431568196460472225260808443996437820977711925667109,
            11788206471021297062828126468790873626319160343729538445695176183130369494374
        );                                      
        
        vk.IC[36] = Pairing.G1Point( 
            4823576165063484928049825941128183208048047562345092670989733319738223600823,
            6718951611851408800032316039869764318281855853501650108129506886839092188901
        );                                      
        
        vk.IC[37] = Pairing.G1Point( 
            17880363940133185931045885404635860552088718998018927461984351672508981542294,
            21088788713030398264758265361078929477054206275552195124767729923153949217112
        );                                      
        
        vk.IC[38] = Pairing.G1Point( 
            14670469748329021898393183635458046339292794461952011460631814123857869888840,
            10126959268591667980522728896712978043148252185056025515543315272886616899804
        );                                      
        
        vk.IC[39] = Pairing.G1Point( 
            4400084536973715318018432099548208576786300521151505354586792423513509569460,
            14962976390965674230671340109860684182246000092240515036811720585442700467719
        );                                      
        
        vk.IC[40] = Pairing.G1Point( 
            14802261356881434730799892423976521675898042173997675686266452138764893982329,
            129351277559177868725784464908583867140539958438765453270994346057590267274
        );                                      
        
        vk.IC[41] = Pairing.G1Point( 
            9455612081215434197418781480605882744391988402568431225188095792393463041223,
            154440907294968670891799805918125390422308078923645191520678887887976264505
        );                                      
        
        vk.IC[42] = Pairing.G1Point( 
            16869913248767826962126875535977213079158806855653027248476910789795273171067,
            19797614404704159400730801916135413097207140756211973834417078587726347122948
        );                                      
        
        vk.IC[43] = Pairing.G1Point( 
            18925600386403438906035469967913018793488603688187337124589400732056293716264,
            1665984597113491967204745306868686254726894484706016432592386121317617083465
        );                                      
        
        vk.IC[44] = Pairing.G1Point( 
            7976866543789032649419552023670701813801910207057626252786165648591724303561,
            14217885389688307580163453412362254829053708028587036771767799030029592002364
        );                                      
        
        vk.IC[45] = Pairing.G1Point( 
            5210893276477649855220930552237731514998594435300716916365386486228818558749,
            15233556442217587139202502229560104330286410117186368632653172955669847790529
        );                                      
        
        vk.IC[46] = Pairing.G1Point( 
            18009134421690080377063845411044959581818584673877993508940599116049087616716,
            12000529804768330437618217815602716770861794607162090483956151297939054932799
        );                                      
        
        vk.IC[47] = Pairing.G1Point( 
            11436248551529854907325381493233431328380122493755717400939245303013057569058,
            21376388094593569985821281260509553170909776050918918485957401544126455598685
        );                                      
        
        vk.IC[48] = Pairing.G1Point( 
            2338612771020060501662370923936702204541050873676259454072606870359315635743,
            1533126950319912666047041922469626979897762604998032397357665314191655699215
        );                                      
        
        vk.IC[49] = Pairing.G1Point( 
            6908053671079074834729708018190644254646294745742647838813699757448448780194,
            5522361338553561568326986724014571319566619519715760005743578536572974437653
        );                                      
        
        vk.IC[50] = Pairing.G1Point( 
            12428491993433092439626383089727058866003654701370963903736422578116221716827,
            14121310154481616557815900624715848895721239768163306081939465662557566940955
        );                                      
        
        vk.IC[51] = Pairing.G1Point( 
            5149777804823115737257889018909508534599335130610237031543051828836236197999,
            17826036512823799709592229415470453830592649376439924798835157730390799200752
        );                                      
        
        vk.IC[52] = Pairing.G1Point( 
            13441172463646003265128483255640834159175884149883483867186292635877249802308,
            3979949923376625091438327188986657994676236698647972409594255705076478548353
        );                                      
        
        vk.IC[53] = Pairing.G1Point( 
            5274582529010553447181483825545526909816921385845963153536316369843495090561,
            18584494450769698600415524733293429795994056464532135173582412008657301096335
        );                                      
        
        vk.IC[54] = Pairing.G1Point( 
            16319126406329446558705305636829406472300120835387962754071339375119383018539,
            7079848273405634255443742233400455350207427020092095220330965459104730868839
        );                                      
        
    }
    function verify(uint[] memory input, Proof memory proof) internal view returns (uint) {
        uint256 snark_scalar_field = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
        VerifyingKey memory vk = verifyingKey();
        require(input.length + 1 == vk.IC.length,"verifier-bad-input");
        // Compute the linear combination vk_x
        Pairing.G1Point memory vk_x = Pairing.G1Point(0, 0);
        for (uint i = 0; i < input.length; i++) {
            require(input[i] < snark_scalar_field,"verifier-gte-snark-scalar-field");
            vk_x = Pairing.addition(vk_x, Pairing.scalar_mul(vk.IC[i + 1], input[i]));
        }
        vk_x = Pairing.addition(vk_x, vk.IC[0]);
        if (!Pairing.pairingProd4(
            Pairing.negate(proof.A), proof.B,
            vk.alfa1, vk.beta2,
            vk_x, vk.gamma2,
            proof.C, vk.delta2
        )) return 1;
        return 0;
    }
    /// @return r  bool true if proof is valid
    function verifyProof(
            uint[2] memory a,
            uint[2][2] memory b,
            uint[2] memory c,
            uint[54] memory input
        ) public view returns (bool r) {
        Proof memory proof;
        proof.A = Pairing.G1Point(a[0], a[1]);
        proof.B = Pairing.G2Point([b[0][0], b[0][1]], [b[1][0], b[1][1]]);
        proof.C = Pairing.G1Point(c[0], c[1]);
        uint[] memory inputValues = new uint[](input.length);
        for(uint i = 0; i < input.length; i++){
            inputValues[i] = input[i];
        }
        if (verify(inputValues, proof) == 0) {
            return true;
        } else {
            return false;
        }
    }
}
