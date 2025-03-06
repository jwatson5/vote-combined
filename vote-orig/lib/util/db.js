/**********************************************************************
** util/db.js                                                        **
**                                                                   **
**  handles intiation of database connections                        **
**   abstracted to handle multiple db types                          **
**                                                                   **
**********************************************************************/

const logger = require(__apphome + '/lib/util/logger');

// logger info
const f = "db";

// private local variables
let db, client;

module.exports = {
  db: () => { return db },

  init: async () => {
    try {
      switch (__storage.engine) {
        case 'mongodb':
          const mongoclient = require('mongodb').MongoClient;
          const url = 'mongodb://' + __storage.dblocation; // production mode
          if (__mode == 'development') { url = 'mongodb://' + __storage.dblocation; }
          client = new mongoclient(url);
          await client.connect();
          db = client.db(__storage.dbname);
          break;
        default:
          db = null;
      }
    } catch (err) {
      logger.err(`${f}.init`, err);
    }

  },

  close: async () => {
    try {
      switch (__storage.engine) {
        case 'mongodb':
          await client.close();
          break;
        default:
      }
    } catch (err) {
      logger.err(`${f}.close`, err);
    }
  }
};





