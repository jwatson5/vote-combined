/*
** view/statusBar.js
**  statusBar object ('#top-bar') in html
**  manages status bar ui logic and states
**
*/

const statusBar = {
  onPageLoad: function () {
    if(global.loglevel > 0) console.log('view/statusBar.js: onPageLoad');
    this.listeners();
  },
  init: function () {
    if(global.loglevel > 0) console.log('view/statusBar.js: init');
  },
  state: {
    change: function (state) {
      if(global.loglevel > 0) console.log('view/statusBar.js: state change: ' + state);
      this[state]();
    },
    needIdent: function () {
      $('#top-bar').hide();
    },
    vote: function () {
      $('#top-bar').show();
      // ident.id.key should always have something in in it
      //   shouldn't be called unless a session is active
      if (ident.id.key) {
        let h = 'Session Key: '
          + '<span class="font-bold">'
          + ident.id.key
          + '</span>';
        $('#top-bar-center > p').html(h);
      }
    }
  },
  updateUI: function () {
    if(global.loglevel > 2) console.log('view/statusBar.js: updateUI event - ' + vote.clients);
    // update the counters and other stuff not related to state
    $('#num-senators').html(vote.clients);
  },
  saveStatus: function (status) {
    if (status == "saving") {
      $("#top-bar-right > p").html("saving...");
    } else {
      $("#top-bar-right > p").html("All changes saved");
    }
  },
  message: {
    text: function (text) {
      $('#top-bar-center p').html(text);
    },
    color: function (c) {
      if (c == "blue") {
        $('#top-bar-center p').removeClass('bg-green');
        $('#top-bar-center p').addClass('bg-blue');
      } else {
        $('#top-bar-center p').removeClass('bg-blue');
        $('#top-bar-center p').addClass('bg-green');
      }
    }
  },
  listeners: function () {
    if(global.loglevel > 0) console.log('view/statusBar.js: listeners');
    $('#btn-logout-init').on('click', function (e) {
      if (global.util.button.isEnabled('#btn-logout-init')) {
        $('#modal-logout').modal();
      }
    });
    $('.btn-logout').on('click', function (e) {
      $.modal.close();
      if ($(this).html() == 'Yes') {
        ident.logout();
      }
    });
  }
};
