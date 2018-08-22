var CrowdfundingFactory = artifacts.require('CrowdfundingFactory')

contract('CrowdfundingFactory', function(accounts) {

    const owner = accounts[0]
    const alice = accounts[1]
    const bob = accounts[2]
    const emptyAddress = '0x0000000000000000000000000000000000000000'

    var multiplier = 10**2;
    const price = web3.toWei(5, "ether")

    it("should create campaign", async() => {
        const crowdfundingFactory = await CrowdfundingFactory.deployed()
        
        await crowdfundingFactory.createCampaign("Punk Marketing", 1000, 1534785300, 1540055700, 20, 24, {from: alice})
        await crowdfundingFactory.createCampaign("Punk Marketing 2", 1000, 1534785300, 1540055700, 20, 24, {from: bob})
        
        const count = await crowdfundingFactory.getCampaigns.call();
        const campaign = await crowdfundingFactory.getCampaign.call(2, {from: alice});

        assert.equal( 2, count.toNumber(), 'numCampaigns not ok')
        assert.equal( "Punk Marketing 2", campaign[0], 'name campaign not ok')
        assert.equal( 1000, campaign[2].toNumber()/multiplier, 'goal campaign not ok')
        assert.equal( bob, campaign[3], 'beneficiary campaign not ok')
    })

    it("should contribute to campaign", async() => {
        const crowdfundingFactory = await CrowdfundingFactory.deployed()
        
        await crowdfundingFactory.contribute(1, 1534785300, {from: owner, value: 100})
        await crowdfundingFactory.contribute(2, 1534785300, {from: alice, value: 100})
        await crowdfundingFactory.contribute(2, 1534785300, {from: owner, value: 100})
        await crowdfundingFactory.contribute(2, 1534785300, {from: alice, value: 100})

        const campaign = await crowdfundingFactory.getCampaign.call(2, {from: owner});
        const aliceInvestorID = await crowdfundingFactory.getInvestorID.call(2, alice, {from: alice});
        const ownerInvestorID = await crowdfundingFactory.getInvestorID.call(2, owner, {from: owner});
        const investor = await crowdfundingFactory.getInvestorInCampaign.call(1, 2, {from: alice});
        const ownerCampaigns = await crowdfundingFactory.getInvestorCampaigns.call({from: owner});
        const aliceCampaigns = await crowdfundingFactory.getInvestorCampaigns.call({from: alice});

        assert.equal( 300, campaign[1].toNumber()/multiplier, 'campaign amount not ok')
        assert.equal( 1, aliceInvestorID.toNumber(), 'alice investorID not ok')
        assert.equal( 2, ownerInvestorID.toNumber(), 'owner investorID not ok')
        assert.equal( alice, investor[0], 'investor address not ok')
        assert.equal( 200, investor[1].toNumber()/multiplier, 'investor amount not ok')
        assert.equal( 0, investor[2].toNumber(), 'investor balance not ok')
        assert.equal( 2, ownerCampaigns.length, 'owner campaigns not ok')
        assert.equal( 1, aliceCampaigns.length, 'alice campaigns not ok')
    })

    it("should terminate campaign", async() => {
        const crowdfundingFactory = await CrowdfundingFactory.deployed()
        
        await crowdfundingFactory.createCampaign("Punk Marketing 3", 100, 1534785300, 1540055700, 10, 24, {from: alice})
        await crowdfundingFactory.contribute(3, 1534785300, {from: owner, value: 70})
        await crowdfundingFactory.contribute(3, 1534785300, {from: bob, value: 30})
        await crowdfundingFactory.goalReached(3, 1534785300, 1537660799, {from: owner})

        var campaign = await crowdfundingFactory.getCampaign.call(3, {from: owner});
      
        assert.equal( 100, campaign[2].toNumber()/multiplier, 'goal amount not ok')
        assert.equal( 10, campaign[5].toNumber(), 'rate amount not ok')
        assert.equal( 110, campaign[8].toNumber()/multiplier, 'debt amount not ok')
        assert.equal( 1, campaign[7].toNumber(), 'status not ok')

        await crowdfundingFactory.payDebt(3, 1534785300, {from: alice, value: 100})
        await crowdfundingFactory.payDebt(3, 1534785300, {from: alice, value: 10})

        const debt = await crowdfundingFactory.getDebt.call(3, {from: alice});
        const investorOwner = await crowdfundingFactory.getInvestorInCampaign.call(1, 3, {from: owner});
        const investorBob = await crowdfundingFactory.getInvestorInCampaign.call(2, 3, {from: bob});

        campaign = await crowdfundingFactory.getCampaign.call(3, {from: owner});

        assert.equal( 0, debt.toNumber()/multiplier, 'debt amount not ok')
        assert.equal( 77, investorOwner[2].toNumber()/multiplier, 'inevstor balance amount not ok')
        assert.equal( 33, investorBob[2].toNumber()/multiplier, 'inevstor balance amount not ok')
        assert.equal( 2, campaign[7].toNumber(), 'status not ok')
    })

    it("should fail campaign", async() => {
        const crowdfundingFactory = await CrowdfundingFactory.deployed()
        
        var investorOwner = await crowdfundingFactory.getInvestorInCampaign.call(1, 1, {from: owner});

        assert.equal( 0, investorOwner[2].toNumber()/multiplier, 'balance amount not ok')

        await crowdfundingFactory.failCampaign(1, 1540055800, {from: owner})

        const campaign = await crowdfundingFactory.getCampaign.call(1, {from: owner});
        investorOwner = await crowdfundingFactory.getInvestorInCampaign.call(1, 1, {from: owner});

        assert.equal( 100, investorOwner[2].toNumber()/multiplier, 'balance amount not ok')
        assert.equal( 3, campaign[7].toNumber(), 'status not ok')
    })

    it("should claim share", async() => {
        const crowdfundingFactory = await CrowdfundingFactory.deployed()

        var investorBob = await crowdfundingFactory.getInvestorInCampaign.call(2, 3, {from: bob});

        assert.equal( 33, investorBob[2].toNumber()/multiplier, 'balance amount not ok')
        
        await crowdfundingFactory.claimShare(3, {from: bob});

        investorBob = await crowdfundingFactory.getInvestorInCampaign.call(2, 3, {from: bob});

        assert.equal( 0, investorBob[2].toNumber()/multiplier, 'balance amount not ok')
    })

    it("should claim refund", async() => {
        const crowdfundingFactory = await CrowdfundingFactory.deployed()

        var investorOwner = await crowdfundingFactory.getInvestorInCampaign.call(1, 1, {from: owner});

        assert.equal( 100, investorOwner[2].toNumber()/multiplier, 'balance amount not ok')
        
        await crowdfundingFactory.claimRefund(1, {from: owner});

        investorOwner = await crowdfundingFactory.getInvestorInCampaign.call(1, 1, {from: owner});

        assert.equal( 0, investorOwner[2].toNumber()/multiplier, 'balance amount not ok')
    })

    it("test ether", async() => {
        const crowdfundingFactory = await CrowdfundingFactory.deployed()
        
        await crowdfundingFactory.createCampaign("Punk Marketing", price, 1534785300, 1540055700, 20, 24, {from: alice})
        await crowdfundingFactory.contribute(4, 1534785300, {from: owner, value: price})
        await crowdfundingFactory.goalReached(4, 1534785300, 1537660799, {from: owner})
        await crowdfundingFactory.payDebt(4, 1534785300, {from: alice, value: 6000000000000000000})
        await crowdfundingFactory.claimShare(4, {from: owner});
    })
});
