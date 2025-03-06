/*
** view/forms/ident.js
**  ident ui management object
**
*/

let formIdent = {
  tmpCred: {},
  senators: new Array(),
  init: function () {
    if(global.loglevel > 0) console.log('view/forms/ident.js: init');
    global.util.button.disable('#btn-login');
    this.listeners()
  },
  effects: {
    badKey: function () {
      global.util.button.disable('#btn-login');
      delete formIdent.tmpCred.key;
      $('#inp-key').val("");
      $('#inp-key').attr("disabled", true);
      $('#inp-key').addClass("white-placeholder");
      $('#inp-key').attr("placeholder", "incorrect key");
      $('#inp-key').css("background-color", "rgb(255, 87, 51");
      $('#inp-key').animate({ backgroundColor: 'rgb(255, 255, 255)' }, 1500, function () {
        $('#inp-key').removeClass("white-placeholder");
        $('#inp-key').attr("placeholder", "session key");
        $('#inp-key').attr("disabled", false);
        $('#inp-key').focus();
        $('#inp-key').trigger('keyup');
      });
    }
  },
  reset: function () {
    this.tmpCred = {};
    $('#inp-senator').val('');
    $('#inp-key').val('');
    global.util.button.disable('#btn-login');
  },
  listeners: function () {
    $('#btn-login').on('click', function (e) {
      if (global.util.button.isEnabled('#btn-login')) {
        if(global.loglevel > 1) console.log('center/ident.js: ' + $(this).attr('id') + ' event');
        formIdent.tmpCred.key = $('#inp-key').val();
        ident.login(formIdent.tmpCred);
        if(global.loglevel > 1) console.log('center/ident.js [' + $(this).attr('id') + ']: tmpCred = ' + JSON.stringify(ident.tmpCred));
      }
    });
    $('#inp-key').on('keyup', function (e) {
      let key = $(this).val();
      if (key.length > 2 && formIdent.tmpCred.email) {
        global.util.button.enable('#btn-login');
        if (e.keyCode === 13) { // enter key
          $('#btn-login').trigger('click');
        }
      } else {
        global.util.button.disable('#btn-login');
      }
    });
    $('#inp-senator').on('focus', function (e) {
      // this event ensures valid selection from autocomplete
      if(global.loglevel > 1) console.log('center/ident.js: inp-senator focus event');
      $(this).val('');
      delete formIdent.tmpCred.name;
      delete formIdent.tmpCred.email;
      $('#inp-key').trigger('keyup');
      if(global.loglevel > 1) console.log('center/ident.js [inp-senator foc]: ' + JSON.stringify(global.ident));
    });
    $('#inp-senator').on('blur', function (e) {
      if(global.loglevel > 1) console.log('center/ident.js: inp-senator blur event');
      if (!formIdent.tmpCred.email) {
        $(this).val('');
        delete formIdent.tmpCred.name;
        delete formIdent.tmpCred.email;
        $('#inp-key').trigger('keyup');
      }
    });
    $('#inp-senator').autocomplete({
      visibleLimit: 5,
      source: [{ data: formIdent.senators }],
      getTitle: function (item) {
        return item.value;
      }
    }).on('selected.xdsoft', function (e, suggestion) {
      if(global.loglevel > 1) console.log('center/ident.js: selected.xdsoft event ' + JSON.stringify(suggestion));
      formIdent.tmpCred.name = suggestion.value;
      formIdent.tmpCred.email = suggestion.data;
      $('#inp-key').focus();
      $('#inp-key').trigger('keyup');
      if(global.loglevel > 1) console.log('center/ident.js [inp-senator ac]: ' + JSON.stringify(global.ident));
    });
  }
}