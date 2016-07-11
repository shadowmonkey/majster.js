var TOCWebSocketsShare = function () {

    var expirationTime = $(".page-content-wrapper").data("expiration");
    var sessionId = $(".table").data("toc-sessionid");

    var webSocketInitData;

    var wsConnectionMonitorId;
    var wsConnectionIssuesCounter = 0;
    var ws;
    //this is getting set for a fraction of second to prevent disable/frozen state to be overridden
    var rejectMessage = false;
    var rejectMessageId;

    function initWSConnection() {
       fetchWebSocketConnectionData();
    }

    function wsConnectionMonitor() {
        console.log("A");
        if(typeof ws !== "undefined") {
                console.log("B");
            if (ws.readyState === 1) {
            console.log("C");
                //connection is here
                //do not have to do anything
                wsConnectionIssuesCounter = 0;
            } else {
            console.log("D");
                // something gone wrong - connection lost?
                ws.close();
                wsConnectionIssuesCounter = wsConnectionIssuesCounter + 1;
                if(wsConnectionIssuesCounter == 3) {
                    window.location.reload(true);
                }
                $("#values-broadcasting").hide();
                startWebSocketClient(webSocketInitData);
            }
        } else {
        console.log("E");
            //no connection at all - create one
            startWebSocketClient(webSocketInitData);
        }
    }

    function fetchWebSocketConnectionData() {
    if ("WebSocket" in window) {
        if(typeof sessionId !== "undefined") {
            $.ajax({
                type: 'POST',
                dataType: 'json',
                url: '/quickview/ws/subscribe/'+sessionId,
                success: function (data) {
                    if(data.allowed) {
                            console.log("Data: " + data);
                        webSocketInitData = data;
                        wsConnectionMonitor();
                        wsConnectionMonitorId = window.setInterval(wsConnectionMonitor, 4000);
                    } else {
                        toastr.warning("Push notifications can't be initiated.", "Important information!");
                    }
                }
            });
        }
    } else {
           toastr.success("Push notification can't be initiated.", "WebSocket NOT supported by this Browser");
           console.log("WebSocket NOT supported by this Browser!");
        }
    }

    function updateValuesAfterRecoveringFromOffline() {
        $.ajax({
            type: 'POST',
            dataType: 'json',
            url: '/quickview/direct/allvalues/'+sessionId,
            success: function (data) {
                console.log("Update Direct Data: " + data);
                updateValues(data);
            }
        });
    }

    function startWebSocketClient(data) {
               ws = new WebSocket(data.url);

               ws.onopen = function()
               {
                  console.log("Message is sent: "+JSON.stringify(data));
                  ws.send(JSON.stringify(data));
               };

               ws.onmessage = function (evt)
               {
                  var received_msg = evt.data;
                  var incomingJsonObject = JSON.parse(received_msg);
                  console.log("Message is received: " + received_msg);
                  if(!rejectMessage) {
                      checkDeleteDirect(incomingJsonObject);
                      checkExpiration(incomingJsonObject);
                      updateValues(incomingJsonObject);
                      deleteValues(incomingJsonObject);
                      checkUpdateAllValuesCondition(incomingJsonObject);
                  }
               };

               ws.onclose = function()
               {
                  console.log("WS Connection is closed...");
               };
    }

    function _createNewValueRecord(directAddress, valueName, valueValue, valueTime, directId) {
        var valueId = _buildValueId(directAddress, valueName);
        var timeId = _buildTimeId(directAddress, valueName);
        var nameId = _buildNameId(directAddress, valueName);
        var rowId = _buildRowId(directAddress, valueName);
        var valueCol1 = "<td><p id=\""+nameId+"\">"+valueName+"</p></td>";
        var valueCol2 = "<td><p id=\""+valueId+"\">"+valueValue+"</p></td>";
        var valueCol3 = "<td><p id=\""+timeId+"\">"+valueTime+"</p></td>";
        var valueRow = "<tr id=\""+rowId+"\">"+valueCol1+valueCol2+valueCol3+"</tr>";
        return valueRow;
    }

    function _buildValueId(directAddress, valueName) {
        return directAddress+"-"+valueName+"-value";
    }

    function _buildRowId(directAddress, valueName) {
        return directAddress+"-"+valueName+"-row";
    }

    function _buildTimeId(directAddress, valueName) {
        return directAddress+"-"+valueName+"-time";
    }

    function _buildNameId(directAddress, valueName) {
        return directAddress+"-"+valueName+"-name";
    }

    function checkDeleteDirect(data) {
        var directId = $(".table").data("toc-directaddress");
        if (typeof data.delete !== 'undefined') {
            for (var i in data.delete) {
                console.log("DELETE: " + data.delete[i]);
                if(directId == data.delete[i]) {
                    $(".table").hide();
                    ws.close();
                    window.location.reload(true);
                }
            }
        }
            //toastr.warning("Link Expired.", "That is all folks!");
            //ws.close();
            //window.location.reload(true);
    }

    function checkExpiration(data) {
        if(data.currentTime > expirationTime) {
            toastr.warning("Link Expired.", "That is all folks!");
            ws.close();
            window.location.reload(true);
        }
    }

    function checkUpdateAllValuesCondition(data) {
        for (var directId in data.directValues) {
            if (typeof data.directValues[directId].values === 'undefined' && data.directValues[directId].online) {  // the values might not be there in some cases if this is the case read only direct state: frozen or disabled
                updateValuesAfterRecoveringFromOffline();
            }
        }
    }

    function updateValues(data) {
        for (var directId in data.directValues) {
            if (typeof data.directValues[directId].values !== 'undefined') {  // the values might not be there in some cases if this is the case read only direct state: frozen or disabled
                var directValuesArray = data.directValues[directId].values;
                for (var i = 0; i < directValuesArray.length; i++) {
                    _performValuesUpdate(directId, directValuesArray[i].name, directValuesArray[i].value, directValuesArray[i].dateformated, data.directValues[directId].directUUID);
                }
            }
            updateDirectState(data.directValues[directId]);
        }
    }

    function deleteValues(data) {
        for (var directId in data.deleteValues) {
            if (typeof data.deleteValues[directId].values !== 'undefined') {
                var deleteValuesArray = data.deleteValues[directId].values;
                for (var i = 0; i < deleteValuesArray.length; i++) {
                       _performValuesDelete(directId, deleteValuesArray[i].name);
                }
            }
            updateDirectState(data.deleteValues[directId]);
        }
    }
   //  {"currentTime":1465737424269,"broadcasting":true,"online":true,
   //"directUUID":"D-5af8808c-886a-4231-9420-dd776285ba68-35166"}
    function updateDirectState(data) {
        if(!data.broadcasting || !data.online) {
            rejectMessage = true;
            rejectMessageId = window.setInterval(function() {
                rejectMessage = false;
                clearInterval(rejectMessageId);
            }, 500);
        }
        //expiration: data.currentTime
        if(data.broadcasting) {
            $("#values-broadcasting").show();
        } else {
            $("#values-broadcasting").hide();
        }
        if(data.online) {
          $("#values-table").show();
          $("#values-offline").hide();
        } else {
          $("#values-table").hide();
          $("#values-offline").show()
        }
                  //  #values-disconnected
                    //todo update state here frozen or disabled
    }

    function _performValuesDelete(directAddress, valueName) {
        var rowId = _buildRowId(directAddress, valueName);
        console.log(rowId);
        $("#"+rowId).remove();
    }

    function _performValuesUpdate(directAddress, valueName, valueValue, valueTime, directId) {
        var valueId = _buildValueId(directAddress, valueName);
        var timeId = _buildTimeId(directAddress, valueName);
        var nameId = _buildNameId(directAddress, valueName);

        if($("#" + _buildNameId(directAddress, valueName)).length == 0) {
           //populate row if doesnt exist
           var row = _createNewValueRecord(directAddress, valueName, valueValue, valueTime, directId);
           $("#" + directAddress).append(row);
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