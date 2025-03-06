/*
** global.js
**  global controller object
**  manages senator states and logic
**
*/

let global = {
  loglevel: 0, // 0-3 increasing in verbosity
  compatiblity: false,
  ident: {},
  serverSession: false,
  views: new Array(),
  onPageLoad: function () {
    if(global.loglevel > 0) console.log('controller/global.onPageLoad: onPageLoad start');

    // check here if browser has eventsource compat
    if(typeof(EventSource) !== "undefined") {
      if(global.loglevel > 0) console.log("Yes! Server-sent events support!");
      global.compatiblity = true;

      global.globalListeners();
    }

    // initialize the global object and loads views
    global.views.push(statusBar);
    global.views.push(centerPanel);
    for (let i = 0; i < global.views.length; i++) {
      if (typeof global.views[i].onPageLoad === "function") {
        global.views[i].onPageLoad();
      }
    }

    // initialize global
    global.init();
  },
  init: function () { // initialize the page
    if(global.loglevel > 0) console.log('global.js: init');
    calls.init();
    
    /*this.refresh({
      ident: {},
      serverSession: false,
      vote: null
    });*/
  },
  state: {
    change: () => {
      // ui states are: singleMessage, needIdent, vote
      // singleMessage - global.compatibility = any value
      let state = 'singleMessage';
      if(global.compatiblity && global.serverSession) {
        if (!global.ident.email) {
          state = 'needIdent';
        } else {
          state = 'vote';
        }
      }

      if(global.loglevel > 1) console.log('contoller.js: state change is - ' + state);
      // change all the registered views to the new state
      for (let i = 0; i < global.views.length; i++) {
        global.views[i].state.change(state);
      }
    }
  },
  util: {
    button: {
      enable: function (id) {
        $(id).removeClass('disabled');
        $(id).addClass('btn-link');
      },
      disable: function (id) {
        $(id).removeClass('btn-link');
        $(id).addClass('disabled');
      },
      isEnabled: function (id) {
        if ($(id).hasClass('btn-link')) {
          return true;
        } else {
          return false;
        }
      }
    }
  },
  globalListeners: function () {
    $('.btn-modal-ok').on('click', function (e) {
      $.modal.close();
    });
  },
  refresh: function (data) {
    global.ident = data.ident;
    global.serverSession = data.serverSession;
    vote.info = data.vote;
    vote.currentVote = data.currentVote;
    global.state.change();
  }
};
