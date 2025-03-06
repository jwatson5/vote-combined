/**********************************************************************
** index-front.js                                                    **
**                                                                   **
**  Development frontend for voting web application                  **
**                                                                   **
**                                                                   **
**********************************************************************/

import express from 'express';
const app = express();

async function main() {
  try {
    console.info('\nindex-front.mjs: ---------------------------------------------------');
    console.info('index-front.mjs: starting voting app frontend');

    app.use(express.static('public_html'));

    app.listen(8000, () => {
      console.info(`frontend app is listening on http://localhost:8000/bulma.html`);
      console.info('index-front.mjs: ---------------------------------------------------');
    });

    // if pm2 is being used register with the manager
    if (process.send) {
      process.send('ready');
      console.info("registered process with pm2 manager");
    }

    // shutdown cleanly on sigint for pm2
    process.on('SIGINT', async () => {
      console.info('\nindex-front.mjs: ---------------------------------------------------');
      console.info("index-front.mjs: attempting to nicely shutdown express");
      console.info("index-front.mjs: completly shutdown, exiting");
      console.info('index-front.mjs: ---------------------------------------------------');
      process.exit(0);
    });

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();