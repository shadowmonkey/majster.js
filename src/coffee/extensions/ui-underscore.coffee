class UnderscoreUI

    constructor: (@jst) ->
         throw "Can't find JST object" if not @jst?

    compile: (name, data) ->
        throw "Can't find template: #{name}" if not @jst[name]?
        @jst[name](data)

app.set '$view',new UnderscoreUI window.JST
