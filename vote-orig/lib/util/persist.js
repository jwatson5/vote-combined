/**********************************************************************
** util/persist.js                                                   **
**                                                                   **
**  handles persistence (CRUD operations) of data                    **
**   abstracted to handle multiple db types                          **
**                                                                   **
**********************************************************************/

const logger = require(__apphome + '/lib/util/logger'),
      dbconn = require(__apphome + '/lib/util/db'),
      objID = require('mongodb').ObjectId;

// local variables
let db = null;

// file logger
const f = "persist";

// private methods
function loadLibraries() {
  switch (__storage.engine) {
    case 'mongodb':
      break;
    default:
      return false;
  }
}

module.exports = {
  init: () => {
    db = dbconn.db();
  },
  createOne: async (data) => {
    try {
      switch (__storage.engine) {
        case 'mongodb':
          const r = await db.collection(data.c).insertOne(data.d);
          return await db.collection(data.c).findOne({ _id: new objID(r.insertedId) });
          break;
        default:
          return false;
      }
    } catch (err) {
      logger.err(`${f}.createOne`, err);
      return false;
    }
  },
  readOne: async (query) => {
    try {
      switch (__storage.engine) {
        case 'mongodb':
          if (query.q._id) {
            query.q._id = new objID(query.q._id);
          }
          return await db.collection(query.c).findOne(query.q, { projection: query.p });
          break;
        default:
          return false;
      }
    } catch (err) {
      logger.err(`${f}.readOne`, err);
      return false;
    }
  },
  read: async (query) => {
    try {
      return await db.collection(query.c).aggregate(query.q).toArray();
    } catch (err) {
      logger.err(`${f}.read`, err);
      return false;
    }
  },
  updateOne: async (query) => {
    try {
      if (query.q._id) {
        query.q._id = new objID(query.q._id);
      }
      const o = query.o || { upsert: true };
      logger.info(`${f}.updateOne`, { "info": "query object", "data": query });
      return await db.collection(query.c).updateOne(query.q, query.u, o);
    } catch (err) {
      logger.err(`${f}.updateOne`, err);
      return false;
    }
  },
  deleteOne: async (data) => {
    try {
      if (query.q._id) {
        query.q._id = new objID(query.q._id);
      }
    } catch (err) {
      logger.err(`${f}.deleteOne`, err);
      return false;
    }
  }
};
