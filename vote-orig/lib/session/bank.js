/**********************************************************************
** session/bank.js                                                   **
**                                                                   **
**  manages information about the moderator and voter connections    **
**                                                                   **
**                                                                   **
**********************************************************************/

const fsp = require('fs').promises,
      logger = require(__apphome + '/lib/util/logger'),
      //dbconn = require(__apphome + '/lib/util/db'),
      queries = require(__apphome + '/lib/util/queries'),
      persist = require(__apphome + '/lib/util/persist');

// logger info
const f = "bank";

let config;

module.exports = {
  init: async function () {
    // router needs access to db, so initalize all the libraries need for queries
    await persist.init();
    //await this.clearStore();
    // with queries initialized, get app settings
    await this.settings.load();
    return true;
  },
  settings: {
    load: async function () {
      const r = await queries.settings.load();
      config = r.data;
    },
    save: async function (data) {
      return await queries.settings.update(data);
    },
    get: function () {
      return config;
    }
  },
  storeLen: () => {
    return new Promise((resolve, reject) => {
      __store.length((err, len) => {
        if(err) { reject(err); }
        else { resolve(len); }
      });
    });
  },
  clearStore: () => {
    return new Promise((resolve, reject) => {
      __store.length((err, len) => {
        if(err) { reject(err); }
        else {
          if(len > 0) {
            __store.clear((err) => {
              if(err) { reject(err); }
              else { resolve(); }
            });
          } else {
            resolve();
          }
        }
      });
    });
  },
  saveSession: (session) => {
    return new Promise((resolve, reject) => {
      session.save((error) => {
        if (error) { reject(error); }
        else { resolve(); }
      });
    });
  },
  getSession: (id) => {
    return new Promise((resolve, reject) => {
      __store.get(id, (err, session) => {
        if(err) { reject(err); }
        else { resolve(session); }
      });
    });
  },
  deleteSession: (session) => {
    return new Promise((resolve, reject) => {
      __store.destroy(session.id, (err) => {
        if(err) { reject(err); }
        else { 
          session.destroy((err2) => {
            if (err2) { reject(err2); }
            else { resolve(); }
          }); 
        }
      });
    });
  },
  updateSession: (id, session) => {
    return new Promise((resolve, reject) => {
      __store.set(id, session, (err) => {
        if(err) { reject(err); }
        else { resolve(); }
      });
    });
  },
  faculty: {
    lookup: async function () {
      return await queries.faculty.lookup();
    },
    senators: async function () {
      return await queries.faculty.senators();
    }
  },
  vote: {
    new: async function (v) {
      const vote = {
        loaded: true,
        voting: false,
        type: v.type,
        name: v.name,
        title: v.title,
        candidates: v.candidates,
        votes: new Array(),
        nominees: new Array(),
        deleted: false,
        date: new Date(),
        log: new Array()
      };
      return await queries.vote.new(vote);
    },
    close: async function (vid) {
      const v = {
        _id: vid,
        loaded: false
      };
      return await queries.vote.update(v);
    },
    load: async function (vid) {
      const v = {
        _id: vid,
        loaded: true
      };
      await queries.vote.update(v);
      return await this.getCurrent(false);
    },
    delete: async function (vid) {
      const v = {
        _id: vid,
        deleted: true
      };
      await queries.vote.update(v);
      return await this.history();
    },
    update: async function (v) {
      return await queries.vote.update(v);
    },
    addCandidate: async function (d) {
      let c = null;
      if (d.onList) {
        c = await queries.faculty.details(d.email);
        c.name = c.pre + ' '
          + c.first_name + ' '
          + c.middle_name + ' '
          + c.last_name;
        c.initial = c.last_name.substring(0, 1);
        c.votes = 0;
        if (c.photo) {
          const img = await fsp.readFile(__webroot + '/' + c.photo);
          const base64img = Buffer.from(img).toString('base64');
          c.photo = base64img;
        }
      } else {
        c = {
          email: d.email,
          name: d.email,
          initial: d.email.substring(0, 1),
          votes: 0
        }
      }
      await queries.vote.addCandidate(d.vid, c);
      return c;
    },
    remCandidate: async function (vid, e) {
      await queries.vote.remCandidate(vid, e);
      return e;
    },
    history: async function () {
      return await queries.vote.history();
    },
    votersCount: function () {
      return new Promise((resolve, reject) => {
        __store.length((err, len) => {
          if(err) { reject(err); }
          else { resolve(len - 1); }
        });
      });
    },
    totalVotes: async function () {
      const d = await queries.vote.totalVotes();
      let r = 0;
      if (d.length > 0) {
        r = d[0].votes;
      }
      return r;
    },
    startVoting: async function (vid) {
      let v = await this.getCurrent(false);
      let nom = new Array();
      for (let i = 0; i < v.candidates.length; i++) {
        nom.push({
          name: v.candidates[i].name,
          email: v.candidates[i].email
        });
      }
      await queries.vote.voting(vid, true, nom);
      v.voting = true;
      return v;
    },
    stopVoting: async function (vid) {
      try {
        let v = await this.getCurrent(false, true);
        // clean vote array
        for (let i = 0; i < v.votes.length; i++) {
          v.votes[i].voter = 'sen' + i;
        }
        await queries.vote.voting(vid, false, v.votes);
        // results without having to query the db
        v.voting = false;
        v.result = "eval";
        delete v.votes;
        return v;
      } catch (err) {
        logger.err(`${f}.vote.stopVoting`, err);
      }
    },
    acceptVote: async function (vid) {
      await queries.vote.accept(vid);
      return await this.getCurrent(false);
    },
    revote: async function (vid) {
      await queries.vote.revote(vid);
      return await this.getCurrent(false);
    },
    getCurrent: async function (cli, votes) {
      let r = null;
      if (cli) {
        // voter data is needed
        r = await queries.vote.current.voter(cli.email);
      } else {
        r = await queries.vote.current.moderator(votes);
      }
      return r;
    },
    processVote: async function (v) {
      const vinfo = await this.getCurrent({ email: v.voter });
      logger.info(`${f}.vote.processVote`, {info: "current voter info", data: vinfo});
      let m = null;
      if (vinfo.votes) {
        // this is not a new vote
        const oldv = vinfo.votes[0];
        if (oldv.candidate == v.candidate) {
          // unvote (pull from votes, decrement candidate)
          await queries.vote.cast.unvote(vinfo._id, v);
          logger.info(`${f}.vote.processVote`, "senator unvote processed");
          m = "unvote";
        } else {
          // change vote (set votes, increment candidate, decrement candidate)
          await queries.vote.cast.change(vinfo._id, v, oldv);
          logger.info(`${f}.vote.processVote`, "senator change vote processed");
          m = "change";
        }
      } else {
        // new vote, (push to votes, increment candidate)
        await queries.vote.cast.new(vinfo._id, v);
        logger.info(`${f}.vote.processVote`, "senator new vote processed");
        m = "new";
      }
      return m;
    }
  }
};
