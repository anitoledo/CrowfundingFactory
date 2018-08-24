// var CrowdfundingFactory = artifacts.require("./CrowdfundingFactory.sol");

// contract('CrowdfundingFactory', function(accounts) {
//     const owner = accounts[0]
//     const alice = accounts[1];
//     const bob = accounts[2];

//     it("testCreateCampaign", async () => {
//         const cf = await CrowdfundingFactory.deployed();

//         await cf.createCampaign("Punk Marketing",
//             1000,
//             1534785300,
//             1540055700,
//             20,
//             24,
//             {from: owner});

//         await cf.createCampaign("Plaza la Isla",
//             40,
//             1534785300,
//             1540055700,
//             20,
//             10,
//             {from: owner});
//         //const campaigns = bank.campaigns({from})
//         //assert.equal("Punk Marketing", name.toString(), 'enroll balance is incorrect, check balance method or constructor');
        
//         const  numCampaigns = await cf.getCampaigns({from:owner})
//         assert.equal(2, numCampaigns.toNumber(), 'Numero de campañas equivocado');
//         const campaign = await cf.getCampaign(2,{from:owner})

//         assert.equal("Plaza la Isla", campaign[0], 'Nombre incorrecto')
//         assert.equal(40, campaign[2], 'Goal incorrecto')
//         assert.equal(owner, campaign[3], 'Beneficiario incorrecto')
//         assert.equal(0, campaign[4], 'Debt incorrecto')
//         await cf.contribute(2,1534785300,{from:alice, value:10})
//         await cf.contribute(2,1534785300,{from:alice, value:10})
//         await cf.contribute(2,1534785300,{from:owner, value:10})
//         await cf.contribute(2,1534785300,{from:owner, value:10})
//         await cf.contribute(1,1534785300,{from:owner, value:10})


//         const campaign2 = await cf.getCampaign(2,{from:alice})

//         const investorId = await cf.getInvestorID(2,alice,{from:owner})

//         const investor = await cf.getInvestor(1,2,{from:owner})

//         const investorCampaigns = await cf.getInvestorCampaigns.call({from:owner})

        
//         await cf.goalReached(2,1534785300,{from:owner})

//         const campaign2_1 = await cf.getCampaign(2,{from:alice})

//         assert.equal(40, campaign2[1].toNumber(), 'Amount no depositado ')
//         assert.equal(alice,investor[0], "Adress no encontrado")
//         assert.equal(20,investor[1].toNumber(), "Amount incorrecto")
//         assert.equal(0,investor[2].toNumber(), "Balance incorrecto")
//         assert.equal(2,investorCampaigns.length, "Lenght no encontrado")

//         assert.equal(2,campaign2_1[4].toNumber(), "Debt incorrecto")



//     });






// });