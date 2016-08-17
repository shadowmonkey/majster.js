app.controller 'auto-scan',['$element'], ($component) ->
    MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
    observer = new MutationObserver (mutations) ->
        for mutation in mutations
            for node in mutation.addedNodes
                app.scan $ node

    observer.observe $component.get(0), { attributes : true, childList : true, subtree : true }