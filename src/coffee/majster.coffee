class Majster
    widgets = {}
    attributes = {}

    controller: (widgetId, arg1, arg2) ->
        callback = if isFunction arg1 then arg1 else arg2
        params = if isArray arg1 then arg1 else []

        throw 'first parameter (widgetId) is not defined' if isUndefined widgetId
        throw "callback is not a function. widgetId #{ widgetId }" if not isFunction callback
        throw "widgetId #{ widgetId } already defined" if not isUndefined widgets[widgetId]

        widgets[widgetId] =
            callback : callback
            params : params
            name : widgetId,
            type : 'widget'

        this

    task: (name, arg1, arg2) ->
        throw "task is already defined: #{name}" if widgets["majster:task:#{name}"]
        params = [arg1] if isString arg1
        params = arg1 if isArray arg1
        params = [] if isFunction arg1
        callback = arg1 if isFunction arg1
        callback = arg2 if isFunction arg2
        throw 'task not defined' if isUndefined callback

        widgets["majster:task:#{name}"] =
            callback : callback
            params : params
            name : name,
            type : 'task'
        this

    set: (name, callback) ->
        throw "Name restricted for framework #{ name }" if name is '$data' or name is '$element'
        attributes[name] = callback
        this

    scan: ($element) ->
        map $element,$element.attr 'widget' if not isUndefined $element.attr 'widget'

        for child in $element.find '[widget]'
            $child = $ child
            map $child, $child.attr 'widget'
        this

    run: (taskName) ->
        if isUndefined taskName
            for i,widget of widgets
                @run widget.name if widget.type is 'task'
        else
            throw "Task not defined #{taskName}" if isUndefined widgets["majster:task:#{taskName}"]
            map $(document),  "majster:task:#{taskName}"
        this

    parameters = ($element, $attr) ->
        params = []

        for attr in $attr
            param = switch attr
                when '$element' then $element
                when '$data' then $element.data()
                else
                    if isUndefined attributes[attr]
                        throw "Attribute #{ attr } not found for widget"
                    else
                        attributes[attr]

            params.push param

        params

    map = ($element, widgetId) =>
        widget = widgets[widgetId]
        throw "widget #{widgetId} not found" if isUndefined widget

        callback = widget.callback
        callback.apply {}, parameters $element,widget.params

app = new Majster
window.app = app

$ ->
 window.app.run()
 window.app.scan $ document


