var TOCWebSockets = function () {

    var websocketRuns = false;
    var failAjaxCallCounter = 0;
    var maxFailedAjaxCallsAllowed = 3;
    var ajaxCallIntervalId;

    var wsResponseIntervalId;

    var ws;

    function initWSConnection() {
       webSocketConnection();
       wsResponseIntervalId = window.setInterval(function(){
            ws.close();
            toastr.warning("Push notifications can't be initiated. The values are going to be updated every 5 second.", "Important information!");
            fallBackAJAXPoll();
            clearInterval(wsResponseIntervalId);
       }, 6000);
    }

    function webSocketConnection() {
    if ("WebSocket" in window) {
        $.ajax({
            type: 'POST',
            dataType: 'json',
            url: '/panel/websocket',
            success: function (data) {
                //conditionaly update values = depending on page
                console.log(data);
                if(data.allowed) {
                    startWebSocketClient(data);
                } else {
                    toastr.warning("Push notifications can't be initiated. The values are going to be updated every 5 second.", "Important information!");
                    fallBackAJAXPoll();
                }
            }
        });
    } else {
           toastr.success("Push notification can't be initiated. The values are going to be updated every 5 second.", "WebSocket NOT supported by this Browser");
           console.log("WebSocket NOT supported by this Browser!");
           fallBackAJAXPoll();
        }
    }

    function startWebSocketClient(data) {
               ws = new WebSocket(data.url);

               ws.onopen = function()
               {
                  console.log("Message is sent: "+JSON.stringify(data));
                  ws.send(JSON.stringify(data));
                  websocketRuns = true;
               };

               ws.onmessage = function (evt)
               {
                  var received_msg = evt.data;
                  var incomingJsonObject = JSON.parse(received_msg);
                  console.log("Message is received: " + received_msg);
                  if(isWsHandshake(incomingJsonObject)) {
                    clearInterval(wsResponseIntervalId);
                  }
                  updateValues(incomingJsonObject);
               };

               ws.onclose = function()
               {
                  console.log("WS Connection is closed...");
                  websocketRuns = false;
                  fallBackAJAXPoll();
               };
    }

    function isWsHandshake(json) {
        if(!typeof json.handshakeConfirmed !== "undefined") {
            if(json.handshakeConfirmed) {
                return true;
            }
        }
        return false;
    }

    function countDirectValues(directId) {
        $("#quota-state-"+directId).html($("#"+directId +" tr").length);
    }

    function fallBackAJAXPoll() {
        if(ajaxCallIntervalId == null) {
            ajaxCallIntervalId = window.setInterval(function(){
                _AJAXFallbackNoWebsockets();
            }, 5000);
        }
    }

    function _AJAXFallbackNoWebsockets() {
        console.log("poll");
        $.ajax({
            url: "/panel/service/direct/values/poll",
            type : "POST"
        }).done(function(data, textStatus, jqXHR) {
            console.log(JSON.stringify(data));
            updateValues(data);
            toastr.info("Source values had been updated","", {"timeOut": "500"});
            failAjaxCallCounter = 0;
        }).fail(function(jqXHR, textStatus, errorThrown) {
            toastr.error("Can't fetch the recent sources value.", "Values polling error!", {"timeOut": "2000"});
            failAjaxCallCounter = failAjaxCallCounter + 1;
            if(failAjaxCallCounter >= maxFailedAjaxCallsAllowed) {
                toastr.error("Can't fetch the recent sources value. Gave up trying!", "Values polling error!", {"timeOut": "10000"});
                clearInterval(ajaxCallIntervalId);
            }
        });
    }

    function _createNewValueRecord(directAddress, valueName, valueValue, valueTime, directId) {
        var valueId = _buildValueId(directAddress, valueName);
        var timeId = _buildTimeId(directAddress, valueName);
        var nameId = _buildNameId(directAddress, valueName);
        var recordedId = _buildRecordedId(directAddress, valueName);
        var link = _buildLink(directAddress, valueName, directId);
        var valueCol1 = "<td><span id=\""+recordedId+"\" class=\"badge badge-danger\">R</span>&nbsp;<a href=\"javascript:;\" id=\""+nameId+"\" data-toggle=\"modal\" data-toc-load=\""+link+"\" data-target=\"#value\" data-remote=\"false\">"+valueName+"</a></td>";
        var valueCol2 = "<td><p data-toggle=\"tooltip\" title=\"2016-02-17T19:10:18.638Z\" id=\""+valueId+"\">"+valueValue+"</p></td>";
        var valueCol3 = "<td><p data-toggle=\"tooltip\" title=\"2016-02-17T19:10:18.638Z\" id=\""+timeId+"\">"+valueTime+"</p></td>";
        var valueRow = "<tr>"+valueCol1+valueCol2+valueCol3+"</tr>";
        return valueRow;
    }

    function _buildLink(directAddress, valueName, directId) {
        return "/panel/ajax/service/direct/value/"+directAddress+"@"+valueName+"@"+directId;
    }

    function _buildRecordedId(directAddress, valueName) {
        return directAddress+"-"+valueName+"-recorded";
    }

    function _buildValueId(directAddress, valueName) {
        return directAddress+"-"+valueName+"-value";
    }

    function _buildTimeId(directAddress, valueName) {
        return directAddress+"-"+valueName+"-time";
    }

    function _buildNameId(directAddress, valueName) {
        return directAddress+"-"+valueName+"-name";
    }

    function updateValues(data) {
        for (var directId in data.directValues) {
            var directValuesArray = data.directValues[directId].values;
            for (var i = 0; i < directValuesArray.length; i++) {
                   _performValuesUpdate(directId, directValuesArray[i].name, directValuesArray[i].value, directValuesArray[i].dateformated, data.directValues[directId].directUUID);
            }
        }
        console.log(data);
    }

    function _performValuesUpdate(directAddress, valueName, valueValue, valueTime, directId) {
        var valueId = _buildValueId(directAddress, valueName);
        var timeId = _buildTimeId(directAddress, valueName);
        var nameId = _buildNameId(directAddress, valueName);

        if($("#" + _buildNameId(directAddress, valueName)).length == 0) {
           //populate row if doesnt exist
           var row = _createNewValueRecord(directAddress, valueName, valueValue, valueTime, directId);
           $("#" + directAddress).append(row);
           countDirectValues(directAddress);
        } else {
            //update only values otherwise
            $("#" + _buildTimeId(directAddress, valueName)).html(valueTime);
            $("#" + _buildValueId(directAddress, valueName)).html(valueValue);
        }
    }

    return {
        //main function to initiate the module
        init: function () {
           toastr.options = {
                  "closeButton": false,
                  "debug": false,
                  "newestOnTop": true,
                  "progressBar": true,
                  "positionClass": "toast-top-center",
                  "preventDuplicates": true,
                  "onclick": null,
                  "showDuration": "100",
                  "hideDuration": "1000",
                  "timeOut": "8000",
                  "extendedTimeOut": "1000",
                  "showEasing": "swing",
                  "hideEasing": "linear",
                  "showMethod": "fadeIn",
                  "hideMethod": "fadeOut"
            };
            initWSConnection();
        }
    };

}();