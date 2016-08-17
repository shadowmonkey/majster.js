isUndefined = (x) ->
    not x?

isFunction = (x) ->
    x and {}.toString.call(x) is '[object Function]'

isArray = (x) ->
    x and {}.toString.call(x)  is '[object Array]'

isString = (x) ->
    x and {}.toString.call(x)  is '[object String]'




