var multiplier = 100

App = {
  web3Provider: null,
  contracts: {},

  init: function() {
    // Load pets.
    // $.getJSON('../pets.json', function(data) {
    //   var petsRow = $('#petsRow');
    //   var petTemplate = $('#petTemplate');

    //   for (i = 0; i < data.length; i ++) {
    //     petTemplate.find('.panel-title').text(data[i].name);
    //     petTemplate.find('img').attr('src', data[i].picture);
    //     petTemplate.find('.pet-breed').text(data[i].breed);
    //     petTemplate.find('.pet-age').text(data[i].age);
    //     petTemplate.find('.pet-location').text(data[i].location);
    //     petTemplate.find('.btn-adopt').attr('data-id', data[i].id);

    //     petsRow.append(petTemplate.html());
    //   }
    // });

    return App.initWeb3();
  },

  initWeb3: function() {
    if(typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
    } else{
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
    }
    web = new Web3(App.web3Provider);

    return App.initContract();
  },

  initContract: function() {
    $.getJSON('CrowdfundingFactory.json', function(data) {
      var CrowdfundingArtifact = data;
      App.contracts.CrowdfundingFactory = TruffleContract(CrowdfundingArtifact);

      App.contracts.CrowdfundingFactory.setProvider(App.web3Provider);

      return App.displayCampaigns();
    });

    return App.bindEvents();
  },

  bindEvents: function() {
    // $(document).on('click', '.btn-adopt', App.handleAdopt);
    $(document).on('click', '.btn-createCampaign', App.createCampaign);
  },

  createCampaign: function(event) {
    event.preventDefault();

    var name = $('#name').val();
    var goal = $('#goal').val();
    var rate = $('#rate').val();
    var term = $('#term').val();
    var startDate = Date.now();
    var date = $('#datetimepicker1').data('date');
    var endDate = Date.parse(date.toString());
  
    web3.eth.getAccounts(function(error, accounts){
      if(error){
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.CrowdfundingFactory.deployed().then(function(instance){
        crowdfundingInstance = instance;
        
        return crowdfundingInstance.createCampaign(name, web3.toWei(goal, 'ether'), startDate, endDate, rate, term, {from: account});
      }).then(function(result){
        console.log(result)
        return App.displayCampaigns();
      }).catch(function(err){
        console.log(err.message);
      });
    });
  },

  displayCampaigns: function(account) {
    var adoptionInstance;

    App.contracts.CrowdfundingFactory.deployed().then(function(instance){
      crowdfundingInstance = instance;

      return crowdfundingInstance.getCampaigns.call();
    }).then(function(campaigns){
      var campaignsRow = $('#campaignsRow');
      var campaignTemplate = $('#campaignTemplate');
      for (i = 1; i <= campaigns; i ++) {
        var campaign = crowdfundingInstance.getCampaign.call(i).then(function(data){
          campaignTemplate.find('.campaign-name').text(data[0]);
          switch(data[7]) {
              case 0:
                  campaignTemplate.find('.campaign-status').text('Active');
                  break;
              case 1:
                  campaignTemplate.find('.campaign-status').text('Refunding');
                  break;
              case 2:
                  campaignTemplate.find('.campaign-status').text('Terminated');
                  break;
              case 3:
                  campaignTemplate.find('.campaign-status').text('Failed');
                  break;
          }
          var percent = data[1]/data[2]*100
          campaignTemplate.find('.progress-bar').css("width",percent);
          campaignTemplate.find('.progress-bar').text(percent+"%");
          campaignTemplate.find('.beneficiary-address').text(data[3]);
          campaignTemplate.find('.campaign-goal').text(web3.fromWei(data[2]/multiplier, 'ether'));
          var date = new Date(data[4].toNumber())
          campaignTemplate.find('.campaign-endDate').text(date.getDate()+"/"+date.getMonth()+"/"+date.getFullYear());
          campaignTemplate.find('.campaign-term').text(data[6]+" months");
          campaignTemplate.find('.campaign-rate').text(data[5]+"%");

          campaignsRow.append(campaignTemplate.html());
          console.log(campaignTemplate.html())
        });
      }
    }).catch(function(err){
      console.log(err.message);
    });
  }
  
  // markAdopted: function(adopters, account) {
  //   var adoptionInstance;

  //   App.contracts.Adoption.deployed().then(function(instance){
  //     adoptionInstance = instance;

  //     return adoptionInstance.getAdopters.call();
  //   }).then(function(adopters){
  //     for(i = 0; i < adopters.length; i++){
  //       if(adopters[i] !== '0x0000000000000000000000000000000000000000') {
  //         $('.panel-pet').eq(i).find('button').text('Success').attr('disabled', true);
  //       }
  //     }
  //   }).catch(function(err){
  //     console.log(err.message);
  //   });
  // },

  // handleAdopt: function(event) {
  //   event.preventDefault();

  //   var petId = parseInt($(event.target).data('id'));

  //   var adoptionInstance;

  //   web3.eth.getAccounts(function(error, accounts){
  //     if(error){
  //       console.log(error);
  //     }

  //     var account = accounts[0];

  //     App.contracts.Adoption.deployed().then(function(instance){
  //       adoptionInstance = instance;

  //       return adoptionInstance.adopt(petId, {from: account, value: 1000000000000000000});
  //     }).then(function(result){
  //       return App.markAdopted();
  //     }).catch(function(err){
  //       console.log(err.message);
  //     });
  //   });
  // }

};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
