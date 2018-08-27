pragma solidity ^0.4.17;
import "./SafeMath.sol";

/** @title Crowdfunding Factory. */
contract CrowdfundingFactory {
    using SafeMath for uint256;

    /** State Variables. 
        - multiplier: Auxiliar value to store bigger numbers and convert to float in frontend.
        - numCampaigns: Number of campaigns stored.
        - owner: Contract's owner address.
        - stopped: Emergency stopped variable.
        - campaigns: Mapping of campaigns stored, uint256 beign the campaign id.
        - monthsInSeconds: Seconds in a month.
    */
    uint256 multiplier = 10**2;
    uint256 public numCampaigns;
    address public owner;
    bool private stopped = false;
    mapping(uint256 => Campaign) public campaigns;
    uint256 monthsInSeconds = 2592000;
    
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
        string imageUrl;
        uint256 amount;
        uint256 goal;
        address beneficiary;
        uint256 endDate;
        uint256 refundDeadline;
        uint256 rate;
        uint256 term;
        Status status;
        uint256 debt;
        uint256 numInvestors;
        mapping(uint => Investor) investors;
    }

    /** @dev Validates if user is contract owner. */
    modifier isOwner() { 
        require(msg.sender == owner); 
        _; 
    }
    /** @dev Disables use of function in emergency state.  */
    modifier stopInEmergency { require (!stopped); _; }
    /** @dev Enables use of function in emergency state.  */
    modifier onlyInEmergency { require (stopped); _; }
    
    /** @dev Validates if campaign status is active.  */
    modifier active(uint256 _campaignID){
        require(campaigns[_campaignID].status == Status.Active);
        _;
    }
    /** @dev Validates if campaign status is failed.  */
    modifier failed(uint256 _campaignID){
        require(campaigns[_campaignID].status == Status.Failed);
        _;
    }
    /** @dev Validates if campaign end date is greater than today date.  */
    modifier activeValidDate(uint256 _campaignID){
        require(block.timestamp <= campaigns[_campaignID].endDate);
        _;
    }
    /** @dev Validates if campaign goal is greater than campaign amount.  */
    modifier validAmount(uint256 _campaignID){
        require(campaigns[_campaignID].amount < campaigns[_campaignID].goal);
        _;
    }
    /** @dev Validates if user is campaign's beneficiary.  */
    modifier isBeneficiary(uint256 _campaignID){
        require(msg.sender == campaigns[_campaignID].beneficiary);
        _;
    }



    constructor(){
        owner = msg.sender;
    }

    /** @dev Toggles emergency state.  */
    function toggleEmergency() isOwner public{
        stopped = !stopped;
    }

    /** 
        @dev Creates new campaign. 
        @param name Name of the campaign.
        @param imageUrl Image url of the campaign.
        @param goal Goal of the campaign.
        @param endDate End date of the campaign.
        @param rate Rate of the campaign.
        @param term Term of the campaign.
    */
    function createCampaign(string name, string imageUrl, uint256 goal, uint256 endDate, uint256 rate, uint256 term) public {
        require(block.timestamp < endDate);
        numCampaigns++;
        uint256 campaignID = numCampaigns;
        campaigns[campaignID] = Campaign(name, imageUrl, 0, goal.mul(multiplier), msg.sender, endDate, 0, rate, term, Status.Active, 0, 0);
    }

    /** 
        @dev Contributes to a campaign.  
        @param campaignID Id of the desired campaign.
        @param imageUrl Image url of the campaign.
        @param goal Goal of the campaign.
        @param endDate End date of the campaign.
        @param rate Rate of the campaign.
        @param term Term of the campaign.
    */
    function contribute(uint256 campaignID) validAmount(campaignID) active(campaignID) activeValidDate(campaignID) stopInEmergency public payable{
        Campaign storage campaign = campaigns[campaignID];
        uint value = msg.value.mul(multiplier);
        require(campaign.amount + value <= campaign.goal);
        uint256 investorID = getInvestorID(campaignID);
        if(investorID > 0){
            campaign.investors[investorID].amount = campaign.investors[investorID].amount.add(value);
        } else{
            campaign.numInvestors++;
            investorID = campaign.numInvestors;
            campaign.investors[investorID] = Investor(msg.sender, value, 0);
        }
        campaign.amount = campaign.amount.add(value);
    }

    /** 
        @dev Loops investors on campaign looking for the investor id of user.
        @param campaignID Id of the desired campaign.
        @return uint256 The investor id.
    */
    function getInvestorID(uint256 campaignID) public view returns(uint256){
        Campaign storage campaign = campaigns[campaignID];
        for (uint256 i = 1; i <= campaign.numInvestors; i ++) {
            if(campaign.investors[i].addr == msg.sender){
                return i;
            }
        }
        return 0;
    }

    /** 
        @dev Gets the data of the desire investor in desire campaign.
        @param investorID Id of the desired investor.
        @param campaignID Id of the desired campaign.
        @return address The investor address.
        @return uint256 The investor invested amount.
        @return uint256 The investor balance.
    */
    function getInvestorInCampaign(uint256 investorID, uint256 campaignID) public view returns(address, uint256, uint256){
        Campaign storage campaign = campaigns[campaignID];
        return (campaign.investors[investorID].addr, campaign.investors[investorID].amount, campaign.investors[investorID].balance);
    }

    /** 
        @dev Changes state of campaign to refunding, calculates debt (beign the goal plus the rate) 
             and transfer the collected amount to the beneficiary.
        @param campaignID Id of the desired campaign.
    */
    function goalReached(uint256 campaignID) activeValidDate(campaignID) isBeneficiary(campaignID) stopInEmergency public payable {
        Campaign storage campaign = campaigns[campaignID];
        require(campaign.goal == campaign.amount);
        uint256 amount = campaign.amount;
        campaign.amount = 0;
        campaign.status = Status.Refunding;
        uint256 percentage = (campaign.goal*campaign.rate) / 100;
        campaign.debt = campaign.goal + percentage;
        uint256 months = monthsInSeconds.mul(campaign.term);
        campaign.refundDeadline = months.add(block.timestamp);
        campaign.beneficiary.transfer(amount.div(multiplier));
    }

    /** 
        @dev Changes state of campaign to failed and updates balance with the invested money value.
        @param campaignID Id of the desired campaign.
    */
    function failCampaign(uint256 campaignID) validAmount(campaignID) stopInEmergency public {
        Campaign storage campaign = campaigns[campaignID];
        require(campaign.endDate < block.timestamp);
        campaign.status = Status.Failed;
        for (uint256 i = 1; i <= campaign.numInvestors; i ++) {
            campaign.investors[i].balance = campaign.investors[i].amount;
        }
    }

    /** 
        @dev Transfers balance amount to investor when the campaign is in failed state.
        @param campaignID Id of the desired campaign.
    */
    function claimRefund(uint256 campaignID) failed(campaignID) stopInEmergency public payable {
        Campaign storage campaign = campaigns[campaignID];
        uint256 investorID = getInvestorID(campaignID);
        require(investorID > 0);
        require(campaign.investors[investorID].balance > 0);
        uint256 refund = campaign.investors[investorID].balance;
        campaign.investors[investorID].balance = 0;
        msg.sender.transfer(refund.div(multiplier));
    }

    /** 
        @dev Pay debt of a campaign.
        @param campaignID Id of the desired campaign.
    */
    function payDebt(uint256 campaignID) isBeneficiary(campaignID) stopInEmergency public payable {
        Campaign storage campaign = campaigns[campaignID];
        uint256 value = msg.value.mul(multiplier);
        require(campaign.debt > 0);
        require(block.timestamp <= campaign.refundDeadline);
        campaign.debt = campaign.debt.sub(value);
        if(campaign.debt == 0){
            campaign.status = Status.Terminated;
        }
        releaseHolderShares(campaignID, value);
    }

    /** 
        @dev Updates investors balances with a proportional amount of the deposit amount.
        @param campaignID Id of the desired campaign.
        @param depositAmount The desposit amount.
    */
    function releaseHolderShares(uint256 campaignID, uint depositAmount) private {
        Campaign storage campaign = campaigns[campaignID];
        for (uint256 i = 1; i <= campaign.numInvestors; i ++) {
            uint256 percentage = (campaign.investors[i].amount * 100) / campaign.goal;
            uint256 holderShare = (depositAmount * percentage) / 100;
            campaign.investors[i].balance += holderShare;
        }
    }

    /** 
        @dev Transfers balance amount to investor when the campaign is in refunding state.
        @param campaignID Id of the desired campaign.
    */
    function claimShare(uint256 campaignID) stopInEmergency public payable {
        Campaign storage campaign = campaigns[campaignID];
        uint256 investorID = getInvestorID(campaignID);
        require(investorID > 0);
        require(campaign.investors[investorID].balance > 0);
        uint256 refund = campaign.investors[investorID].balance;
        campaign.investors[investorID].balance = 0;
        msg.sender.transfer(refund.div(multiplier));
    }

    /** 
        @dev Transfers investor's invested amount when is in emergency state.
    */
    function withdrawEmergencyMoney() onlyInEmergency public{
        uint256 refund;
        for (uint256 i = 1; i <= numCampaigns; i++) {
            for (uint256 j = 1; j <= campaigns[i].numInvestors; j++) {
                if(campaigns[i].investors[j].addr == msg.sender){
                    refund = refund.add(campaigns[i].investors[j].amount);
                    campaigns[i].investors[j].amount = 0;
                }
            }
        }
        msg.sender.transfer(refund.div(multiplier));
    }
}