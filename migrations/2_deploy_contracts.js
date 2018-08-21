var Adoption = artifacts.require("Adoption");
var CrowdfundingFactory = artifacts.require("CrowdfundingFactory");

module.exports = function(deployer){
    deployer.deploy(Adoption);
    deployer.deploy(CrowdfundingFactory);
};