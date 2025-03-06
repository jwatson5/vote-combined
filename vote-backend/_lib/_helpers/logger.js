/**
 * @fileoverview Handles how, when and what format to log
 *    uses the following scheme:
 *      __loglevel global:
 *        0: no verbosity in logs
 *        1: verbose logs to moderator client
 *        2: verbose logs to server console
 * 
 * @version 1.0.0
 * @date 2025-02-13
 * @author Jason Watson
 */

// utility libraries and constants
import { fileURLToPath } from 'node:url';
import { basename } from 'node:path';
const F = basename(fileURLToPath(import.meta.url));

const logger = {
  logtypes: (src, message) => {
    if(typeof message === 'object') {
      console.info(`${src}:`);
      console.info(message);
    } else {
      console.info(`${src}: ${message}`);
    }
  },
  info: (src, message) => {
    switch (__loglevel) {
      case 1:
        //const m = {"serverlog": {"src": src, "message": message}};
        logger.logtypes(src, message);
        break;
      case 2:
        logger.logtypes(src, message);
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
      console.info(`\nserver.js: ---------------------------------------------------`);
      console.info(`server.js: starting an awesome voting app`);
    },
    stop: () => {
      console.info(`\nindex.js: SIGINT recieved, shutting down`);
      console.info(`server.js: ---------------------------------------------------`);
    },
    info: (message) => {
      console.info(`server.js: ${message}`);
    },
    finish: () => {
      console.info(`server.js: ---------------------------------------------------`);
    }, 
  },
};

export default logger;