/**********************************************************************
** auth/cli-auth.js                                                  **
** -- handles the client identification                              **
**                                                                   **
**********************************************************************/

const logger = require(__apphome + '/lib/util/logger'),
      bank = require(__apphome + '/lib/session/bank');

// file logger
const f = "cli-auth";

//#region promisify async functions
// // promisify async functions
// function cleanOldSessions(email) {
//   return new Promise((resolve, reject) => {
//     // this clears any lingering established sessions without active sockets
//     __store.all((error, sessions) => {
//       if (error) {
//         reject(error);
//       } else {
//         for (let i = 0; i < sessions.length; i++) {
//           if (sessions[i].session.ident) {
//             if (sessions[i].session.ident.email == email) {
//               __store.destroy(sessions[i]._id);
//             }
//           }
//         }
//         resolve(true);
//       }
//     });
//   });
// }

// function senClients() {
//   return new Promise((resolve, reject) => {
//     __senators.clients((error, clients) => {
//       if (error) {
//         reject(error);
//       } else {
//         resolve(clients);
//       }
//     });
//   });
// }

// function saveSession(session) {
//   return new Promise((resolve, reject) => {
//     session.save((error) => {
//       if (error) {
//         reject(error);
//       } else {
//         resolve();
//       }
//     });
//   });
// }
//#endregion

module.exports = {
  login: async (data, session) => {
    try {
      logger.info(
        `${f}.login`, 
        { "info": "senator logon with id",
          "data": data,
          "session": session.id } 
      );
      // data = {"name":"Jason Watson","email":"jwatson5@una.edu","key":"authkey"}
      // keys match - log the voter in

      let r = "badkey";
      if (data.key == __moderator.ident.key) {
        logger.info(
          `${f}.login`, 
          { "info": "senator logon with id",
            "data": "login successful" } 
        );
          // check for another senator and take over session
        const existSess = await bank.getSession(session.id);
        logger.info(
          `${f}.login`, 
          { "info": "existing session check",
            "data": existSess } 
        );

        if(existSess) {
          // TODO: do this later
          //await this.logout(existSess);
          const rr = {
            ident: {},
            serverSession: true,
            vote: null
          };
          //established.emit('mult-logins', rr);
        }

        const i = {
          name: data.name,
          email: data.email
        };
        //don't think this is needed
        //await cleanOldSessions(i.email);
        r = {
          ident: i,
          serverSession: true
        };

        const v = await bank.vote.getCurrent(r.ident) // returns senator voter info
        if (v) {
          if (v.voting) {
            r.vote = v;
          }
        }

        logger.info(`${f}.login`, { "info": "new senator login from", "data": r });
        session.ident = i;
        await bank.saveSession(session);
      }
      return r;
    } catch (err) {
      logger.err(`${f}.login`, err);
    }

    /*
    const clients = await senClients();
    let established = false;
    for (let i = 0; i < clients.length; i++) {
      const s = __senators.connected[clients[i]];
      if (s.handshake.session.ident) {
        if (s.handshake.session.ident.email == data.email) {
          // senator is connected on another live socket
          established = s;
        }
      }
    }
    if (established) {
      await this.logout(established);
      const rr = {
        ident: {},
        serverSession: modInfo.serverSession,
        vote: null
      };
      established.emit('mult-logins', rr);
    }
    */

  },
  logout: async (session) => {
    try {
      logger.info(
        `${f}.logout`, 
        { "info": "senator logout with id",
          "data": session.id } 
      );
      let ss = false;
      if(__moderator) ss = true;

      await bank.deleteSession(session);
  
      return {
        ident: {},
        serverSession: ss
      };
    } catch (err) {
      logger.err(`${f}.logout`, err);
    }
  },
  //#region check function
  // check: function (socket) {
  //   let s = false;
  //   if (bank.votesess.getKey()) {
  //     s = true;
  //   }
  //   let v = null;
  //   if (bank.voting.isVoting()) {
  //     v = bank.voting.getVote(true) || null;
  //   }
  //   if (v && socket.handshake.session.currentVote) {
  //     v.currentVote = socket.handshake.session.currentVote;
  //   }
  //   const r = {
  //     ident: socket.handshake.session.ident || {},
  //     serverSession: s,
  //     // voting: bank.voting.isVoting(),
  //     vote: v
  //   };
  //   return r;
  // }
  //#endregion
};