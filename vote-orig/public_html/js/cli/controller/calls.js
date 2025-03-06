/*
** calls.js
** object to handle calls to server
**  this file was setup to allow for
**  different server call methods (ie socket, ajax, etc)
**
*/

const calls = {
  init: () => {
    if(global.loglevel > 0) console.log('controller/calls.init: init start');
    // get an initial status from server
    calls.ajax('GET', '/main/refresh', null, (d) => {
      global.refresh(d.message);
    });
  },
  sse: {
    connection: null,
    reconnect: {trys: 0, max: 3},
    start: () => {
      calls.sse.connection = new EventSource("/main/events");
      calls.sse.connection.onmessage = (event) => {
        try {
          const info = JSON.parse(event.data);
          if(global.loglevel > 0) console.log("received event from the server");
          if(global.loglevel > 1) console.log(info);
          const mtype = Object.getOwnPropertyNames(info)[0];
          switch(mtype) {
            case "close":
              // server want to quit
              ident.logout();
              break; 
            case "op":
              if(info.op == 'vote-update') {
                global.serverSession = info.update.serverSession;
                vote.info = info.update.vote;
                vote.currentVote = null;
                global.state.change();
              }   
      
              break;
            default:
              // this would be a logging event
              if(global.loglevel > 0) console.log(info);
          };
        } catch (e) {
          console.error(e);
        }
      };
      calls.sse.connection.onerror = () => {
        if(calls.sse.reconnect.trys > calls.sse.reconnect.max) {
          calls.sse.stop();
        } else {
          calls.sse.reconnect.trys++;
        }
      };
    },
    stop: () => {
      if(calls.sse.connection) {
        calls.sse.connection.close();
        if(global.loglevel > 0) console.log("calls.js: eventsource connection closed");
      }
    },
  },
  ajax: (method, route, bData, callback) => {
    const xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        const data = JSON.parse(this.responseText);
        if(global.loglevel > 0) console.log({method: method, route: route});
        if(global.loglevel > 1) console.log(data);
        if (data.stat) {
          // no error from the server
          callback(data);
        } else {
          // server didn't like the request
          if(global.loglevel > 0) console.log('controller/calls.ajax reject stat');
          if(global.loglevel > 1) console.log(data);
        }
      }
    };
    xhttp.open(method, route, true);
    xhttp.setRequestHeader("Content-type", "application/json");
    if(bData) xhttp.send(JSON.stringify(bData));
    else xhttp.send();
  },
  login: (d, processLogin) => {
    if(global.loglevel > 0) console.log('controller/calls.login: login start');
    if(global.loglevel > 1) console.log(d);
    // make the call and wait for response
    calls.ajax("POST", "/auth/login", d, processLogin);    
  },
  logout: (processLogout) => {
    if(global.loglevel > 0) console.log('controller/calls.logout: logout start');
    // make the call and wait for response
    calls.ajax("GET", "/auth/logout", null, processLogout);    
  },
  getSenators: (processSenators) => {
    if(global.loglevel > 0) console.log('controller/calls.getSenators: getSenators start');
    calls.ajax("GET", "/main/senator-list", null, processSenators);
  },
  castVote: (v, processVote) => {
    if(global.loglevel > 0) console.log('controller/calls.castVote: a vote was cast');
    calls.ajax("PUT", "/vote/cast", v, processVote);
  },
  pollforStart: {
    timer: null,
    start: () => {
      calls.pollforStart.timer = setInterval(() => {
        calls.ajax('GET', '/main/refresh', null, (d) => {
          if(d.message.serverSession) {
            calls.pollforStart.stop();
            global.refresh(d.message);
          }
        });
      }, 6243);
    },
    stop: () => {
      clearInterval(calls.pollforStart.timer);
    }
  }
};


// original socket calls
    /* 
    
    //from global.globalListeners
    socket.on('mult-logins', function (data) {
      if(global.loglevel > 0) console.log('[from]server (mult-logins): ' + JSON.stringify(data));
      global.refresh(data);
      $('#modal-dup-voter').modal();
    });
    socket.on('server-change', function (data) {
      if(global.loglevel > 0) console.log('[from]server (in-session): ' + JSON.stringify(data));
      if (data.logout) {
        global.init();
      } else {
        global.serverSession = data.serverSession;
        vote.info = data.vote;
        vote.currentVote = null;
        global.state.change();
      }
    });

    // from global.init
        // emmitted on connection from server to
    //   update session information
    socket.on('refresh', function (data) {
      if(global.loglevel > 0) console.log('from server (refresh): ' + JSON.stringify(data));
      if (data.stat) {
        global.refresh(data.message);
      }
    });

    // from controller vote.js
        socket.emit('cast-vote', v, function (data) {
     if(data.stat) {
        if(data.message == "unvote") {
          vote.currentVote = null;
        } else {
          vote.currentVote = v;
        }
        vote.hasVoted = true;
        formVote.selectCandidate(e);
      }

      // from ident.js getSenators
      socket.emit('senator-list', {}, function (data) {
        if(global.loglevel > 0) console.info('server (senator-list): ' + JSON.stringify(data));
        if (data.stat) {
          formIdent.senators = data.message.data;
          formIdent.init();
        }
      });



    });

    //from ident.js login
        socket.emit('login', c, function (data) {
      if(global.loglevel > 0) console.info('server (login): ' + JSON.stringify(data));
      if (data.stat) {
        if (data.message == 'badkey') {
          // bad key entered
          formIdent.effects.badKey();
        } else {
          formIdent.reset();
          global.refresh(data.message);
          // global.ident = data.message;
          // global.state.change();
        }
      }
    });

    // from ident.js logout
        socket.emit('logout', {}, function(data) {
      if(global.loglevel > 0) console.info('server (logout): ' + JSON.stringify(data));
      if(data.stat) {
        global.refresh(data.message);
      }
    });


    */
