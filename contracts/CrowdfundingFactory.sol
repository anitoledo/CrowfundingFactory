pragma solidity ^0.4.17;
import "./SafeMath.sol";

contract CrowdfundingFactory {
    using SafeMath for uint256;

    uint256 multiplier = 10**2;
    uint256 public numCampaigns;
    uint256[] investorCampaigns;
    address private owner;
    bool private stopped = false;
    mapping(uint256 => Campaign) public campaigns;
    
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

    modifier isOwner() { if(msg.sender == owner) _; }
    modifier stopInEmergency { if (!stopped) _; }
    modifier onlyInEmergency { if (stopped) _; }
    
    modifier active(uint256 _campaignID){
        require(campaigns[_campaignID].status == Status.Active);
        _;
    }
    modifier failed(uint256 _campaignID){
        require(campaigns[_campaignID].status == Status.Failed);
        _;
    }
    modifier activeValidDate(uint256 _campaignID, uint256 _todayDate){
        require(_todayDate <= campaigns[_campaignID].endDate);
        _;
    }
    modifier validAmount(uint256 _campaignID){
        require(campaigns[_campaignID].amount < campaigns[_campaignID].goal);
        _;
    }
    modifier isBeneficiary(uint256 _campaignID){
        require(msg.sender == campaigns[_campaignID].beneficiary);
        _;
    }

    constructor(){
        owner = msg.sender;
    }

    function toggleEmergency() isOwner public{
        stopped = !stopped;
    }

    function createCampaign(string name, uint256 goal, uint256 startDate, uint256 endDate, uint256 rate, uint256 term) public returns(string){
        numCampaigns++;
        uint256 campaignID = numCampaigns;
        campaigns[campaignID] = Campaign(name, 0, goal.mul(multiplier), msg.sender, startDate, endDate, term, rate, term, Status.Active, 0, 0);
        return campaigns[campaignID].name;
    }

    function getCampaigns() public view returns(uint256){
        return numCampaigns;
    }

    function getCampaign(uint256 campaignID) public view returns(string, uint256, uint256, address, uint256, uint256, uint256, uint, uint){
        Campaign storage campaign = campaigns[campaignID];
        return (campaign.name, campaign.amount, campaign.goal, campaign.beneficiary, campaign.endDate, campaign.rate, campaign.term, uint(campaign.status), campaign.debt);
    }

    function contribute(uint256 campaignID, uint256 todayDate) validAmount(campaignID) active(campaignID) activeValidDate(campaignID, todayDate) stopInEmergency public payable{
        Campaign storage campaign = campaigns[campaignID];
        uint value = msg.value.mul(multiplier);
        require(campaign.amount + value <= campaign.goal);
        uint256 investorID = getInvestorID(campaignID, msg.sender);
        if(investorID > 0){
            campaign.investors[investorID].amount = campaign.investors[investorID].amount.add(value);
        } else{
            campaign.numInvestors++;
            investorID = campaign.numInvestors;
            campaign.investors[investorID] = Investor(msg.sender, value, 0);
        }
        campaign.amount = campaign.amount.add(value);
    }

    function getDebt(uint256 campaignID) isBeneficiary(campaignID) public view returns(uint256){
        Campaign storage campaign = campaigns[campaignID];
        return campaign.debt;
    }

    function getInvestorID(uint256 campaignID, address investorAddr) public view returns(uint256){
        Campaign storage campaign = campaigns[campaignID];
        for (uint256 i = 1; i <= campaign.numInvestors; i ++) {
            if(campaign.investors[i].addr == investorAddr){
                return i;
            }
        }
        return 0;
    }

    function getInvestorInCampaign(uint256 investorID, uint256 campaignID) public view returns(address, uint256, uint256){
        Campaign storage campaign = campaigns[campaignID];
        return (campaign.investors[investorID].addr, campaign.investors[investorID].amount, campaign.investors[investorID].balance);
    }

    function goalReached(uint256 campaignID, uint256 todayDate, uint256 refundDeadline) activeValidDate(campaignID, todayDate) stopInEmergency public payable {
        Campaign storage campaign = campaigns[campaignID];
        require(campaign.goal == campaign.amount);
        uint256 amount = campaign.amount;
        campaign.amount = 0;
        campaign.status = Status.Refunding;
        uint256 percentage = (campaign.goal*campaign.rate) / 100;
        campaign.debt = campaign.goal + percentage;
        campaign.refundDeadline = refundDeadline;
        campaign.beneficiary.transfer(amount.div(multiplier));
    }

    function failCampaign(uint256 campaignID, uint256 todayDate) validAmount(campaignID) stopInEmergency public {
        Campaign storage campaign = campaigns[campaignID];
        require(campaign.endDate < todayDate);
        campaign.status = Status.Failed;
        for (uint256 i = 1; i <= campaign.numInvestors; i ++) {
            campaign.investors[i].balance = campaign.investors[i].amount;
        }
    }

    function claimRefund(uint256 campaignID) failed(campaignID) stopInEmergency public payable {
        Campaign storage campaign = campaigns[campaignID];
        uint256 investorID = getInvestorID(campaignID, msg.sender);
        require(investorID > 0);
        require(campaign.investors[investorID].balance > 0);
        uint256 refund = campaign.investors[investorID].balance;
        campaign.investors[investorID].balance = 0;
        msg.sender.transfer(refund.div(multiplier));
    }

    function payDebt(uint256 campaignID, uint256 todayDate) isBeneficiary(campaignID) stopInEmergency public payable {
        Campaign storage campaign = campaigns[campaignID];
        uint256 value = msg.value.mul(multiplier);
        require(campaign.debt > 0);
        require(todayDate <= campaign.refundDeadline);
        campaign.debt = campaign.debt.sub(value);
        if(campaign.debt == 0){
            campaign.status = Status.Terminated;
        }
        releaseHolderShares(campaignID, value);
    }

    function releaseHolderShares(uint256 campaignID, uint depositAmount) private {
        Campaign storage campaign = campaigns[campaignID];
        for (uint256 i = 1; i <= campaign.numInvestors; i ++) {
            uint256 percentage = (campaign.investors[i].amount * 100) / campaign.goal;
            uint256 holderShare = (depositAmount * percentage) / 100;
            campaign.investors[i].balance += holderShare;
        }
    }

    function claimShare(uint256 campaignID) stopInEmergency public payable {
        Campaign storage campaign = campaigns[campaignID];
        uint256 investorID = getInvestorID(campaignID, msg.sender);
        require(investorID > 0);
        require(campaign.investors[investorID].balance > 0);
        uint256 refund = campaign.investors[investorID].balance;
        campaign.investors[investorID].balance = 0;
        msg.sender.transfer(refund.div(multiplier));
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

    function withdrawEmergencyMoney() onlyInEmergency public{
        uint256 refund;
        for (uint256 i = 1; i <= numCampaigns; i++) {
            for (uint256 j = 1; j <= campaigns[i].numInvestors; j++) {
                if(campaigns[i].investors[j].addr == msg.sender){
                    refund = refund.add(campaigns[i].investors[j].amount);
                }
            }
        }
        msg.sender.transfer(refund.div(multiplier));
    }
}