/**********************************************************************
** util/logger.js                                                    **
**                                                                   **
**  handles how, when and what format to log                         **
**   uses the following scheme:                                      **
**    __loglevel global:                                             **
**      0: no verbosity in logs                                      **
**      1: verbose logs to moderator client                          **
**      2: verbose logs to server console                            **
**                                                                   **
**********************************************************************/

// logger info
const f = "logger";

/*
function logClient(eDat) {
  if(__moderator) {
    if(__moderator.ident.sse) {
      __moderator.ident.sse.write(`data: ${JSON.stringify(eDat)}\n\n`);
    } else {
      // we're at log level to client, but no connection, log to console
      console.info(`${eDat.serverlog.src}: ${JSON.stringify(eDat.serverlog.message)}`);
    }
  }
}
*/

const logger = {
  info: (src, message) => {
    switch (__loglevel) {
      case 1:
        const m = {"serverlog": {"src": src, "message": message}};
        //logClient(m);
        console.info(`${src}: ${JSON.stringify(message)}`);
        break;
      case 2:
        console.info(`${src}: ${JSON.stringify(message)}`);
        break;
      default:
        // do nothing should be loglevel 0
    }
  },
  err: function (src, e) {
    // const e = Error(err); // not sure what this gets you
    switch (__loglevel) {
      case 1:
        const m = {"serverError": {"src": src, "error": e}};
        console.error(`${src}: ${e}`);
        //logClient(m);
        break;
      default:
        // at least log errors to console for case 0 and 2
        console.error(`${src}: ${e}`);
    }
  },
  startup: {
    // handles the server startup messages
    init: () => {
      console.info(`\nindex.js: ---------------------------------------------------`);
      console.info(`index.js: starting an awesome voting app`);
    },
    stop: () => {
      console.info(`\nindex.js: SIGINT recieved, shutting down`);
      console.info(`index.js: ---------------------------------------------------`);
    },
    info: (message) => {
      console.info(`index.js: ${message}`);
    },
    finish: () => {
      console.info(`index.js: ---------------------------------------------------`);
    }, 
  },
  /*
  sendtoClients: (msg) => {
    let d = {op: msg.op};
    switch (d.op) {
      case 'vote-update':
        d.update = {
          serverSession: true,
          vote: null,
        };
        if (msg.data.voting) {
          d.update.vote = {
            _id: msg.data._id,
            name: msg.data.name,
            title: msg.data.title,
            candidates: msg.data.candidates
          };
        }
        break;
      default:
    };
    // send data to voting clients
    for(let i = 0; i < __senatorEvents.length; i++) {
      logger.info(
        `${f}.sendtoClients`, 
        { "info": "sending to", "data": __senatorEvents[i].id }
      );
      __senatorEvents[i].sse.write(`data: ${JSON.stringify(d)}\n\n`);
    }
  },
  
  sendModerator: (msg) => {
    let d = {op: msg.op};
    switch (d.op) {
      default:
    };
    logger.info(
      `${f}.sendModerator`, 
      { "info": "sending to", "data": __moderator.id }
    );
  __moderator.ident.sse.write(`data: ${JSON.stringify(d)}\n\n`);

  },
  */
};

export default logger;