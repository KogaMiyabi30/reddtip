
/*************************************************
 * RDD.settingsGUI
 *************************************************/
(function(exports){
    var pri = {
            transactionsRendered : false,
            currentSettings : {}
        },
        pub = {};


    pri.setState = function(newState){
        exports.modal.setState(newState);
    };

    pri.getTransactionHeader = function(){
        return '<table class="transactionTable"> ' +
            '<tr>' +
            '<th>Info</th>'+
            '<th>User</th>'+
            '<th>Amount</th>'+
            '<th>USD</th>'+
            '<th>Date</th>'+
            '</tr>';
    };

    pri.getAddressLink = function(address, length){
        var length = length || 12,
            shortened = address.substr(0,length) + '[...]',
            link = 'http://bitinfocharts.com/reddcoin/address/'+address;
        return '<a target="_blank" title="RDD Address: '+address+'" href="'+link+'">'+
            shortened
            +'</a>';
    }

    pri.getTransactionRow = function(transaction){
        var info,
            clss = "green",
            user = transaction.from,
            date = RDD.helpers.formatDay(new Date(transaction.time * 1000));

        switch(transaction.type){
            case "sent_tip":
                info = "Tip Sent To: ";
                user = transaction.to;
                break;
            case "received_tip":
                info = "Tip From: ";
                break;
            case "withdrawal":
                info = "Withdrawal to:";
                user = pri.getAddressLink(transaction.address);
                break;
        }

        if(transaction.amount < 0){
            clss = 'red';
        }

        return '<tr>' +
            '<td>' + info + '</td>'+
            '<td>' + user + '</td>'+
            '<td class="'+clss+'">' + transaction.amount + '</td>'+
            '<td>' + transaction.usd+ '</td>'+
            '<td>' + date + '</th>'+
            '</tr>';
    };

    pri.renderTransactions = function(){
        var request = {
            method    : "getDataAttribute",
            attribute : "recordedTransactions"
        };

        RDD.helpers.message(request, function(transactions){
            var html = pri.getTransactionHeader();

            $.each(transactions, function(i, transaction){
                html += pri.getTransactionRow(transaction);
            });

            html += '</table>'

            $("#rddTransactionsTable").html(html);
        });
    };

    pub.openTab = function($tabLink){
        var tab = $tabLink.attr("data-tab"),
            $tab = $("#reddTab_" + tab);

        if(tab === 'transactions' && ! pri.transactionsRendered){
            pri.renderTransactions();
            pri.transactionsRendered = true;
        }

        if(tab === 'tip'){
            $("#reddTipButton").show();
        }
        else {
            $("#reddTipButton").hide();
        }

        //hide others
        $(".reddSettingsTab").hide();
        $(".reddSettingsTabLink").removeClass("selected");

        $tab.show();
        $tabLink.addClass("selected")
    };

    pri.started = function(){
        function checkMessagesCallback(){
            var list = RDD.site.accountData.operationList;
            if(list.initialProbe || list.needsRegister){
                setTimeout(function(){
                    RDD.site.checkMessages(checkMessagesCallback);
                }, 6000);
            }
            else{
                $("#getStartedThree").hide();
                $("#getStartedFour").show();
            }
        };
        $("#getStartedTwo").hide();
        $("#getStartedThree").show();

        RDD.site.checkMessages(checkMessagesCallback);
    };

    pri.getStarted = function(){
        $("#getStartedOne").hide();
        $("#getStartedTwo").show();
        RDD.operations.register(function(){
            setTimeout(function(){
                RDD.operations.updateBalance(pri.started);
            }, 2000)

        });

    };

    pri.renderOperation = function(operationName, buttonId, messageId){
        var operationList = exports.site.accountData.operationList;

        dbg(operationList);
        //operationList[operationName] = true;
        if(operationList[operationName] === undefined){
            return;
        }

        if(operationList[operationName] === true){
            $(buttonId).hide();
            $(messageId).show();
        }
        else {
            $(buttonId).show();
            $(messageId).hide();
        }
    };

    pri.saveSettings = function(){
        var message = {
            method: "updateSettings"
        };

        if($("#hideCommentsSetting").is(':checked')){
            pri.currentSettings.hideBotComments = true;
        }
        else {
            pri.currentSettings.hideBotComments = false;
        }

        message.settings = pri.currentSettings
        exports.helpers.message(message);
    };

    pub.renderSettings = function(settings){
        pri.currentSettings = settings;

        $("#hideCommentsSetting").prop('checked', settings.hideBotComments);
    };

    pri.bindSettings = function(){
        $("#hideCommentsSetting").change(pri.saveSettings);
    };

    pub.renderOperationProgress = function(){

        pri.renderOperation("updateBalance", "#rddUpdateBalanceButton",      ".balanceUpdateInProgress");
        pri.renderOperation("updateHistory", "#rddUpdateTransactionsButton", ".historyUpdateInProgress");
    };

    pub.bind = function(){

        $(".reddSettingsTabLink").click(function(){
            var $tabLink = $(this);
            pub.openTab($tabLink);
        });

        $(".reddSettingsTabLink:last").trigger("click");

        $("#rddUpdateBalanceButton").click(RDD.operations.updateBalance);
        $("#rddUpdateTransactionsButton").click(RDD.operations.updateHistory);
        $("#rddDoWithdrawalButton").click(RDD.operations.withdrawGui);

        $("#rddGetStartedButton").click(pri.getStarted);

        pri.bindSettings();
    };

    exports.settingsGui = pub;
})(RDD);