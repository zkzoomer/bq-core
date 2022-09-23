/* const { ethers, artifacts } = require("hardhat");
const Test = artifacts.require('Test')
const TestAlt = artifacts.require('TestAlt')
const TestMixed = artifacts.require('TestMixed')
fs = require('fs');

const openProofA = require("./proof/open/openProofA.json")
const openPublicA = require("./proof/open/openPublicA.json")
const mixedProofA = require("./proof/mixed/mixedProofA.json")
const mixedPublicA = require("./proof/mixed/mixedPublicA.json") */

/* contract('TestMixed', function (accounts) {
    beforeEach(async function () {
        [account] = await ethers.getSigners();

        this.contract = await TestMixed.new()
    })

    it('works', async function() {
        const input = ['16973889000015293487966708368167707797626490545936897578277798115484565729425', '20615233611311727935788443605133564114685709374565347788401719291804090988088', '9611706360440814874710938477142903959364090817126762187910948200796891676221']

        const wegood = await this.contract.verifyProof(
            [mixedProofA.pi_a[0], mixedProofA.pi_a[1]],
            [[mixedProofA.pi_b[0][1], mixedProofA.pi_b[0][0]], [mixedProofA.pi_b[1][1], mixedProofA.pi_b[1][0]]],
            [mixedProofA.pi_c[0], mixedProofA.pi_c[1]],
            mixedPublicA[0],
            mixedPublicA[1],
            mixedPublicA[2],
            mixedPublicA[3],
            input
        )

        var constructor = ''
        
        for (var i = 0; i < 48; i++) {
            const empty = await this.contract.emptyAnswersSum(i);
            constructor += 'emptyAnswersSum[' + i + '] = Pairing.G1Point(\n\t' + empty.X.toString() + ',\n\t' + empty.Y.toString() + '\n);\n'
        }

        console.log(constructor)

        console.log(wegood)
    })
}) */

/* contract('Test', function (accounts) {

    beforeEach(async function () {
        [account] = await ethers.getSigners();

        this.contract = await TestAlt.new()
    })

    it('works', async function () {
        const a = ['3520605333384784228013010058464005616631026246164018984979663355853634817827', '1965339673848559040611335025679006562077415084995897802702034624568202944555'];
        const b = [[ '13137695091368336709955753010117647330740438111539019446625070769214843925039', '1968107549415546715132567167524273704376847436119797365918362220350671896010' ], ['5422852368814322229945843043926155493470912101762585810866302783318858735721', '2446652334562255428617450663883215010842303525135216884233962189879149269202']];
        const c = ['19934434305544076944747548499634346164549558395329656503261173547951689367992', '13957107468264194791857319031821526542702341138044590073948622763181636967960'];
        const result = 50;
        const salt = 110;
        const input = ['16973889000015293487966708368167707797626490545936897578277798115484565729425', '20615233611311727935788443605133564114685709374565347788401719291804090988088', '9611706360440814874710938477142903959364090817126762187910948200796891676221']
    
        const wegood = await this.contract.verifyProof(
            [openProofA.pi_a[0], openProofA.pi_a[1]],
            [[openProofA.pi_b[0][1], openProofA.pi_b[0][0]], [openProofA.pi_b[1][1], openProofA.pi_b[1][0]]],
            [openProofA.pi_c[0], openProofA.pi_c[1]],
            openPublicA[0],
            openPublicA[1],
            input
        )

        var constructor = ''
        
        for (var i = 0; i < 48; i++) {
            const empty = await this.contract.emptyAnswersSum(i);
            constructor += 'emptyAnswersSum[' + i + '] = Pairing.G1Point(\n\t' + empty.X.toString() + ',\n\t' + empty.Y.toString() + '\n);\n'
        }

        console.log(constructor)
        console.log(wegood)
    })
}) */