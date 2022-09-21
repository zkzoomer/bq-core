// SPDX-License-Identifier: GPL-3.0
// Generated using circom - https://github.com/iden3/circom
pragma solidity ^0.8.0;

import "./Pairing.sol";

contract OpenAnswerVerifier {
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
            [1486569076915119473867399018195216817271978814273513296899114506727666207755,
             18983861466567016674592815478122627032666465512408493867077864475931133379663],
            [2898901203375226252505636154407458906258421979342514633192459341076144278603,
             5341036346386301455874744522316229146964416556770042149674242907674119601507]
        );
        vk.IC = new Pairing.G1Point[](53);
        
        vk.IC[0] = Pairing.G1Point( 
            17184534921340409181114449646534424398685580925816367734163462037943592138176,
            10167885351173690457370686122774854687261466809170531824019171651391861238878
        );                                      
        
        vk.IC[1] = Pairing.G1Point( 
            4440649950238292807986300145825162293681852494093872718747388127086156231675,
            14106865015667717914112480370990451246437570148846904716958156130499627844777
        );                                      
        
        vk.IC[2] = Pairing.G1Point( 
            6213535823230384802461253114610857575841819960983537908341038978642292459090,
            18556738813095041583226610857293739677764386986888193334312996384132618175388
        );                                      
        
        vk.IC[3] = Pairing.G1Point( 
            13712052988298587215916783341339112589908593272090531275684584558997776907289,
            1959903134413184913697606543325656504294661615220855591523842179173442135279
        );                                      
        
        vk.IC[4] = Pairing.G1Point( 
            3533174363403103365469472618419761479932149237721172604288700560096260782869,
            1553330041243459735815310924389021026598474941678466324485256217765247876205
        );                                      
        
        vk.IC[5] = Pairing.G1Point( 
            9278691556984401748219111324066505209660523358415804669866115379119863010236,
            4151211517587083772047361417371960026911205889672262556440099877685935270614
        );                                      
        
        vk.IC[6] = Pairing.G1Point( 
            301436993648971109799533321877120601901816290870333280634205458155812248207,
            16192308855549625840819255751908139819937057828268773385037499400678656868022
        );                                      
        
        vk.IC[7] = Pairing.G1Point( 
            9897242820456196931414052740863889137701459670740922852935930794612423503294,
            21748297670925274328931003368619891022286405048588219863406622146767331790510
        );                                      
        
        vk.IC[8] = Pairing.G1Point( 
            7374246540923196234659075227156385710789871506643292622313199412950393740908,
            11743170339883177601165488842406817648092282485043982206813902145997952832556
        );                                      
        
        vk.IC[9] = Pairing.G1Point( 
            4816007953405982233984989510542795556439230931848889701102565934522838296759,
            9739263504724692154455614100323068242189305179515506421383491153870172827868
        );                                      
        
        vk.IC[10] = Pairing.G1Point( 
            1169379666837431215985145930524181882048345620143849655114360737195395123712,
            1792581031148846857239033860924994671760568156098886203919379178566193346714
        );                                      
        
        vk.IC[11] = Pairing.G1Point( 
            12438906611317891023646723115544051755315467817290871177323228484169630307122,
            13363434247072283020089477935054243358285507692686866075028093895687040198612
        );                                      
        
        vk.IC[12] = Pairing.G1Point( 
            4821153645768242029646151486137762360471092770081796945666839899250815706101,
            6612175943949397056707404910664606019444930054940126295116776940225144221613
        );                                      
        
        vk.IC[13] = Pairing.G1Point( 
            17603781136413509611842978607157726835594100301830135864106593972669606608494,
            4043878243913271291640288707823452424511356024820790498041078140135241156046
        );                                      
        
        vk.IC[14] = Pairing.G1Point( 
            19186407243795822923748150130556740680937910480991952540883851050412692602727,
            3371069188752396418051011845674653375526729954352312326685466299048454557305
        );                                      
        
        vk.IC[15] = Pairing.G1Point( 
            16060864964859866494920885288750956263424932904777426001149082836063137457351,
            12577018238384499719522728587576220752007240081886495264590576798524738573929
        );                                      
        
        vk.IC[16] = Pairing.G1Point( 
            13691784628922009672837810992318839073602279026773169386382943851625658665008,
            5190589143527346135682758059552373922820694324695243435361017756435388453694
        );                                      
        
        vk.IC[17] = Pairing.G1Point( 
            18873765492911113290988216659765090033743631339836788743192535133991930421127,
            17945406734822662266866137007144190072776455852280101570019589657499546649270
        );                                      
        
        vk.IC[18] = Pairing.G1Point( 
            12878964943863853705049283979170835106343747331936261635223647856004467662477,
            3178440394004169252360747262170645833074937029925334814786307837085514827465
        );                                      
        
        vk.IC[19] = Pairing.G1Point( 
            14818509606185176740590323235821915872691620942763985906233278078364456275878,
            21375515133883596625835097565297719294974079318670540175266069114483791281602
        );                                      
        
        vk.IC[20] = Pairing.G1Point( 
            19644317893684323072006292596706416099334300466813072599634238629006687986355,
            17587166487691878635156514635166984019203525946846542616572644735062348701046
        );                                      
        
        vk.IC[21] = Pairing.G1Point( 
            13040959695463024647678227697603572309418496399233160701523721282604558696344,
            4063467494676424798855350102144040545975294287947329318183566874464082814337
        );                                      
        
        vk.IC[22] = Pairing.G1Point( 
            3083327576019679437439883830726351601877045899088602550137948535033737886315,
            2614715572949940542730126023796035957319910299424532410954313948833328212548
        );                                      
        
        vk.IC[23] = Pairing.G1Point( 
            1770264637936522564282383496306839538461625755891750224639021800040887725752,
            10556284359621890591403940565907349713955263103295632882627589172937358261810
        );                                      
        
        vk.IC[24] = Pairing.G1Point( 
            6469960083863971116567437713656755583310841628101256428753088669270467941507,
            4483545461090216922031594723989051573847996153006607900468352178865220197734
        );                                      
        
        vk.IC[25] = Pairing.G1Point( 
            20486160143001195708931718663825001479327649835811477203296837533652804793439,
            19209385091293533462934657237417997652015901350874924566038910511347846914468
        );                                      
        
        vk.IC[26] = Pairing.G1Point( 
            15024510282688627701881405883941491840010498949931250081583692736639442845316,
            2783639443572922457587598470516406962964660864093496992150319218786291521430
        );                                      
        
        vk.IC[27] = Pairing.G1Point( 
            2265769611123672626329098567154060682377754131802189689029272981065960311933,
            7910311115976322888141987554453156735756619153659745878063150279545953784947
        );                                      
        
        vk.IC[28] = Pairing.G1Point( 
            5712139390982839411026006061003811342368723821880997407428464081828738905511,
            1486093255542197932515400993229877756625191658460117088630017697008531798074
        );                                      
        
        vk.IC[29] = Pairing.G1Point( 
            2816295949643389165731135304410920463429535900026561614292083001674530450001,
            3929014073453990048964392064768697247357340991904986537977034908106932795265
        );                                      
        
        vk.IC[30] = Pairing.G1Point( 
            13884228219546326065799624771179846223511441408703332513350267697104163706180,
            1670298105361234267403852451736258715940975834999379394384959637366486391706
        );                                      
        
        vk.IC[31] = Pairing.G1Point( 
            9931998187755558095273697358483393553484694080269362244333293362859365572526,
            1507089334314541249839674884931313440468827761340923316492307229475002031844
        );                                      
        
        vk.IC[32] = Pairing.G1Point( 
            2902400159630709470415190619229423494257033685710334217621970101759269306577,
            901174927798421465081321042106676787644719027216917912902848316888965766831
        );                                      
        
        vk.IC[33] = Pairing.G1Point( 
            10755787377471626638286074099607295584060598921866615127428743041252604219505,
            1863986916529588281262080211524518360415162204279418980561909144675893615623
        );                                      
        
        vk.IC[34] = Pairing.G1Point( 
            824482469778275648358672543689284536976138725308647501528819137245885198566,
            13108604500804266191712024009869470441033760946776322422057706828339149961762
        );                                      
        
        vk.IC[35] = Pairing.G1Point( 
            18688938519754613474752451318314559917711054206501615458395765786548924475251,
            5567161432570485716776339978918987207398214398550948730006138580754271263225
        );                                      
        
        vk.IC[36] = Pairing.G1Point( 
            3584343339444731087454452985630235918726686615763793610720544251957828819799,
            5563718686416845463587139780250952847123638239872847248185678344908366934357
        );                                      
        
        vk.IC[37] = Pairing.G1Point( 
            4535475011744387146311750553498744269006642670939168098911477627668225019150,
            21237593805033187837432801414882776417675025239930057117407248190969664966112
        );                                      
        
        vk.IC[38] = Pairing.G1Point( 
            12277025073715527610975556881648203787937224582236526445523919905124760793007,
            11749516139972178765003873754280356563133410326374011932922735614261988569415
        );                                      
        
        vk.IC[39] = Pairing.G1Point( 
            20040274610001364391559383439349894203555404198465124390927537642809949845062,
            20205984640316710745590971379492661692978909998055854329455711483421698369281
        );                                      
        
        vk.IC[40] = Pairing.G1Point( 
            8249048031964776923369464984839365709073007262818160443859384648768097487296,
            1861212254776820776802089041556819908506779675274148653525833047556298030977
        );                                      
        
        vk.IC[41] = Pairing.G1Point( 
            8800403682225387391314287024395164130807837184275252521810286806321157448144,
            16228734990743755200550444354364025090350504144132925414984901378318614262707
        );                                      
        
        vk.IC[42] = Pairing.G1Point( 
            17694501635855774874577067773375912429264546428730864004395389936068690354444,
            1524978985742191599484167425473479098584789212309755786470765799225661477853
        );                                      
        
        vk.IC[43] = Pairing.G1Point( 
            16724929499128491996057262040297806386863607631270743487809616916149960084687,
            2693525032336215221504827400696190719702573594001780866564973430688332517126
        );                                      
        
        vk.IC[44] = Pairing.G1Point( 
            10141113707709072769525705752983466560352005955167936535430764227673686656280,
            5492941939939671560810832597057418270137296438020674476249577535827345188074
        );                                      
        
        vk.IC[45] = Pairing.G1Point( 
            6753163586395172863686268387327175762251132321432856752422533208564720281432,
            18835184817207277131575855549262634769854251200465159826181706067440841301109
        );                                      
        
        vk.IC[46] = Pairing.G1Point( 
            17042378945361482626369719275258158973432109883153901215813464004599267052579,
            19945935711655791783724495161888387081408499501688597724350957628969142355788
        );                                      
        
        vk.IC[47] = Pairing.G1Point( 
            14513266388513044901531551742900785130053943344996105594902864633212576997889,
            7811734196428461866914289089511544061841910829924310732329377584209789024527
        );                                      
        
        vk.IC[48] = Pairing.G1Point( 
            8880297922931401141885498921838772971849959055911850709239537559930537500357,
            16109280331501759089462580801316254558644905630519661733423341488678895978984
        );                                      
        
        vk.IC[49] = Pairing.G1Point( 
            17836813010919825230257108049609975785349553430560261903258108725395136578618,
            16018265793854332034546161088141652010554776951490440847338188236985108868344
        );                                      
        
        vk.IC[50] = Pairing.G1Point( 
            15128735186557710614655134492677837939734175709696656499157014027443554067328,
            19412592099529774737925446124344885347778500485085965044604584312408342990515
        );                                      
        
        vk.IC[51] = Pairing.G1Point( 
            13259884505545473243576444863387775579733165316191798480129911368636198410595,
            16406551298882305905354330257028057481260671097632944898525837762063957720859
        );
        
        vk.IC[52] = Pairing.G1Point( 
            4928537417727684234693943307170515317519172766319755793662121602533402416917,
            448615011629093935114927933103471248511457066544084990506306201193030999433
        );
        
    }
    function verify(
        uint result,
        uint[] memory input, 
        uint salt,
        Proof memory proof
    ) internal view returns (uint) {
        uint256 snark_scalar_field = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
        uint256 default_hash = 15083001670805533818279519394606955016606512029788045584851323712461001330117;  // = Poseidon(keccak256(""))
        VerifyingKey memory vk = verifyingKey();
        require(input.length <= 50, "verifier-bad-input");
        // Compute the linear combination vk_x
        Pairing.G1Point memory vk_x = Pairing.G1Point(0, 0);

        require(result < snark_scalar_field,"verifier-gte-snark-scalar-field");
        vk_x = Pairing.addition(vk_x, Pairing.scalar_mul(vk.IC[1], result));
        for (uint i = 0; i < input.length; i++) {
            require(input[i] < snark_scalar_field,"verifier-gte-snark-scalar-field");
            vk_x = Pairing.addition(vk_x, Pairing.scalar_mul(vk.IC[i + 2], input[i]));
        }
        for (uint i = input.length; i < 50; i++) {
            vk_x = Pairing.addition(vk_x, Pairing.scalar_mul(vk.IC[i + 2], default_hash));
        }
        require(salt < snark_scalar_field,"verifier-gte-snark-scalar-field");
        vk_x = Pairing.addition(vk_x, Pairing.scalar_mul(vk.IC[52], salt));

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
            uint[2] calldata a,
            uint[2][2] calldata b,
            uint[2] calldata c,
            uint result, 
            uint salt,
            uint[] memory input
        ) public view returns (bool r) {
        Proof memory proof;
        proof.A = Pairing.G1Point(a[0], a[1]);
        proof.B = Pairing.G2Point([b[0][0], b[0][1]], [b[1][0], b[1][1]]);
        proof.C = Pairing.G1Point(c[0], c[1]);
        uint[] memory inputValues = new uint[](input.length);
        for(uint i = 0; i < input.length; i++){
            inputValues[i] = input[i];
        }
        if (verify(result, input, salt, proof) == 0) {
            return true;
        } else {
            return false;
        }
    }
}
