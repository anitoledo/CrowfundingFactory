var multiplier = 100
var dameMasGasolina = 1000000

$('#datetimepicker1').datepicker({
  uiLibrary: 'bootstrap4',
  minDate: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())
});
// var $grid2 = $('.grid').isotope({
//   itemSelector: '.grid-item',
//   layoutMode: 'fitRows',
// })
// $grid.isotope({ filter: ".a" });

var $grid =$('#campaignsRow').isotope({
  // options
  itemSelector: '.campaign-container',
  layoutMode: 'fitRows',
      });
$(".filter").click(function(){
  $grid.isotope({ filter: $(this).data('status') }); 
})
 


App = {
  web3Provider: null,
  contracts: {},

  init: function() {
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

    $(document).on('click', '.btn-contribute', App.handleContribute);
    $(document).on('click', '.btn-createCampaign', App.createCampaign);
    $(document).on('click', '.btn-goalReached', App.handleGoalReached);
    $(document).on('click', '.btn-fail', App.handleFailCampaign);
    $(document).on('click', '.btn-paydebt', App.handlePayDebt);
    $(document).on('click', '.btn-shares', App.handleClaimRefundorShares);
    $(document).on('click', '.btn-refund', App.handleClaimRefundorShares);
  },

  createCampaign: function(event) {

    event.preventDefault();
    var imageUrl = ""
    var name = $('#name').val();
    var goal = $('#goal').val();
    var rate = $('#rate').val();
    var term = $('#term').val();
    var startDate = Date.now();
    var date = $('#datetimepicker1').val();
    var endDate = Date.parse(date.toString());
    console.log("endDate")
    console.log(endDate)
    web3.eth.getAccounts(function(error, accounts){
      if(error){
        console.log(error);
      }

      var account = accounts[0];
      App.contracts.CrowdfundingFactory.deployed().then(function(instance){
        crowdfundingInstance = instance;


      const reader = new FileReader();
      reader.onloadend = function() {
        const ipfs = window.IpfsApi('localhost', 5001) // Connect to IPFS
        const buf = buffer.Buffer(reader.result) // Convert data into buffer
        ipfs.files.add(buf, (err, result) => { // Upload buffer to IPFS
          if(err) {
            console.error(err)
            return
          }
          let url = `https://ipfs.io/ipfs/${result[0].hash}`
          return crowdfundingInstance.createCampaign(name, url, web3.toWei(goal), endDate, rate, term, {from: account});
        })
      }
      const photo = document.getElementById("inputGroupFile01");
      try{
        reader.readAsArrayBuffer(photo.files[0]); 
        console.log("image")
      }catch(ex){
        console.log("no image create")
        return crowdfundingInstance.createCampaign(name, "", web3.toWei(goal), endDate, rate, term, {from: account});
      }}).then(function(result){
        console.log(result)
        $("#exampleModal").modal('hide');
        return App.displayCampaigns();
      }).catch(function(err){
        console.log(err.message);
      });
    });
  },

  displayCampaigns: function(account) {
    var adoptionInstance;
    web3.eth.getAccounts(function(error, accounts){
      if(error){
        console.log(error);
      }
      var account = accounts[0];
      App.contracts.CrowdfundingFactory.deployed().then(function(instance){
        crowdfundingInstance = instance;
        return crowdfundingInstance.numCampaigns.call();
      }).then(async function(campaigns){

        var campaignTemplate = $('#campaignTemplate');
        var campaignsRow = $('#campaignsRow');
        campaignsRow.html("")

        for (i = 1; i <= campaigns; i ++) {
          const campaignId = i;
          var investor = await crowdfundingInstance.getInvestorID.call(i,account).then(async function(investorId){
            if (investorId > 0){
              var investor = await crowdfundingInstance.getInvestorInCampaign.call(investorId.toNumber(),campaignId).then(function(investor){
                return {"isInvestor":true, "amount":web3.fromWei(investor[1].toNumber()/multiplier), "balance":web3.fromWei(investor[2].toNumber()/multiplier)}
              });
              
              return investor
            }
            return {"isInvestor":false, "amount":"N/A", "balance":"N/A"}
          },function failure(){
          }.bind(campaignId));
          //var campaign = crowdfundingInstance.getCampaign.call(i).then(function(data){
          var campaign = crowdfundingInstance.campaigns.call(i).then(function(data){
            var status = getStatusName(data[9].toNumber());
            var refundDeadline = new Date(data[6].toNumber())
            var color; if (percent == 0){color="black"}else{color="white"};
            var percent = data[2]/data[3]*multiplier
            var date = new Date(data[5].toNumber())
            campaignTemplate.find('.campaign-invested-amount').text(investor["amount"]);
            campaignTemplate.find('.campaign-balance').text(investor["balance"]);
            campaignTemplate.find('.campaign-container').attr("id","campaign-"+campaignId);
            campaignTemplate.find('.campaign-container').attr("class","col-md-6 mt-3 campaign-container is-"+status[0].toLowerCase());
            campaignTemplate.find('.card').attr("class","card border-"+status[1]);
            campaignTemplate.find('.card-header').attr("class","card-header alert-"+status[1]+" text-"+status[1]);
            campaignTemplate.find('.campaign-name').text(data[0]);
            campaignTemplate.find('.campaign-status>span').text(status[0]);
            campaignTemplate.find('.campaign-status>span').attr("class","badge badge-"+status[1]);
            campaignTemplate.find('.campaign-amount').text(web3.fromWei(data[2]/multiplier));
            campaignTemplate.find('.refund-deadline').text(refundDeadline.getDate()+"/"+refundDeadline.getMonth()+"/"+refundDeadline.getFullYear());
            campaignTemplate.find('.progress-bar').css("width",percent+"%");
            campaignTemplate.find('.progress-bar').css("color",color);
            campaignTemplate.find('.progress-bar').text(percent+"%");
            campaignTemplate.find('.beneficiary-address').text(data[4]);
            campaignTemplate.find('.campaign-goal').text(web3.fromWei(data[3]/multiplier));
            campaignTemplate.find('.campaign-endDate').text(date.getDate()+"/"+(date.getMonth()+1)+"/"+date.getFullYear());
            campaignTemplate.find('.campaign-term').text(data[8]+" months");
            campaignTemplate.find('.campaign-term-value').val(data[8]);
            campaignTemplate.find('.campaign-rate').text(data[7]+"%");
            campaignTemplate.find('.campaign-debt').text(web3.fromWei(data[10]/multiplier));
            campaignTemplate.find('.btn-contribute').text("Contribute");
            campaignTemplate.find('.btn-contribute').val(campaignId);
            campaignTemplate.find('.btn-goalReached').val(campaignId);
            campaignTemplate.find('.btn-fail').val(campaignId);
            campaignTemplate.find('.btn-refund').val(campaignId);
            campaignTemplate.find('.btn-paydebt').val(campaignId);
            campaignTemplate.find('.btn-shares').val(campaignId);
            var image = data[1]
            if (image != ""){
              campaignTemplate.find('.campaign-img').attr("src",image);  
            }
            displayConstraints(status[0],data[2].toNumber(),data[3].toNumber(),data[4],campaignTemplate,investor)

            
            campaignsRow.append(campaignTemplate.html());
          },function failure(result){

          }.bind(campaignId))
        }
      }).catch(function(err){
        console.log(err.message);
      });
    })
    var $grid =$('#campaignsRow').isotope({
  // options
  itemSelector: '.campaign-container',
  layoutMode: 'fitRows',
      });
 $grid.isotope({ filter: ".is-refunding" });

  },

  handleContribute: function(event) {
    event.preventDefault();

    var campaignId = parseInt($(event.target).val());
    var crowdfundingInstance;
    var contributeAmount = $("#campaign-"+campaignId).find(".amount-value").val()

    web3.eth.getAccounts(function(error, accounts){
      if(error){
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.CrowdfundingFactory.deployed().then(function(instance){
        crowdfundingInstance = instance;
        var today = Date.now()
        //var today = Date.now()-5256000000
        return crowdfundingInstance.contribute(campaignId, today, {from: account, value: web3.toWei(contributeAmount)});
      }).then(function(result){
        return App.displayCampaigns();
      }).catch(function(err){
        console.log(err.message);
      });
    });
  },
  handleGoalReached: function(event){
    event.preventDefault();
    var campaignId = parseInt($(event.target).val());
    var term = parseInt($("#campaign-"+campaignId).find(".campaign-term-value").val());
    var today = new Date()
    console.log(term)

    var refundDeadline = today.setMonth(today.getMonth()+term)
    console.log(refundDeadline)
    var crowdfundingInstance;
    
    web3.eth.getAccounts(function(error, accounts){
      if(error){
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.CrowdfundingFactory.deployed().then(function(instance){
        crowdfundingInstance = instance;
        return crowdfundingInstance.goalReached(campaignId,Date.now(),refundDeadline,{from: account,gas:dameMasGasolina})
      }).then(function(result){
        return App.displayCampaigns();
      }).catch(function(err){
        console.log(err.message);
      });
    });
  },
  handleFailCampaign: function(event){
    event.preventDefault();
    var campaignId = parseInt($(event.target).val());
    var contributeAmount = parseInt($(event.target).data("amount"));
    var crowdfundingInstance;
    
    web3.eth.getAccounts(function(error, accounts){
      if(error){
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.CrowdfundingFactory.deployed().then(function(instance){
        crowdfundingInstance = instance;
        return crowdfundingInstance.failCampaign(campaignId, Date.now()+5256000000, {from: account});
      }).then(function(result){
        return App.displayCampaigns();
      }).catch(function(err){
        console.log(err.message);
      });
    });
  },
  handlePayDebt: function(event){
    event.preventDefault();
    var campaignId = parseInt($(event.target).val());
    var crowdfundingInstance;
    var amount = $("#campaign-"+campaignId).find(".debt-value").val()
    console.log(amount)
    console.log(campaignId)
    web3.eth.getAccounts(function(error, accounts){
      if(error){
        console.log(error);
      }
      var account = accounts[0];

      App.contracts.CrowdfundingFactory.deployed().then(function(instance){
        crowdfundingInstance = instance;
        return crowdfundingInstance.payDebt(campaignId,Date.now(), {from: account,value: web3.toWei(amount),gas:dameMasGasolina});
      }).catch(function(err){
        console.log(err.message);
      });
    });
  },
    handleClaimRefundorShares: function(event){
    event.preventDefault();
    var campaignId = parseInt($(event.target).val());
    var crowdfundingInstance;
    var action = $(event.target).data("action")
    web3.eth.getAccounts(function(error, accounts){
      if(error){
        console.log(error);
      }

      var account = accounts[0];
      App.contracts.CrowdfundingFactory.deployed().then(function(instance){
        crowdfundingInstance = instance;
        if (action == "shares"){
          return crowdfundingInstance.claimShare(campaignId, {from: account,gas:dameMasGasolina});  
        }
        else if (action == "refund"){
          return crowdfundingInstance.claimRefund(campaignId, {from: account,gas:dameMasGasolina});
        }
      }).catch(function(err){
        console.log(err.message);
      });
    });
  },

};

$(function() {
  $(window).load(function() {
    App.init();
  });
});




function getStatusName(status){
  var statusText = ""
  var css = "primary"

  switch(status) {
      case 0:
        statusText = 'Active'
        css = "primary"
        break;
      case 1:
        statusText = 'Refunding'
        css = "success"
        break;
      case 2:
        statusText = 'Terminated'
        css = "warning"
        break;
      case 3:
        statusText = 'Failed'
        css = "danger"
        break;
  }
  return [statusText,css];
}

function displayConstraints(status,amount,balance, account,campaignTemplate,investor){
  if (status=="Active"){
              campaignTemplate.find(".visible-active").show()

              if (amount == balance){

                campaignTemplate.find('.btn-goalReached').show();
              }
              else{
                campaignTemplate.find('.btn-goalReached').hide();
              }
             }
             else{
              campaignTemplate.find(".visible-active").hide()
             }

             if (status=="Refunding"){
              campaignTemplate.find(".visible-refunding").show()
            }
            else{
              campaignTemplate.find(".visible-refunding").hide()
             }

             if (status == "Terminated"){
              campaignTemplate.find(".visible-terminated").show()
             }
             else{
              campaignTemplate.find(".visible-terminated").hide()
              if (status == "Refunding") {
                campaignTemplate.find(".visible-terminated.visible-refunding").show()  
              }
              
             }
             if (status == "Failed"){
              campaignTemplate.find(".visible-failed").show()
             }
             else{
              campaignTemplate.find(".visible-failed").hide()
              if (status == "Active") {
                campaignTemplate.find(".visible-active.visible-failed").show()
              }
             }

             if (investor["isInvestor"]){
              campaignTemplate.find(".investor-container").show()
            }
            else{
              campaignTemplate.find(".investor-container").hide()
            }
            if (account != account){
              campaignTemplate.find(".beneficiary-container").hide()
              campaignTemplate.find(".paydebt-container").css("visibility","hidden")
            }
            else{
              campaignTemplate.find(".beneficiary-container").show()
              campaignTemplate.find(".paydebt-container").css("visibility","visible")
            }

}
