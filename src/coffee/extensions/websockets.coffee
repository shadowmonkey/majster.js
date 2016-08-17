class WebSocketFacade
    websockets = []

    send: (name, object) ->
        check name
        throw "Websocket #{name} is closed" if not websockets[name].started
        websockets[name].websocket.send object
        this

    start: (name) ->
        check name
        throw "Websocket #{name} already started" if websockets[name].started

        connection = new WebSocket websockets[name].url, websockets[name].protocols

        if websockets[name].open and {}.toString.call(websockets[name].open) is '[object Function]'
            connection.onopen = ->
                websockets[name].started = true
                websockets[name].open()

        if  websockets[name].message and {}.toString.call(websockets[name].message) is '[object Function]'
            connection.onmessage = websockets[name].message

        if  websockets[name].error and {}.toString.call(websockets[name].error) is '[object Function]'
            connection.onerror = websockets[name].error

        if  websockets[name].close and {}.toString.call(websockets[name].close) is '[object Function]'
            connection.onclose = ->
                websockets[name].started = false
                websockets[name].close()

        websockets[name].websocket = connection;
        this

    close: (name) ->
        check name
        throw "Websocket #{name} is closed already" if not websockets[name].started
        websockets[name].websocket.close()
        this

    get: (name) ->
        check name
        websockets[name]

    define: (name, url, protocols) ->
        throw 'WebSocket is not supported by browser' if not 'WebSocket' in window
        throw "Websocket #{name} is already defined" if websockets[name]?
        websockets[name] =
            url : url
            protocols : protocols
            started : false

        action =
            on: (name, callback) ->
                switch name
                    when 'open' then action.open callback
                    when 'message' then action.message callback
                    when 'close' then action.close callback
                    when 'error' then action.error callback
                    else throw "Action #{name} not found on $websocket"
                action
            open: (callback) ->
                websockets[name]['open'] = callback
                action
            message: (callback) ->
                websockets[name]['message'] = callback
                action
            close: (callback) ->
                websockets[name]['close'] = callback
                action
            error: (callback) ->
                websockets[name]['error'] = callback
                action

    check = (name) ->
        throw 'Name parameters is missing' if not name?
        throw "Can't find websocket #{name}" if not websockets[name]?


app.set '$websocket', new WebsocketFacade
