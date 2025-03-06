/**********************************************************************
** util/server.js                                                    **
**                                                                   **
**  manages promises for express and http server                     **
**    -- helps the init code look cleaner                            **
**                                                                   **
**********************************************************************/

import http from 'http';
let httpServe = null;

const appServer = {
  start: (expressApp) => {
    return new Promise((resolve, reject) => {
      httpServe = http.createServer(expressApp).listen(process.env.PORT, () => {
        resolve();
      });
    });
  },
  stop: () => {
    return new Promise((resolve, reject) => {
      if(httpServe) {
        const readyToQuit = () => {
          httpServe.close(() => {
            resolve();
          });
        };
        readyToQuit();
        /*
        if(__moderator) {
          // moderator is logged in, handle it
          // send a message to the client to close the connection and logout
          for(let i = 0; i < __senatorEvents.length; i++) {
            __senatorEvents[i].sse.write(`data: ${JSON.stringify({"close": null})}\n\n`);
          }
          __moderator.ident.sse.write(`data: ${JSON.stringify({"close": null})}\n\n`);
          // TODO: send a close to all the senator clients
          const intID = setInterval(() => {
            if(!__moderator) {
              // logged out, ready to close everything else
              r = true;
              clearInterval(intID);
              readyToQuit();
            }
          }, 430);
        } else {
          readyToQuit();
        }
        */
      } else {
        reject();
      }
    });
  },
};

export default appServer;