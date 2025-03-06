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
    const initD = (d) => {
      // callback with the voting data from the server
      global.refresh(d.message);
    };
    calls.ajax('GET', '/main/refresh', null, initD);
  },
  /* not used 3/1/2023
  refresh: function() {
  },
  statCheck: function() {
    const xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        const data = JSON.parse(this.responseText);
        if(global.loglevel > 1) console.log('server (stat-check)');
        if(global.loglevel > 1) console.log(data);
        if (data.stat) {
          global.refresh(data.message);
        }
      }
    };
    xhttp.open("METHOD", "/path", true);
    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.send();
  },
  */
  sse: {
    connection: null,
    reconnect: {trys: 0, max: 3},
    start: () => {
      calls.sse.connection = new EventSource("/main/modevents");
      calls.sse.connection.onmessage = (event) => {
        try {
          const info = JSON.parse(event.data);
          const mtype = Object.getOwnPropertyNames(info)[0];
          switch(mtype) {
            case "close":
              // server want to quit
              ident.logout();
              break; 
            case "op":
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
        if(global.loglevel > 0) console.log(
              'controller/calls.ajax ' + 
              method + ', ' + 
              route
        );
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
  setConfig: (status) => {
    if(global.loglevel > 0) console.log('calls.setConfig start');
    // change boolean status to object
    const d = {"status": status};
    if(global.loglevel > 1) console.log(status);
    const xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        const data = JSON.parse(this.responseText);
        if(global.loglevel > 0) console.log('controller/calls.js PUT /main/set-config');
        if(global.loglevel > 1) console.log(data);
        if (data.stat) {
          ident.id = data.message;
          if (ident.id.progress > 0) {
            voteMgr.config.restart();
          }
        }
      }
    };
    xhttp.open("PUT", "/main/set-config", true);
    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.send(JSON.stringify(d));
  },
  login: function(d) {
    if(global.loglevel > 0) console.log('controller/calls.login: login start');
    if(global.loglevel > 1) console.log(d);    
    const xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        const data = JSON.parse(this.responseText);
        if(global.loglevel > 0) console.log('controller/calls.js POST /auth/modlogin');
        if(global.loglevel > 1) console.log(data);
        if (data.stat) {
          // no error from the server
          if (data.message != 'badpass') {
            // successfull login, pass data to global refresh
            //   to establish ui to previous state
            global.refresh(data.message);
          }
          formIdent.update(data.message);
        }
      }
    };
    xhttp.open("POST", "/auth/modlogin", true);
    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.send(JSON.stringify(d));
  },
  logout: function() {
    if(global.loglevel > 0) console.log('controller/calls.logout: logout start');
    const xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        const data = JSON.parse(this.responseText);
        if(global.loglevel > 0) console.log('controller/calls.js POST /auth/modlogout');
        if(global.loglevel > 1) console.log(data);
        if (data.stat) {
          // stop the poll for client/vote counts
          //   refresh global ui - likely to the login screen
          vote.infoPoll.stop();
          // 3/2/23 - using sse, so terminate that connection
          calls.sse.stop();
          global.refresh(data.message);
        }
      }
    };
    xhttp.open("POST", "/auth/modlogout", true);
    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.send();
  },
  voteHistory: function() {
    const xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        const data = JSON.parse(this.responseText);
        if(global.loglevel > 0) console.log('controller/calls.js GET /vote/hist');
        if(global.loglevel > 1) console.log(data);
        if (data.stat) {
          vote.history = data.message;
          // update the view
          voteMgr.voteHist.populate(vote.history);
        }
      }
    };
    xhttp.open("GET", "/vote/hist", true);
    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.send();
  },
  voteStart: function(id) {
    if(global.loglevel > 0) console.log('calls.voteStart');
    if(global.loglevel > 1) console.log(id);
    const xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        const data = JSON.parse(this.responseText);
        if(global.loglevel > 0) console.log(`controller/calls.js GET /vote/control/${id}`);
        if(global.loglevel > 1) console.log(data);
        if (data.stat) {
          vote.voteCount = 0;
          vote.updateVoteUI();
          vote.persist.update(data.message);
        }
      }
    };
    xhttp.open("GET", `/vote/control/${id}`, true);
    xhttp.setRequestHeader("Content-type", "application/json");
    // body type needs to be JSON object
    xhttp.send();
  },
  voteStop: function(id) {
    if(global.loglevel > 0) console.log('calls.voteStop');
    if(global.loglevel > 1) console.log(id);
    const xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        const data = JSON.parse(this.responseText);
        if(global.loglevel > 0) console.log(`controller/calls.js DELETE /vote/control/${id}`);
        if(global.loglevel > 1) console.log(data);
        if (data.stat) {
          vote.persist.update(data.message);
        }
      }
    };
    xhttp.open("DELETE", `/vote/control/${id}`, true);
    xhttp.setRequestHeader("Content-type", "application/json");
    // body type needs to be JSON object
    xhttp.send();
  },
  voteRevote: function(id) {
    if(global.loglevel > 0) console.log('calls.voteRevote');
    if(global.loglevel > 1) console.log(id);
    const xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        const data = JSON.parse(this.responseText);
        if(global.loglevel > 0) console.log(`controller/calls.js PUT /vote/control/${id}`);
        if(global.loglevel > 1) console.log(data);
        if (data.stat) {
          vote.voteCount = 0;
          vote.updateVoteUI();
          vote.persist.update(data.message);
        }
      }
    };
    xhttp.open("PUT", `/vote/control/${id}`, true);
    xhttp.setRequestHeader("Content-type", "application/json");
    // body type needs to be JSON object
    xhttp.send();
  },
  voteAccept: function(id) {
    if(global.loglevel > 0) console.log('calls.voteAccept');
    if(global.loglevel > 1) console.log(id);
    const xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        const data = JSON.parse(this.responseText);
        if(global.loglevel > 0) console.log(`controller/calls.js POST /vote/control/${id}`);
        if(global.loglevel > 1) console.log(data);
        if (data.stat) {
          vote.persist.update(data.message);
        }
      }
    };
    xhttp.open("POST", `/vote/control/${id}`, true);
    xhttp.setRequestHeader("Content-type", "application/json");
    // body type needs to be JSON object
    xhttp.send();
  },
  voteReset: function(id) {
    if(global.loglevel > 0) console.log('calls.voteReset');
    if(global.loglevel > 1) console.log(id);
    const xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        const data = JSON.parse(this.responseText);
        if(global.loglevel > 0) console.log(`controller/calls.js PUT /vote/reset`);
        if(global.loglevel > 1) console.log(data);
        if (data.stat) {
          vote.info = null;
          vote.state.change();
        }
      }
    };
    xhttp.open("PUT", "/vote/reset", true);
    xhttp.setRequestHeader("Content-type", "application/json");
    // body type needs to be JSON object
    xhttp.send(JSON.stringify({'id': id}));
  },
  voteNew: function(v) {
    if(global.loglevel > 0) console.log('calls.voteNew');
    if(global.loglevel > 1) console.log(v);
    const xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        const data = JSON.parse(this.responseText);
        if(global.loglevel > 0) console.log(`controller/calls.js POST /vote/data/new`);
        if(global.loglevel > 1) console.log(data);
        if (data.stat) {
          vote.persist.update(data.message);
        }
      }
    };
    xhttp.open("POST", "/vote/data/new", true);
    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.send(JSON.stringify(v));
  },
  voteNewCandidate: function(c) {
    if(global.loglevel > 0) console.log('calls.voteNewCandidate');
    if(global.loglevel > 1) console.log(c);
    const xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        const data = JSON.parse(this.responseText);
        if(global.loglevel > 0) console.log(`controller/calls.js POST /vote/candidate`);
        if(global.loglevel > 1) console.log(data);
        // insert the candidate on the page
        voteBuild.candidateList.insertCandidate(data.message);
        setTimeout(function () {
          if (data.stat) {
            $('#top-bar-right p').removeClass('bg-green font-white');
            $('#top-bar-right p').html('All changes saved');
          } else {
            $('#top-bar-right p').removeClass('bg-green');
            $('#top-bar-right p').addClass('bg-alert');
            $('#top-bar-right p').html('Error saving');
          }
        }, 432);
      }
    };
    xhttp.open("POST", "/vote/candidate", true);
    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.send(JSON.stringify(c));
  },
  voteDelCandidate: function(d) {
    if(global.loglevel > 0) console.log('calls.voteDelCandidate');
    if(global.loglevel > 1) console.log(d);
    const xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        const data = JSON.parse(this.responseText);
        if(global.loglevel > 0) console.log(`controller/calls.js DELETE /vote/candidate`);
        if(global.loglevel > 1) console.log(data);
        setTimeout(function () {
          if (data.stat) {
            $('#top-bar-right p').removeClass('bg-green font-white');
            $('#top-bar-right p').html('All changes saved');
          } else {
            $('#top-bar-right p').removeClass('bg-green');
            $('#top-bar-right p').addClass('bg-alert');
            $('#top-bar-right p').html('Error saving');
          }
        }, 432);
      }
    };
    xhttp.open("DELETE", "/vote/candidate", true);
    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.send(JSON.stringify(d));
  },
  voteLoad: function(id) {
    if(global.loglevel > 0) console.log('calls.voteLoad');
    if(global.loglevel > 1) console.log(id);
    const xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        const data = JSON.parse(this.responseText);
        if(global.loglevel > 0) console.log(`controller/calls.js GET /vote/data/${id}`);
        if(global.loglevel > 1) console.log(data);
        if (data.stat) {
          vote.persist.update(data.message);
        }
      }
    };
    xhttp.open("GET", `/vote/data/${id}`, true);
    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.send();
  },
  voteDelete: function(id) {
    if(global.loglevel > 0) console.log('calls.voteDelete');
    if(global.loglevel > 1) console.log(id);
    const xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        const data = JSON.parse(this.responseText);
        if(global.loglevel > 0) console.log(`controller/calls.js DELETE /vote/data/${id}`);
        if(global.loglevel > 1) console.log(data);
        if (data.stat) {
          // this gets a new history for the table
          vote.history = data.message;
          voteMgr.voteHist.populate(vote.history);
        }
      }
    };
    xhttp.open("DELETE", `/vote/data/${id}`, true);
    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.send();
  },
  voteUpdate: function(v) {
    if(global.loglevel > 0) console.log('calls.voteUpdate');
    if(global.loglevel > 1) console.log(v);
    const xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        const data = JSON.parse(this.responseText);
        if(global.loglevel > 0) console.log(`controller/calls.js PUT /vote/data/${v.id}`);
        if(global.loglevel > 1) console.log(data);
        setTimeout(function () {
          if (data.stat) {
            $('#top-bar-right p').removeClass('bg-green font-white');
            $('#top-bar-right p').html('All changes saved');
          } else {
            $('#top-bar-right p').removeClass('bg-green');
            $('#top-bar-right p').addClass('bg-alert');
            $('#top-bar-right p').html('Error saving');
          }
        }, 432);
      }
    };
    xhttp.open("PUT", `/vote/data/${v.id}`, true);
    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.send(JSON.stringify({"title": v.title}));
  },
  voteData: function() {
    const xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        const data = JSON.parse(this.responseText);
        if(global.loglevel > 2) console.log('controller/calls.js GET /vote/info');
        if(global.loglevel > 2) console.log(data);
        if (data.stat) {
          vote.clients = data.message.clientCount;
          if (vote.info) {
            vote.voteCount = data.message.voteCount;
            vote.updateVoteUI();
          }
          global.updateUI();
        }
      }
    };
    xhttp.open("GET", "/vote/info", true);
    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.send();
  },
  facultyList: function() {
    const xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        const data = JSON.parse(this.responseText);
        if(global.loglevel > 0) console.log(`controller/calls.js GET /main/faculty-list`);
        if(global.loglevel > 1) console.log(data);
        if (data.stat) {
          vote.facultyList = data.message;
          voteBuild.candidateList.filterFacultyList(vote.info.candidates);
          voteBuild.candidateList.appendAdd();
          voteBuild.candidateList.positionListeners.addrem(s);
        }
      }
    };
    xhttp.open("GET", "/main/faculty-list", true);
    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.send();
  },
  updateFaculty: function(op) {
    // called from vote-mgr voteMgr.config.listeners, voteMgr.config.pollStatus
    if(global.loglevel > 0) console.log('calls.updateFaculty');
    // change op to object
    const d = { "op": op };
    if(global.loglevel > 1) console.log(op);
    const xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        const data = JSON.parse(this.responseText);
        if(global.loglevel > 0) console.log(`controller/calls.js PUT /main/update-faculty`);
        if(global.loglevel > 1) console.log(data);
        if (data.stat) {
          if(d.op == "check") {
            const progress = Math.floor(data.message);
            if (progress > 0) {
              let style = 'width: ' + progress + '%; background: rgb(42, 118, 221);';
              if (progress >= 100) {
                $('#btn-config-update-faculty').html('Faculty list is updated');
                style = 'width: 100%; background: rgb(69, 81, 44);;';
                global.util.button.enable('#btn-config-close');
                voteMgr.config.pollStatus.stop();
              }
              $('#progress-update-faculty > div').attr('style', style);
            }
          } else { // this one is "start"
            voteMgr.config.pollStatus.start();
          }
        }
      }
    };
    xhttp.open("PUT", "/main/update-faculty", true);
    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.send(JSON.stringify(d));
  }
};