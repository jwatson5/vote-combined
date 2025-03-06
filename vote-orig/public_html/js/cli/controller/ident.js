/*
** controller/ident.js
**  controller ident object
**  manages senator identification
**
*/

const ident = {
  init: () => {
    ident.getSenators();
    if(global.loglevel > 0) console.log('center/ident.js: init');
  },
  getSenators: () => {
    // results back from the server
    const processSenators = (m) => {
      if(formIdent.senators.length == 0) {
        if(global.loglevel > 1) console.log('server (senator-list): ' + JSON.stringify(m));
        formIdent.senators = m.message.data;
        formIdent.init();
      }
    };
    // send the senators request with callback
    calls.getSenators(processSenators);
  },
  login: (c) => {
    // results back from the server
    const processLogin = (m) => {
      if(global.loglevel > 0) console.log('controller/ident.login: login finished');
      if(global.loglevel > 1) console.log(m);
      if (m.message == 'badkey') {
        // bad key entered
        formIdent.effects.badKey();
      } else {
        formIdent.reset();
        calls.sse.start(); // start the server event listener
        global.refresh(m.message);
      }
    };
    // send the login with the callback
    calls.login(c, processLogin);
  },
  logout: function () {
    const processLogout = (m) => {
      if(global.loglevel > 0) console.log('controller/ident.logout: logout finished');
      if(global.loglevel > 1) console.log(m);
      calls.sse.stop(); // shutdown the server event listener
      global.refresh(m.message);
    };
    calls.logout(processLogout);
  }
};
