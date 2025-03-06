/**********************************************************************
** sck-route.js                                                      **
**                                                                   **
**  -- maps socket.io paths to controller libraries                  **
**     this library should ideally only route the socket.io events   **
**     to the controller libraries (auth, bank)                      **
**                                                                   **
**********************************************************************/

const dbconn = require(__apphome + '/lib/util/db'),
  bank = require(__apphome + '/lib/session/bank'),
  cliAuth = require(__apphome + '/lib/auth/cli-auth'),
  modAuth = require(__apphome + '/lib/auth/mod-auth'),
  updateFaculty = require(__apphome + '/lib/util/faculty-profiles');

let sim = null;

const f = "sck-route.js";
function eventlog(evt, id) {
  console.info(f + ': recieved ' + evt + ' event from ' + id);
}

function getModeratorInfo() {
  return new Promise((resolve, reject) => {
    __moderator.clients((error, clients) => {
      if (error) {
        reject(error);
      }
      let info = {
        serverSession: false,
        key: null
      };
      for (let i = 0; i < clients.length; i++) {
        // try to find moderator info
        const s = __moderator.connected[clients[i]];
        if (s.handshake.session) {
          if (s.handshake.session.ident) {
            info = {
              serverSession: true,
              key: s.handshake.session.ident.key
            };
          }
        }
      }
      resolve(info);
    });
  });
}

function emitVoteChange(v) {
  let vdata = null;
  if (v.voting) {
    vdata = {
      _id: v._id,
      name: v.name,
      title: v.title,
      candidates: v.candidates
    };
  }
  // send data to voting clients
  __senators.emit('server-change', {
    serverSession: true,
    vote: vdata
  });
}

