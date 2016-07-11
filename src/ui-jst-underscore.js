function UnderscoreJSTView() {
    var jst = window['JST'];
    if(js.isUndefined(window['JST'])) {
        throw new 'Can\' find JST';
    }
    var public =  {
        compile : function(templateName, data) {
            var template = jst[templateName];
            if(js.isDefined(template)) {
                return template(data);
            }
            else {
                throw new 'Can\'t find JST template : ' + templateName;
            }
        }
    };

    return public;
}