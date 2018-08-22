var CrowdfundingFactory = artifacts.require('CrowdfundingFactory')

contract('CrowdfundingFactory', function(accounts) {

    const owner = accounts[0]
    const alice = accounts[1]
    const bob = accounts[2]
    const emptyAddress = '0x0000000000000000000000000000000000000000'

    var sku
    const price = web3.toWei(1, "ether")

    it("should create campaign", async() => {
        const crowdfundingFactory = await CrowdfundingFactory.deployed()
        
        await crowdfundingFactory.createCampaign("Punk Marketing", 1000, 1534785300, 1540055700, 20, 24, {from: alice})
        await crowdfundingFactory.createCampaign("Punk Marketing 2", 1000, 1534785300, 1540055700, 20, 24, {from: bob})
        
        const count = await crowdfundingFactory.getCampaigns.call();
        const campaign = await crowdfundingFactory.getCampaign.call(2, {from: alice});

        assert.equal( 2, count.toNumber(), 'numCampaigns not ok')
        assert.equal( "Punk Marketing 2", campaign[0], 'name campaign not ok')
        assert.equal( 1000, campaign[2].toNumber()/1000, 'goal campaign not ok')
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
        const investor = await crowdfundingFactory.getInvestor.call(1, 2, {from: alice});
        const ownerCampaigns = await crowdfundingFactory.getInvestorCampaigns.call({from: owner});
        const aliceCampaigns = await crowdfundingFactory.getInvestorCampaigns.call({from: alice});

        assert.equal( 300, campaign[1].toNumber()/1000, 'campaign amount not ok')
        assert.equal( 1, aliceInvestorID.toNumber(), 'alice investorID not ok')
        assert.equal( 2, ownerInvestorID.toNumber(), 'owner investorID not ok')
        assert.equal( alice, investor[0], 'investor address not ok')
        assert.equal( 200, investor[1].toNumber()/1000, 'investor amount not ok')
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
      
        assert.equal( 100, campaign[2].toNumber()/1000, 'goal amount not ok')
        assert.equal( 10, campaign[5].toNumber(), 'rate amount not ok')
        assert.equal( 110, campaign[8].toNumber()/1000, 'debt amount not ok')
        assert.equal( 1, campaign[7].toNumber(), 'status not ok')

        await crowdfundingFactory.payDebt(3, 1534785300, {from: alice, value: 100})
        await crowdfundingFactory.payDebt(3, 1534785300, {from: alice, value: 10})

        const debt = await crowdfundingFactory.getDebt.call(3, {from: alice});
        const investorOwner = await crowdfundingFactory.getInvestor.call(1, 3, {from: owner});
        const investorBob = await crowdfundingFactory.getInvestor.call(2, 3, {from: bob});

        campaign = await crowdfundingFactory.getCampaign.call(3, {from: owner});

        assert.equal( 0, debt.toNumber()/1000, 'debt amount not ok')
        assert.equal( 77, investorOwner[2].toNumber()/1000, 'inevstor balance amount not ok')
        assert.equal( 33, investorBob[2].toNumber()/1000, 'inevstor balance amount not ok')
        assert.equal( 2, campaign[7].toNumber(), 'status not ok')
    })

    // it("should allow someone to purchase an item", async() => {
    //     const supplyChain = await SupplyChain.deployed()

    //     var eventEmitted = false

    //     var event = supplyChain.Sold()
    //     await event.watch((err, res) => {
    //         sku = res.args.sku.toString(10)
    //         eventEmitted = true
    //     })

    //     const amount = web3.toWei(2, "ether")

    //     var aliceBalanceBefore = await web3.eth.getBalance(alice).toNumber()
    //     var bobBalanceBefore = await web3.eth.getBalance(bob).toNumber()

    //     await supplyChain.buyItem(sku, {from: bob, value: amount})

    //     var aliceBalanceAfter = await web3.eth.getBalance(alice).toNumber()
    //     var bobBalanceAfter = await web3.eth.getBalance(bob).toNumber()

    //     const result = await supplyChain.fetchItem.call(sku)

    //     assert.equal(result[3].toString(10), 1, 'the state of the item should be "Sold", which should be declared second in the State Enum')
    //     assert.equal(result[5], bob, 'the buyer address should be set bob when he purchases an item')
    //     assert.equal(eventEmitted, true, 'adding an item should emit a Sold event')
    //     assert.equal(aliceBalanceAfter, aliceBalanceBefore + parseInt(price, 10), "alice's balance should be increased by the price of the item")
    //     assert.isBelow(bobBalanceAfter, bobBalanceBefore - price, "bob's balance should be reduced by more than the price of the item (including gas costs)")
    // })

    // it("should allow the seller to mark the item as shipped", async() => {
    //     const supplyChain = await SupplyChain.deployed()

    //     var eventEmitted = false

    //     var event = supplyChain.Shipped()
    //     await event.watch((err, res) => {
    //         sku = res.args.sku.toString(10)
    //         eventEmitted = true
    //     })

    //     await supplyChain.shipItem(sku, {from: alice})

    //     const result = await supplyChain.fetchItem.call(sku)

    //     assert.equal(eventEmitted, true, 'adding an item should emit a Shipped event')
    //     assert.equal(result[3].toString(10), 2, 'the state of the item should be "Shipped", which should be declared third in the State Enum')
    // })

    // it("should allow the buyer to mark the item as received", async() => {
    //     const supplyChain = await SupplyChain.deployed()

    //     var eventEmitted = false

    //     var event = supplyChain.Received()
    //     await event.watch((err, res) => {
    //         sku = res.args.sku.toString(10)
    //         eventEmitted = true
    //     })

    //     await supplyChain.receiveItem(sku, {from: bob})

    //     const result = await supplyChain.fetchItem.call(sku)

    //     assert.equal(eventEmitted, true, 'adding an item should emit a Shipped event')
    //     assert.equal(result[3].toString(10), 3, 'the state of the item should be "Received", which should be declared fourth in the State Enum')
    // })

});
