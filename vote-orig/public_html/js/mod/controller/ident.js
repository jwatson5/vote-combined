/*
** controller/ident.js
**  ident object
**  manages moderator identification
**
*/
let ident = {
  id: {},
  init: function () {
    if(global.loglevel > 0) console.log('controller/ident.js: init');
    this.id = {};
  },
  login: function (passwd, key) {
    const d = {
      passwd: passwd,
      key: key
    };
    calls.login(d);
  },
  logout: function () {
    calls.logout();
  }
};