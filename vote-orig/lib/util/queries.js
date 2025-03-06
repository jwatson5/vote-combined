/**********************************************************************
** util/queries.js                                                   **
**                                                                   **
**  handles query generation/execution for voting db ops             **
**   abstracted to handle multiple db types                          **
**                                                                   **
**********************************************************************/
const logger = require(__apphome + '/lib/util/logger'),
      persist = require(__apphome + '/lib/util/persist');

// logger info
const f = "queries";

module.exports = {
  init: () => {
    logger.info(`${f}.init`, "module initialized");
  },
  settings: {
    load: async () => {
      let query = null;
      switch (__storage.engine) {
        case 'mongodb':
          query = {
            c: 'lookup',
            q: { name: 'serverconfig' },
            p: {}
          };
          break;
        default:
      }
      return await persist.readOne(query);
    },
    update: async (data) => {
      let query = null;
      switch (__storage.engine) {
        case 'mongodb':
          query = {
            c: 'lookup',
            q: { name: 'serverconfig' },
            u: { $set: { data: data } }
          };
          break;
        default:
      }
      return await persist.updateOne(query);
    }
  },
  faculty: {
    lookup: async function () {
      let query = null;
      switch (__storage.engine) {
        case 'mongodb':
          query = {
            c: 'faculty',
            q: [
              {
                $project: {
                  _id: 0,
                  value: { $concat: ["$first_name", " ", "$middle_name", " ", "$last_name"] },
                  data: "$email"
                }
              }
            ]
          };
          break;
        default:
      }
      return await persist.read(query);
    },
    senators: async function () {
      let query = null;
      switch (__storage.engine) {
        case 'mongodb':
          query = {
            c: 'lookup',
            q: { name: "senatorlist" },
            p: { _id: 0, data: 1 }
          };
          break;
        default:
      }
      return await persist.readOne(query);
    },
    details: async function (e) {
      let query = null;
      switch (__storage.engine) {
        case 'mongodb':
          query = {
            c: 'faculty',
            q: { email: e },
            p: {
              _id: 0,
              pre: 1,
              first_name: 1,
              middle_name: 1,
              last_name: 1,
              email: 1,
              photo: 1
            }
          };
          break;
        default:
      }
      return await persist.readOne(query);
    }
  },
  vote: {
    new: async function (vote) {
      let data = null;
      switch (__storage.engine) {
        case 'mongodb':
          data = {
            c: 'senate',
            d: vote
          };
          break;
        default:
      }
      return await persist.createOne(data);
    },
    addCandidate: async function (vid, c) {
      let data = null;
      switch (__storage.engine) {
        case 'mongodb':
          data = {
            c: 'senate',
            q: { _id: vid },
            u: { $push: { candidates: c } }
          };
          break;
        default:
      }
      return await persist.updateOne(data);
    },
    remCandidate: async function (vid, e) {
      let query = null;
      switch (__storage.engine) {
        case 'mongodb':
          query = {
            c: 'senate',
            q: { _id: vid },
            u: { $pull: { candidates: { email: e } } }
            // u: { $unset: { "candidates.$[elem]": "" } },
            // o: { arrayFilters: [{ "elem.email": e }], upsert: true }
          };
          break;
        default:
      }
      return await persist.updateOne(query);
    },
    current: {
      get: async function (projection) {
        let query = null;
        switch (__storage.engine) {
          case 'mongodb':
            query = {
              c: 'senate',
              q: { loaded: true },
              p: projection
            };
            break;
          default:
        }
        return await persist.readOne(query);
      },
      moderator: async function (votes) {
        let p = {
          _id: 1,
          voting: 1,
          type: 1,
          name: 1,
          title: 1,
          result: 1,
          candidates: 1
        };
        if (votes) {
          p.votes = 1;
        }
        const r = await this.get(p);
        return r;
      },
      voter: async function (e) {
        const p = {
          _id: 1,
          name: 1,
          title: 1,
          voting: 1,
          candidates: 1,
          votes: { $elemMatch: { voter: e } }
        };
        const r = await this.get(p);
        return r;
      }
    },
    totalVotes: async function () {
      let query = null;
      switch (__storage.engine) {
        case 'mongodb':
          query = {
            c: 'senate',
            q: [
              { $match: { loaded: true } },
              // { $unwind: "$candidates" },
              // { $group: { _id: null, votes: { $sum: "$candidates.votes" } } },
              { $project: { _id: 0, votes: { $size: "$votes" } } }
            ]
          };
          break;
        default:
      }
      return await persist.read(query);
    },
    update: async function (vote) {
      let query = null;
      switch (__storage.engine) {
        case 'mongodb':
          const id = vote._id;
          delete vote._id;
          query = {
            c: 'senate',
            q: { _id: id },
            u: { $set: vote }
          };
          break;
        default:
      }
      return await persist.updateOne(query);
    },
    voting: async function (vid, start, data) {
      let query = null;
      switch (__storage.engine) {
        case 'mongodb':
          let message = "start-voting",
            set = { voting: start, nominees: data };
          if (!start) {
            message = "stop-voting";
            set = { voting: start, result: "eval", votes: data };
          }
          query = {
            c: 'senate',
            q: { _id: vid },
            u: {
              $set: set,
              $push: { log: { t: new Date(), op: message } }
            }
          };
          break;
        default:
      }
      return await persist.updateOne(query);
    },
    revote: async function (id) {
      let query = null;
      switch (__storage.engine) {
        case 'mongodb':
          query = {
            c: 'senate',
            q: { _id: id },
            u: {
              $set: {
                voting: true,
                "candidates.$[].votes": 0,
                votes: new Array()
              },
              $unset: { result: "" },
              $push: { log: { t: new Date(), op: "revote" } }
            }
          };
          break;
        default:
      }
      return await persist.updateOne(query);
    },
    accept: async function (id) {
      let query = null;
      switch (__storage.engine) {
        case 'mongodb':
          query = {
            c: 'senate',
            q: { _id: id },
            u: {
              $set: { result: "accepted" },
              $push: { log: { t: new Date(), op: "accepted" } }
            }
          };
          break;
        default:
      }
      return await persist.updateOne(query);
    },
    history: async function () {
      let query = null;
      switch (__storage.engine) {
        case 'mongodb':
          query = {
            c: 'senate',
            q: [
              { $match: { deleted: false } },
              { $sort: { date: -1 } },
              {
                $project: {
                  _id: 1,
                  name: 1,
                  type: 1,
                  date: 1,
                  result: 1
                }
              }
            ]
          };
          break;
        default:
      }
      return await persist.read(query);
    },
    cast: {
      new: async function (vid, v) {
        let query = null;
        switch (__storage.engine) {
          case 'mongodb':
            query = {
              c: 'senate',
              q: { _id: vid },
              u: {
                $inc: {
                  "candidates.$[new].votes": 1
                },
                $push: { votes: v }
              },
              o: {
                arrayFilters: [
                  { "new.email": v.candidate }
                ]
              }
            };
            break;
          default:
        }
        return await persist.updateOne(query);
      },
      unvote: async function (vid, v) {
        let query = null;
        switch (__storage.engine) {
          case 'mongodb':
            query = {
              c: 'senate',
              q: { _id: vid },
              u: {
                $inc: {
                  "candidates.$[new].votes": -1
                },
                $pull: { votes: { voter: v.voter } }
              },
              o: {
                arrayFilters: [
                  { "new.email": v.candidate }
                ]
              }
            };
            break;
          default:
        }
        return await persist.updateOne(query);
      },
      change: async function (vid, v, oldv) {
        let query = null;
        switch (__storage.engine) {
          case 'mongodb':
            query = {
              c: 'senate',
              q: { _id: vid },
              u: {
                $inc: {
                  "candidates.$[new].votes": 1,
                  "candidates.$[old].votes": -1
                },
                $set: { "votes.$[v].candidate": v.candidate }
              },
              o: {
                arrayFilters: [
                  { "new.email": v.candidate },
                  { "old.email": oldv.candidate },
                  { "v.voter": v.voter }
                ]
              }
            };
            break;
          default:
        }
        return await persist.updateOne(query);
      }
    }
  }
};
