/*
** view/formIdent.js
**  ident form object to show in center pane
**  manages moderator identification
**
*/

const formIdent = {
  onPageLoad: function () {
    if(global.loglevel > 0) console.log('view/formIdent.js:: onPageLoad');
    formIdent.listeners();
    this.init();
  },
  init: function () {
    if(global.loglevel > 0) console.log('view/formIdent.js:: init');
    $('#inp-key').val('');
    $('#mod-pass').val('');
    global.util.button.disable('#btn-login');
  },
  state: {
    change: function (state) {
      if(global.loglevel > 0) console.log('view/formIdent.js: state change: ' + state);
      this[state]();
    },
    needIdent: function () {
      $('#ident-pane').show();
      $('#mod-pass').focus();
    },
    vote: function () {
      $('#ident-pane').hide();
    }
  },
  update: function (result) {
    if (result == "badpass") {
      // wrong password entered
      global.util.button.disable('#btn-login');
      this.effects.fadeRed("#mod-pass");
    } else {
      // successful login, reset form
      this.init();
    }
  },
  effects: {
    fadeRed: function (elemID) {
      $(elemID).val("");
      $(elemID).attr("disabled", true);
      $(elemID).addClass("white-placeholder");
      $(elemID).attr("placeholder", "incorrect password");
      $(elemID).css("background-color", "rgb(255, 87, 51");
      $(elemID).animate({ backgroundColor: 'rgb(255, 255, 255)' }, 1500, function () {
        $(elemID).removeClass("white-placeholder");
        $(elemID).removeAttr("placeholder");
        $(elemID).attr("disabled", false);
        $(elemID).focus();
        $(elemID).trigger('keyup');
      });
    }
  },
  listeners: function () {
    if(global.loglevel > 0) console.log('view/formIdent.js:: listeners');
    $('#btn-login').on('click', function (e) {
      if (global.util.button.isEnabled('#btn-login')) {
        if(global.loglevel > 0) console.log('view/formIdent.js: ' + $(this).attr('id') + ' event');
        ident.login($('#mod-pass').val(), $('#inp-key').val());
      }
    });
    $('#mod-pass, #inp-key').on('keyup', function (e) {
      const id = $(this).attr('id');
      let p = $('#mod-pass').val();
      let k = $('#inp-key').val();
      if (p.length > 2 && k.length > 2) {
        global.util.button.enable('#btn-login');
        if (e.keyCode == 13) {
          if (id == "inp-key") {
            $('#btn-login').trigger('click');
          }
        }
      } else {
        if (e.keyCode == 13) {
          if (id == "mod-pass") {
            $('#inp-key').focus();
          }
        }
        global.util.button.disable('#btn-login');
      }
    });
  }
};
