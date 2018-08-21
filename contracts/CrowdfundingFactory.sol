pragma solidity ^0.4.17;
import "./SafeMath.sol";

contract CrowdfundingFactory {
    using SafeMath for uint256;
    
    enum Status { 
        Active, 
        Refunding,
        Terminated, 
        Failed
    }

    struct Investor{
        address addr;
        uint256 amount;
        uint256 balance;
    }

    struct Campaign{
        string name;
        uint256 amount;
        uint256 goal;
        address beneficiary;
        uint256 startDate;
        uint256 endDate;
        uint256 refundDeadline;
        uint256 rate;
        uint256 term;
        Status status;
        uint256 debt;
        uint256 numInvestors;
        mapping(uint => Investor) investors;
    }

    uint256 public secInMonths = 52560000;
    uint256 public numCampaigns;
    uint256[] investorCampaigns;
    mapping(uint256 => Campaign) public campaigns;

    function createCampaign(string name, uint256 goal, uint256 startDate, uint256 endDate, uint256 rate, uint256 term) public returns(string){
        uint256 campaignID = numCampaigns++;
        campaigns[campaignID] = Campaign(name, 0, goal, msg.sender, startDate, endDate, term.mul(secInMonths), rate, term, Status.Active, 0, 0);
        return campaigns[campaignID].name;
    }

    function getCampaigns() public view returns(uint256){
        return numCampaigns;
    }

    function getCampaign(uint256 campaignID) public view returns(string, uint256, uint256, address, uint256, uint256, uint256, Status){
        Campaign storage campaign = campaigns[campaignID];
        return (campaigns[campaignID].name, campaign.amount, campaign.goal, campaign.beneficiary, campaign.endDate, campaign.rate, campaign.term, campaign.status);
    }

    function getDebt(uint256 campaignID) public view returns(uint256){
        Campaign storage campaign = campaigns[campaignID];
        require(msg.sender == campaign.beneficiary);
        return campaign.debt;
    }

    function getInvestorID(uint256 campaignID, address investorAddr) private view returns(uint256){
        Campaign storage campaign = campaigns[campaignID];
        for (uint256 i = 1; i <= campaign.numInvestors; i ++) {
            if(campaign.investors[i].addr == investorAddr){
                return i;
            }
        }
        return 0;
    }

    function contribute(uint256 campaignID, uint256 todayDate) public payable{
        Campaign storage campaign = campaigns[campaignID];
        require(campaign.amount + msg.value > 0);
        require(todayDate < campaign.endDate);
        require(campaign.status == Status.Active);
        require(campaign.amount < campaign.goal);
        uint256 investorID = getInvestorID(campaignID, msg.sender);
        if(investorID > 0){
            campaign.investors[investorID].amount += msg.value;
        } else{
            investorID = campaign.numInvestors++;
            campaign.investors[investorID] = Investor(msg.sender, msg.value, 0);
        }
        campaign.amount += msg.value;
    }

    function goalReached(uint256 campaignID, uint256 todayDate) public payable {
        Campaign storage campaign = campaigns[campaignID];
        require(campaign.amount >= campaign.goal);
        uint256 amount = campaign.amount;
        campaign.amount = 0;
        campaign.status = Status.Refunding;
        campaign.debt = campaign.goal * (1+(campaign.rate/100));
        campaign.refundDeadline = todayDate.add(campaign.term);
        campaign.beneficiary.transfer(amount);
    }

    function failCampaign(uint256 campaignID, uint256 todayDate) public {
        Campaign storage campaign = campaigns[campaignID];
        require(campaign.endDate < todayDate);
        require(campaign.amount < campaign.goal);
        campaign.status = Status.Failed;
        for (uint256 i = 1; i <= campaign.numInvestors; i ++) {
            campaign.investors[i].balance = campaign.investors[i].amount;
        }
    }

    function claimRefund(uint256 campaignID) public payable {
        Campaign storage campaign = campaigns[campaignID];
        require(campaign.status == Status.Failed);
        uint256 investorID = getInvestorID(campaignID, msg.sender);
        require(investorID > 0);
        require(campaign.investors[investorID].balance > 0);
        uint256 refund = campaign.investors[investorID].balance;
        campaign.investors[investorID].balance = 0;
        msg.sender.transfer(refund);
    }

    function payDebt(uint256 campaignID, uint256 todayDate) public payable {
        Campaign storage campaign = campaigns[campaignID];
        require(msg.sender == campaign.beneficiary);
        require(campaign.debt > 0);
        require(todayDate <= campaign.refundDeadline);
        campaign.debt = campaign.debt.sub(msg.value);
        if(campaign.debt == 0){
            campaign.status = Status.Terminated;
        }
        releaseHolderShares(campaignID, msg.value);
    }

    function releaseHolderShares(uint256 campaignID, uint depositAmount) public {
        Campaign storage campaign = campaigns[campaignID];
        for (uint256 i = 1; i <= campaign.numInvestors; i ++) {
            uint256 percentage = campaign.investors[i].amount.div(campaign.goal);
            uint256 holderShare = depositAmount.mul(percentage);
            campaign.investors[i].balance += holderShare;
        }
    }

    function claimShare(uint256 campaignID) public payable {
        Campaign storage campaign = campaigns[campaignID];
        uint256 investorID = getInvestorID(campaignID, msg.sender);
        require(investorID > 0);
        require(campaign.investors[investorID].balance > 0);
        uint256 refund = campaign.investors[investorID].balance;
        campaign.investors[investorID].balance = 0;
        msg.sender.transfer(refund);
    }

    function getInvestorCampaigns() public returns(uint[]){
        uint256[] storage investorCampaignsInside = investorCampaigns;
        for (uint256 i = 1; i <= numCampaigns; i++) {
            for (uint256 j = 1; j <= campaigns[i].numInvestors; j++) {
                if(campaigns[i].investors[j].addr == msg.sender){
                    investorCampaignsInside.push(i);
                }
            }
        }
        return investorCampaignsInside;
    }

}