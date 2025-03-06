/*
** calls.js
** object to handle calls to server
**  this file was setup to allow for
**  different server call methods (ie socket, ajax, etc)
**
*/

let calls = {
  init: function() {
    // establish socket connection with server
    socket = io.connect('/moderator');
  },
  refresh: function() {
    // emmitted on connection from server to
    //   update session information
    socket.on('refresh', function (data) {
      // console.info('from server (refresh): ' + JSON.stringify(data));
      if (data.stat) {
        global.refresh(data.message);
      }
    });
  },
  statCheck: function() {
    socket.emit('stat-check', {}, function (data) {
      // console.info('server (stat-check): ' + JSON.stringify(data));
      if (data.stat) {
        global.refresh(data.message);
      }
    });   
  },
  setConfig: function(status) {
    socket.emit('set-config', status, function (data) {
      // console.info('server (set-config): ' + JSON.stringify(data));
      if (data.stat) {
        ident.id = data.message;
        if (ident.id.progress > 0) {
          voteMgr.config.restart();
        }
      }
    });    
  },
  login: function(d) {
    socket.emit('login', d, function (data) {
      // console.info('server (login): ' + JSON.stringify(data));
      let result = "badpass";
      if (data.stat) {
        // no error from the server
        if (data.message != 'badpass') {
          // successfull login, pass data to global refresh
          //   to establish ui to previous state
          global.refresh(data.message);
          result = "success";
        }
        formIdent.update(result);
      }
    });

  },
  logout: function() {
    socket.emit('logout', {}, function (data) {
      // console.info('server (logout): ' + JSON.stringify(data));
      if (data.stat) {
        // stop the poll for client/vote counts
        //   refresh global ui - likely to the login screen
        vote.infoPoll.stop();
        global.refresh(data.message);
      }
    });    
  },
  voteHistory: function() {
    socket.emit('vote-hist', {}, function (result) {
      // console.info('controller/vote.js [vote-hist]: ' + JSON.stringify(result));
      if (result.stat) {
        vote.history = result.message;
        // update the view
        voteMgr.voteHist.populate(vote.history);
      }
    });    
  },
  voteStart: function(id) {
    socket.emit('vote-start', id, function (result) {
      // console.info('server (vote-start): ' + JSON.stringify(result));
      if (result.stat) {
        vote.voteCount = 0;
        vote.updateVoteUI();
        vote.persist.update(result.message);
      }
    });    
  },
  voteStop: function(id) {
    socket.emit('vote-stop', id, function (result) {
      // result.message.result - eval or accepted
      if (result.stat) {
        vote.persist.update(result.message);
      }
    });
  },
  voteRevote: function(id) {
    socket.emit('vote-revote', id, function (result) {
      // console.info('server (vote-revote): ' + JSON.stringify(result));
      if (result.stat) {
        vote.voteCount = 0;
        vote.updateVoteUI();
        vote.persist.update(result.message);
      }
    });    
  },
  voteAccept: function(id) {
    socket.emit('vote-accept', id, function (result) {
      // result.message.result - eval or accepted
      if (result.stat) {
        vote.persist.update(result.message);
      }
    });    
  },
  voteReset: function(id) {
    socket.emit('vote-reset', id, function (result) {
      // result.message.result - eval or accepted
      if (result.stat) {
        vote.info = null;
        // console.info('vote.votestat.reset: vote update state');
        vote.state.change();
      }
    });    
  },
  voteNew: function(v) {
    socket.emit('vote-new', v, function (result) {
      // console.info('server (vote-new): ' + JSON.stringify(result));
      if (result.stat) {
        vote.persist.update(result.message);
      }
    });
  },
  voteNewCandidate: function(c) {
    socket.emit('vote-new-candidate', c, function (result) {
      // console.info('server (vote-new-candidate): ' + JSON.stringify(result));
      // insert the candidate on the page
      voteBuild.candidateList.insertCandidate(result.message);
      setTimeout(function () {
        if (result.stat) {
          $('#top-bar-right p').removeClass('bg-green font-white');
          $('#top-bar-right p').html('All changes saved');
        } else {
          $('#top-bar-right p').removeClass('bg-green');
          $('#top-bar-right p').addClass('bg-alert');
          $('#top-bar-right p').html('Error saving');
        }
      }, 432);
    });    
  },
  voteDelCandidate: function(d) {
    socket.emit('vote-del-candidate', d, function (result) {
      // console.info('server (vote-del-candidate): ' + JSON.stringify(result));
      setTimeout(function () {
        if (result.stat) {
          $('#top-bar-right p').removeClass('bg-green font-white');
          $('#top-bar-right p').html('All changes saved');
        } else {
          $('#top-bar-right p').removeClass('bg-green');
          $('#top-bar-right p').addClass('bg-alert');
          $('#top-bar-right p').html('Error saving');
        }
      }, 432);
    });    
  },
  voteLoad: function(id) {
    socket.emit('vote-load', id, function (result) {
      // console.info('server (vote-load): ' + JSON.stringify(result));
      if (result.stat) {
        vote.persist.update(result.message);
      }
    });    
  },
  voteDelete: function(id) {
    socket.emit('vote-delete', id, function (result) {
      // console.info('server (vote-load): ' + JSON.stringify(result));
      if (result.stat) {
        // this gets a new history for the table
        vote.history = result.message;
        voteMgr.voteHist.populate(vote.history);
      }
    });    
  },
  voteUpdate: function(v) {
    socket.emit('vote-update', v, function (result) {
      // console.info('server (vote-update): ' + JSON.stringify(result));
      setTimeout(function () {
        if (result.stat) {
          $('#top-bar-right p').removeClass('bg-green font-white');
          $('#top-bar-right p').html('All changes saved');
        } else {
          $('#top-bar-right p').removeClass('bg-green');
          $('#top-bar-right p').addClass('bg-alert');
          $('#top-bar-right p').html('Error saving');
        }
      }, 432);
    });    
  },
  voteData: function() {
    socket.emit('vote-data', {}, function (result) {
      // console.info('server (vote-data): ' + JSON.stringify(result));
      if (result.stat) {
        vote.clients = result.message.clientCount;
        if (vote.info) {
          // console.info(vote.info);
          vote.voteCount = result.message.voteCount;
          vote.updateVoteUI();
        }
        global.updateUI();
      }
    });    
  },
  facultyList: function() {
    socket.emit('faculty-list', {}, function (result) {
      // console.info('view/vote/vote-buile.js [faculty-list]: ' + JSON.stringify(result));
      if (result.stat) {
        vote.facultyList = result.message;
        voteBuild.candidateList.filterFacultyList(vote.info.candidates);
        voteBuild.candidateList.appendAdd();
        voteBuild.candidateList.positionListeners.addrem(s);
      }
    });    
  },
  updateFaculty: function(op) {
    socket.emit('update-faculty', op, function (result) {
      // console.info('server (update-faculty [check]): ' + JSON.stringify(result));
      if (result.stat) {
        if(op == "check") {
          const progress = Math.floor(result.message);
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
    });
  }
};