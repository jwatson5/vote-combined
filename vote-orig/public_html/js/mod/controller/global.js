/*
** controller/global.js
** sessionController object
**  manages moderator session
**
*/

let global = {
  loglevel: 2, // 0-3 increasing in verbosity
  components: new Array(),
  onPageLoad: function () {
    if(global.loglevel > 0) console.log('controller/global.onPageLoad: onPageLoad start');

    // check here if browser has eventsource compat
    if(typeof(EventSource) !== "undefined") {
      if(global.loglevel > 0) console.log("Yes! Server-sent events support!");
    } else {
      if(global.loglevel > 0) console.log("Sorry! No server-sent events support..");
    }
 
    this.init();
    if(global.loglevel > 0) console.log('controller/global.onPageLoad: onPageLoad finish');
  },
  init: function () {
    // controller objects
    if(global.loglevel > 0) console.log('controller/global.init: init start');

    // init views and add to array
    this.components = new Array();
    this.components.push(statusBar); // view/statusBar.js
    this.components.push(formIdent); // view/ident.js
    this.components.push(votePane); // view/vote-pane.js

    // run onPageLoad for the differents ui components
    for (let i = 0; i < this.components.length; i++) {
      if (typeof this.components[i].onPageLoad === "function") {
        this.components[i].onPageLoad();
      }
    }

    // global init should do nothing until it gets a status 
    //   update from the server and refresh is called
    // calls init sends a refresh to the server
    //   when done, it will call this.refresh();
    calls.init();

    if(global.loglevel > 0) console.log('controller/global.init: init finished');
  }, 
  refresh: function (data) {
    if(global.loglevel > 0) console.log('controller/global.refresh: refresh start');
    if(global.loglevel > 1) console.log(data);
    ident.id = data.ident;
    if(global.loglevel > 1) console.log(data.ident);
    vote.clients = data.clientCount || 0;
    vote.voteCount = data.voteCount || 0;
    vote.info = data.vote;
    global.updateUI();
    if(global.loglevel > 0) console.log('controller/global.refresh: controller update state');
    global.state.change();
  },
  //getServer: function () {  // is not used, get rid of 3/1/2023
  //  calls.statCheck();
  //},
  state: {
    change: function () {
      // ui states are: needIdent, vote
      let state = "needIdent";
      if (ident.id.email) {
        state = "vote";
        if(global.loglevel > 0) console.log('vote would be initializing here');
        vote.init(); // controller/vote.js
      }
      if(global.loglevel > 1) console.log('controller/global.js: state change is - ' + state);
      // change all the registered components to the new state
      for (let i = 0; i < global.components.length; i++) {
        if (typeof global.components[i].state.change === "function") {
          global.components[i].state.change(state);
        }
      }
    }
  },
  updateUI: function () {
    for (let i = 0; i < global.components.length; i++) {
      if (typeof global.components[i].updateUI === "function") {
        global.components[i].updateUI();
      }
    }
  },
  setConfig: function (status) {
    calls.setConfig(status);
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
  }
};
