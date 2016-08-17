app.set '$delay', {
    call : (time, callback) ->
        setTimeout callback, time
}