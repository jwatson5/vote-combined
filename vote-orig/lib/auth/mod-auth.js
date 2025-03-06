/**********************************************************************
** auth/mod-auth.js                                                  **
**                                                                   **
**   handles authentication for the session moderator                **
**     moderator needs a pw                                          **
**                                                                   **
**********************************************************************/

const logger = require(__apphome + '/lib/util/logger'),
      bank = require(__apphome + '/lib/session/bank');

// logger info
const f = "mod-auth";

//#region promisify async functions
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

// function modClients() {
//   return new Promise((resolve, reject) => {
//     __moderator.clients((error, clients) => {
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
  login: async function (data, session) {
    try {
      let r = "badpass"; // r will be false on bad login
      if(data.passwd == bank.settings.get().passwd) {
        if(__moderator) { // this means there is already a moderator
          logger.info(
            `${f}.login`, 
            { "info": "existing moderator with id",
              "data": __moderator.id } 
          );
          await bank.updateSession(__moderator.id, session);
        }
        // now, this is a unique moderator session
        const cliX = await bank.storeLen();
        r = {
          ident: {
            name: "Moderator",
            email: "moderator",
            key: data.key
          },
          clientCount: cliX,
          vote: null
        };

        session.ident = r.ident;
        await bank.saveSession(session);
        __moderator = session;
        logger.info(
          `${f}.login`, 
          { "info": "moderator logon with id",
            "data": __moderator.id } 
        );
      }
      return r;
    } catch (err) {
      logger.err(`${f}.login`, err);
    }
  },
  logout: async function (session) {
    try {
      logger.info(
        `${f}.logout`, 
        { "info": "moderator logout with id",
          "data": session.id } 
      );

      await bank.deleteSession(session);
      __moderator = null;

      /*
      // moderator has logged out, need to remove all voters authorizations
      let ps = new Array();
      for (let p in __senators.connected) {
        if (__senators.connected.hasOwnProperty(p)) {
          if (__senators.connected[p].handshake.session.ident) {
            delete __senators.connected[p].handshake.session.ident;
            delete __senators.connected[p].handshake.session.currentVote;
            ps.push(saveSession(__senators.connected[p].handshake.session));
          }
        }
      }
      await Promise.all(ps);
      */

      return {
        ident: {},
        vote: null
      };
    } catch (err) {
      logger.err(`${f}.logout`, err);
    }
  },
};
