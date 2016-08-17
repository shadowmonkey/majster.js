class Interval
    intervals = {}

    start: (name) ->
        throw "Interval not defined: #{name}. Can't start" if not intervals[name]?
        throw "Interval is running #{name}. Can't start again" if intervals[name].interval?
        intervals[name].interval = setInterval intervals[name].callback, intervals[name].time
        this


    set: (name, time, callback) ->
        throw "Interval #{name} is running. Stop first to change" if intervals[name]? and intervals[name].interval?
        intervals[name] =
            callback : callback
            time :  time
            interval : null
        this

    stop: (name) ->
        throw "Interval not defined: #{ name } . Can't stop." if not intervals[name]?
        throw "Interval is not started #{ name }" if not intervals[name].interval?
        clearInterval intervals[name].interval
        intervals[name].interval = null
        this

app.set '$interval', new Interval