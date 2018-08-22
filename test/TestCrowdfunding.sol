pragma solidity ^0.4.17;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/CrowdfundingFactory.sol";

contract TestCrowdfunding {

    CrowdfundingFactory crowdfundingFactory = CrowdfundingFactory(DeployedAddresses.CrowdfundingFactory());

    function testCreateCampaign() public {
        string memory campaignName = crowdfundingFactory.createCampaign(
            "Punk Marketing",
            1000,
            1534785300,
            1540055700,
            20,
            24
        );
        string memory expected = "Punk Marketing";

        Assert.equal(campaignName, expected, "Campaign should have had created.");
    }

    function testGetCampaigns() public {
        uint256 numCampaigns = crowdfundingFactory.getCampaigns();
        uint256 expected = 1;

        Assert.equal(numCampaigns, expected, "Campaign should have had created.");
    }

    function testGetCampaign() public {
        string memory name;
        uint256 goal;
        address beneficiary;

        (name, , goal, beneficiary, , , , , ) = crowdfundingFactory.getCampaign(1);

        Assert.equal(name, "Punk Marketing", "Campaign should have had created.");
        Assert.equal(goal/1000, 1000, "Campaign should have had created.");
        Assert.equal(beneficiary, this, "Campaign should have had created.");
    }
}