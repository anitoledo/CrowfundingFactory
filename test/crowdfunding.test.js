var CrowdfundingFactory = artifacts.require('CrowdfundingFactory')

contract('CrowdfundingFactory', function(accounts) {

    const owner = accounts[0]
    const alice = accounts[1]
    const bob = accounts[2]

    const price = web3.toWei(5, "ether")
    var multiplier = 10**2;


    it("should create campaign", async() => {
        const crowdfundingFactory = await CrowdfundingFactory.deployed()
        
        await crowdfundingFactory.createCampaign("Punk Marketing 1", "https://via.placeholder.com/350x150", 1000, 1566432000000, 10, 24, {from: alice})
        await crowdfundingFactory.createCampaign("Punk Marketing 2", "https://via.placeholder.com/350x150", 1000, 1566432000000, 10, 24, {from: bob})
        
        const campaign_1 = await crowdfundingFactory.campaigns.call(1);
        const campaign_2 = await crowdfundingFactory.campaigns.call(2);

        assert.equal( campaign_1[0], "Punk Marketing 1", 'numCampaigns not ok')
        assert.equal( campaign_2[0], "Punk Marketing 2", 'name campaign not ok')
    })

    it("should contribute to campaign", async() => {
        const crowdfundingFactory = await CrowdfundingFactory.deployed()
        
        await crowdfundingFactory.contribute(1, {from: alice, value: 100})
        await crowdfundingFactory.contribute(1, {from: alice, value: 100})
        await crowdfundingFactory.contribute(1, {from: owner, value: 100})
        await crowdfundingFactory.contribute(2, {from: owner, value: 100})

        const campaign_1 = await crowdfundingFactory.campaigns.call(1);
        const campaign_2 = await crowdfundingFactory.campaigns.call(2);

        const aliceInvestorID_1 = await crowdfundingFactory.getInvestorID.call(1, {from: alice});
        const ownerInvestorID_1 = await crowdfundingFactory.getInvestorID.call(1, {from: owner});
        const ownerInvestorID_2 = await crowdfundingFactory.getInvestorID.call(2, {from: owner});

        assert.equal( aliceInvestorID_1.toNumber(), 1, 'investor id not ok')
        assert.equal( ownerInvestorID_1.toNumber(), 2, 'investor id not ok')
        assert.equal( ownerInvestorID_2.toNumber(), 1, 'investor id not ok')

        const investorAlice_1 = await crowdfundingFactory.getInvestorInCampaign.call(aliceInvestorID_1, 1);
        const investorOwner_1 = await crowdfundingFactory.getInvestorInCampaign.call(ownerInvestorID_1, 1);
        const investorOwner_2 = await crowdfundingFactory.getInvestorInCampaign.call(ownerInvestorID_2, 2);

        assert.equal( campaign_1[2].toNumber()/multiplier, 300, 'campaign amount not ok')
        assert.equal( campaign_2[2].toNumber()/multiplier, 100, 'campaign amount not ok')
        assert.equal( investorAlice_1[1].toNumber()/multiplier, 200, 'investor amount not ok')
        assert.equal( investorOwner_1[1].toNumber()/multiplier, 100, 'investor amount not ok')
        assert.equal( investorOwner_2[1].toNumber()/multiplier, 100, 'investor amount not ok')
    })

    it("should terminate campaign", async() => {
        const crowdfundingFactory = await CrowdfundingFactory.deployed()
        
        await crowdfundingFactory.contribute(1, {from: alice, value: 700})
        await crowdfundingFactory.goalReached(1, {from: alice})

        var campaign_1 = await crowdfundingFactory.campaigns.call(1);

        assert.equal( campaign_1[9].toNumber(), 1, 'status not ok')
        assert.equal( campaign_1[10].toNumber()/multiplier, 1100, 'debt amount not ok')

        await crowdfundingFactory.payDebt(1, {from: alice, value: 1100})

        campaign_1 = await crowdfundingFactory.campaigns.call(1);
        const aliceInvestorID_1 = await crowdfundingFactory.getInvestorID.call(1, {from: alice});
        const ownerInvestorID_1 = await crowdfundingFactory.getInvestorID.call(1, {from: owner});
        const investorAlice_1 = await crowdfundingFactory.getInvestorInCampaign.call(aliceInvestorID_1, 1);
        const investorOwner_1 = await crowdfundingFactory.getInvestorInCampaign.call(ownerInvestorID_1, 1);

        assert.equal( campaign_1[10].toNumber()/multiplier, 0, 'debt amount not ok')
        assert.equal( investorAlice_1[2].toNumber()/multiplier, 990, 'investor balance amount not ok')
        assert.equal( investorOwner_1[2].toNumber()/multiplier, 110, 'investor balance amount not ok')
        assert.equal( campaign_1[9].toNumber(), 2, 'status not ok')
    })

    it("should claim share", async() => {
        const crowdfundingFactory = await CrowdfundingFactory.deployed()

        const aliceInvestorID_1 = await crowdfundingFactory.getInvestorID.call(1, {from: alice});
        var investorAlice_1 = await crowdfundingFactory.getInvestorInCampaign.call(aliceInvestorID_1, 1);

        await crowdfundingFactory.claimShare(1, {from: alice});

        investorAlice_1 = await crowdfundingFactory.getInvestorInCampaign.call(aliceInvestorID_1, 1);

        assert.equal( investorAlice_1[2].toNumber()/multiplier, 0, 'investor balance amount not ok')
    })

    it("test ether", async() => {
        const crowdfundingFactory = await CrowdfundingFactory.deployed()
        
        await crowdfundingFactory.createCampaign("Punk Marketing", "https://via.placeholder.com/350x150", price, 1566432000000, 20, 24, {from: alice})
        await crowdfundingFactory.contribute(3, {from: alice, value: price})
        await crowdfundingFactory.goalReached(3, {from: alice})
        await crowdfundingFactory.payDebt(3, {from: alice, value: 6000000000000000000})
        await crowdfundingFactory.claimShare(3, {from: alice});
    })

    it("should withdraw emergency money", async() => {
        const crowdfundingFactory = await CrowdfundingFactory.deployed()
        
        
    })
});
