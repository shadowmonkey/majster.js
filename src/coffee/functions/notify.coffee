class Notify
    listeners = {}

    listen: (name, callback) ->
        if isUndefined listeners[name]
            listeners[name] =
                callbacks : []

        listeners[name].callbacks.push callback
        this

    send: (name, params) ->
        if not isUndefined listeners[name]
            for callback in listeners[name].callbacks
                callback params
        this

app.set '$notify',new Notify