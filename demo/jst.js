this["JST"] = this["JST"] || {};

this["JST"]["templates/chat-entry.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<p class="entry">' +
((__t = (name)) == null ? '' : __t) +
': ' +
((__t = (text)) == null ? '' : __t) +
'</p>';

}
return __p
};