module.exports = {
  init: async function () {
    // initialize our local objects
    await dbconn.init();
    await bank.init(dbconn.db());



    if (__simulation) {
      // start virtual clients connecting over 30 seconds
      sim = require(__apphome + '/lib/sim/sim');
      sim.init(40, 70, bank, dbconn.db());
    }
  },
  close: async function () {
    // shutdown everything
    await dbconn.close();
  },
  sendInfo: async function (socket) {
    // default for initial connection
    let m = null;

    if (socket.nsp.name == '/moderator') {
      m = {
        ident: {},
        vote: null
      };
      if (socket.handshake.session.ident) {
        // established moderator
        this.moderatorAuth(socket);

        m = {
          ident: socket.handshake.session.ident,
          clientCount: await bank.vote.votersCount(),
          vote: await bank.vote.getCurrent(false), // returns moderator info
          voteCount: await bank.vote.totalVotes()
        };
      }
    } else {
      // this is a senator socket
      const modInfo = await getModeratorInfo();
      m = {
        ident: {},
        serverSession: modInfo.serverSession
      };
      if (socket.handshake.session.ident) {
        // established senator
        this.voterAuth(socket);
        m = {
          ident: socket.handshake.session.ident,
          serverSession: modInfo.serverSession
        };
        let v = await bank.vote.getCurrent(socket.handshake.session.ident) // returns senator voter info
        if (v) {
          // current vote
          if (v.voting) {
            // session is in voting, so send cast vote info
            if (v.votes) {
              m.currentVote = v.votes[0];
              delete v.votes;
            }
            m.vote = v;
          }
        }
      }
    }
    const r = {
      stat: true,
      message: m
    };
    socket.emit('refresh', r);
  },
  common: function (socket) {
    socket.on('faculty-list', async (data, ack) => {
      // retrieve faculty list
      try {
        // console.info('sck-route.js: recieved faculty-list event');
        const r = await bank.faculty.lookup();
        // console.info(r);
        ack({ stat: true, message: r });
      } catch (err) {
        console.error(Error(err));
        ack({ stat: false, message: err });
      }
    });
  },
  voter: function (socket) {
    socket.on('senator-list', async (data, ack) => {
      try {
        // eventlog('senator-list', socket.handshake.session.id);
        const r = await bank.faculty.senators();
        ack({ stat: true, message: r });
      } catch (err) {
        const e = Error(err);
        console.error(e);
        ack({ stat: false, message: e });
      }
    });
    socket.on('login', async (data, ack) => {
      try {
        // eventlog('voter login', socket.handshake.session.id);
        let r = "badkey";
        const modInfo = await getModeratorInfo();
        if (data.key == modInfo.key) {
          this.voterAuth(socket);
          r = await cliAuth.login(socket, data, modInfo); // lib/auth/cli-auth
          const v = await bank.vote.getCurrent(r.ident) // returns senator voter info
          if (v) {
            if (v.voting) {
              r.vote = v;
            }
          }
          // console.info(r);
        }
        ack({ stat: true, message: r });
      } catch (err) {
        const e = Error(err);
        console.error(e);
        ack({ stat: false, message: e });
      }
    });
    socket.on('logout', async (data, ack) => {
      try {
        // eventlog('voter logout', socket.handshake.session.id);
        await cliAuth.logout(socket); // lib/auth/cli-auth
        const modInfo = await getModeratorInfo();
        const r = {
          ident: {},
          serverSession: modInfo.serverSession
        }
        this.voterDeauth(socket);
        ack({ stat: true, message: r });
      } catch (err) {
        const e = Error(err);
        console.error(e);
        ack({ stat: false, message: e });
      }
    });
  },
  moderator: function (socket) {
    socket.on('login', async (data, ack) => {
      try {
        // eventlog('moderator login', socket.handshake.session.id);
        let r = "badpass";
        if (data.passwd == bank.settings.get().passwd) {
          const id = await modAuth.login(socket, data.key); // lib/auth/mod-auth
          // add authorized socket events
          this.moderatorAuth(socket);
          r = {
            ident: id,
            clientCount: await bank.vote.votersCount(),
            vote: null
          };
          const voterInfo = {
            serverSession: true,
            vote: null
          };
          __senators.emit('server-change', voterInfo);
        }
        ack({ stat: true, message: r });
      } catch (err) {
        const e = Error(err);
        console.error(e);
        ack({ stat: false, message: e });
      }
    });
    socket.on('logout', async (data, ack) => {
      try {
        // eventlog('moderator logout', socket.handshake.session.id);
        const r = await modAuth.logout(socket); // lib/auth/mod-auth
        __senators.emit('server-change', { logout: true });
        this.moderatorDeAuth(socket);
        ack({ stat: true, message: r });
      } catch (err) {
        const e = Error(err);
        console.error(e);
        ack({ stat: false, message: e });
      }
    });
  },
  voterAuth: function (socket) {
    socket.on('cast-vote', async (data, ack) => {
      try {
        // eventlog('voter cast-vote', socket.handshake.session.id);
        const r = await bank.vote.processVote(data);
        ack({ stat: true, message: r });
      } catch (err) {
        const e = Error(err);
        console.error(e);
        ack({ stat: false, message: e });
      }
    });
  },
  voterDeauth: function (socket) {
    socket.removeAllListeners('cast-vote');
  },
  moderatorAuth: function (socket) {
    // these events are only available for authenticated
    //    moderator sockets
    socket.on('set-config', (data, ack) => {
      try {
        // eventlog('moderator set-config', socket.handshake.session.id);
        let id = socket.handshake.session.ident;
        if (data) {
          id.config = data;
          id.progress = updateFaculty.getProgress();
          this.moderatorConfig(socket);
        } else {
          delete id.config;
          delete id.progress;
          this.moderatorDeConfig(socket);
        }
        socket.handshake.session.ident = id;
        socket.handshake.session.save(() => {
          ack({ stat: true, message: id });
        });
      } catch (err) {
        const e = Error(err);
        console.error(e);
        ack({ stat: false, message: e });
      }
    });
    socket.on('vote-data', async (data, ack) => {
      try {
        // eventlog('moderator vote-data', socket.handshake.session.id);
        r = {
          clientCount: await bank.vote.votersCount(),
          voteCount: await bank.vote.totalVotes()
        };
        ack({ stat: true, message: r });
      } catch (err) {
        const e = Error(err);
        console.error(e);
        ack({ stat: false, message: e });
      }
    });
    socket.on('vote-new', async (data, ack) => {
      try {
        // eventlog('moderator vote-new', socket.handshake.session.id);
        const r = await bank.vote.new(data);
        ack({ stat: true, message: r });
      } catch (err) {
        const e = Error(err);
        console.error(e);
        ack({ stat: false, message: e });
      }
    });
    socket.on('vote-new-candidate', async (data, ack) => {
      try {
        // eventlog('vote-new-candidate', socket.handshake.session.id);
        const r = await bank.vote.addCandidate(data);
        ack({ stat: true, message: r });
      } catch (err) {
        const e = Error(err);
        console.error(e);
        ack({ stat: false, message: e });
      }
    });
    socket.on('vote-del-candidate', async (data, ack) => {
      try {
        // eventlog('vote-del-candidate', socket.handshake.session.id);
        const r = await bank.vote.remCandidate(data.vid, data.email);
        ack({ stat: true, message: r });
      } catch (err) {
        const e = Error(err);
        console.error(e);
        ack({ stat: false, message: e });
      }
    });
    socket.on('vote-load', async (data, ack) => {
      try {
        // eventlog('moderator vote-load', socket.handshake.session.id);
        const r = await bank.vote.load(data);
        ack({ stat: true, message: r });
      } catch (err) {
        const e = Error(err);
        console.error(e);
        ack({ stat: false, message: e });
      }
    });
    socket.on('vote-delete', async (data, ack) => {
      try {
        // eventlog('moderator vote-delete', socket.handshake.session.id);
        const r = await bank.vote.delete(data);
        ack({ stat: true, message: r });
      } catch (err) {
        const e = Error(err);
        console.error(e);
        ack({ stat: false, message: e });
      }
    });
    socket.on('vote-update', async (data, ack) => {
      try {
        // eventlog('moderator vote-update', socket.handshake.session.id);
        const r = await bank.vote.update(data);
        ack({ stat: true, message: r });
      } catch (err) {
        const e = Error(err);
        console.error(e);
        ack({ stat: false, message: e });
      }
    });
    socket.on('vote-hist', async (data, ack) => {
      try {
        // eventlog('moderator vote-hist', socket.handshake.session.id);
        const r = await bank.vote.history();
        ack({ stat: true, message: r });
      } catch (err) {
        const e = Error(err);
        console.error(e);
        ack({ stat: false, message: e });
      }
    });
    socket.on('vote-start', async (data, ack) => {
      try {
        // eventlog('moderator vote-start', socket.handshake.session.id);
        const r = await bank.vote.startVoting(data);
        emitVoteChange(r);
        ack({ stat: true, message: r });
      } catch (err) {
        const e = Error(err);
        console.error(e);
        ack({ stat: false, message: e });
      }
    });
    socket.on('vote-revote', async (data, ack) => {
      try {
        // eventlog('moderator vote-revote', socket.handshake.session.id);
        const r = await bank.vote.revote(data);
        emitVoteChange(r);
        ack({ stat: true, message: r });
      } catch (err) {
        const e = Error(err);
        console.error(e);
        ack({ stat: false, message: e });
      }
    });
    socket.on('vote-stop', async (data, ack) => {
      try {
        // eventlog('moderator vote-stop', socket.handshake.session.id);
        const r = await bank.vote.stopVoting(data);
        emitVoteChange(r);
        ack({ stat: true, message: r });
      } catch (err) {
        const e = Error(err);
        console.error(e);
        ack({ stat: false, message: e });
      }
    });
    socket.on('vote-accept', async (data, ack) => {
      try {
        // eventlog('moderator vote-accept', socket.handshake.session.id);
        const r = await bank.vote.acceptVote(data);
        ack({ stat: true, message: r });
      } catch (err) {
        const e = Error(err);
        console.error(e);
        ack({ stat: false, message: e });
      }
    });
    socket.on('vote-reset', async (data, ack) => {
      try {
        // eventlog('moderator vote-reset', socket.handshake.session.id);
        await bank.vote.close(data);
        ack({ stat: true, message: null });
      } catch (err) {
        const e = Error(err);
        console.error(e);
        ack({ stat: false, message: e });
      }
    });
  },
  moderatorDeAuth: function (socket) {
    socket.removeAllListeners('set-config');
    socket.removeAllListeners('vote-data');
    socket.removeAllListeners('vote-new');
    socket.removeAllListeners('vote-new-candidate');
    socket.removeAllListeners('vote-del-candidate');
    socket.removeAllListeners('vote-load');
    socket.removeAllListeners('vote-delete');
    socket.removeAllListeners('vote-update');
    socket.removeAllListeners('vote-hist');
    socket.removeAllListeners('vote-start');
    socket.removeAllListeners('vote-revote');
    socket.removeAllListeners('vote-stop');
    socket.removeAllListeners('vote-accept');
    socket.removeAllListeners('vote-reset');
  },
  moderatorConfig: function (socket) {
    socket.on('update-faculty', (data, ack) => {
      try {
        let r = true;
        if (data == "start") {
          // eventlog('moderator update-faculty start from ', socket.handshake.session.id);
          updateFaculty.updateFaculty(dbconn.db());
        } else if (data == "check") {
          r = updateFaculty.getProgress();
          if (r == 100) {
            updateFaculty.reset();
          }
        }
        ack({ stat: true, message: r });
      } catch (err) {
        const e = Error(err);
        console.error(e);
        ack({ stat: false, message: e });
      }
    });
  },
  moderatorDeConfig: function (socket) {
    socket.removeAllListeners('update-faculty');
  }
};
