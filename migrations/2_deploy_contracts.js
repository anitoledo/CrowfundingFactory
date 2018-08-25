var CrowdfundingFactory = artifacts.require("CrowdfundingFactory");

module.exports = function(deployer){
    deployer.deploy(CrowdfundingFactory);
};