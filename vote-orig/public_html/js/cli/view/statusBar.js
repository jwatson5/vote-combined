/*
** statusBar.js
**  statusBar object ('#top-bar') in html
**  manages status bar ui logic and states
**
*/

const statusBar = {
  onPageLoad: function() {
    if(global.loglevel > 0) console.log('statusBar.js: onPageLoad');
    this.listeners();
  },
  state: {
    change: function(state) {
      if(global.loglevel > 0) console.log('statusBar.js: state change: ' + state);
      if(state == "vote") {
        this.vote();
      } else {
        this.other();
      }
    },
    vote: function() {
      $('#top-bar').show();
    },
    other: function() {
      $('#top-bar').hide();
    }
  },
  message: {
    text: function(text) {
      $('#top-bar-center p').html(text);
    },
    color: function(c) {
      if(c == "blue") {
        $('#top-bar-center p').removeClass('bg-green');
        $('#top-bar-center p').addClass('bg-blue');
      } else {
        $('#top-bar-center p').removeClass('bg-blue');
        $('#top-bar-center p').addClass('bg-green');
      }
    }
  },
  listeners: function() {
    $('#btn-logout-init').on('click', function(e) {
      if(global.util.button.isEnabled('#btn-logout-init')) {
        if(global.loglevel > 0) console.log('statusBar.js: button-logout-init clicked');
        $('#modal-logout').modal();
      }
    });
    $('.btn-logout').on('click', function(e) {
      if(global.loglevel > 0) console.log('statusBar.js: button-logout clicked');
      $.modal.close();
      if($(this).html() == 'Yes') {
        ident.logout();
      }
    });
  }
};
