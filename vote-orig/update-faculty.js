/**********************************************************************
** update-faculty.js                                                 **
**                                                                   **
**  Voting web application - update faculty only                     **
**                                                                   **
**                                                                   **
**********************************************************************/

// global variables
global.__apphome = __dirname;
global.__webroot = __dirname + '/public_html';
global.__simulation = false; // set if in simulation mode
global.__mode = process.env.NODE_ENV;
global.__storage = {
  engine: 'mongodb',
  dblocation: '127.0.0.1:27017/?maxPoolSize=20&w=majority',
  dbname: 'unavote'
};

const PORT = 8001;

// external libraries
      
// local libraries
const dbconn = require(__apphome + '/lib/util/db'),
      updateFaculty = require(__apphome + '/lib/util/faculty-profiles');

// main function
async function main() {
  try {
    console.info('update-faculty.js: -------------------------------------------');
    console.info('update-faculty.js: starting faculty-check');

    // initialize the main database connection
    await dbconn.init();
    console.info('update-faculty.js: ' + __storage.engine + ' database initialized');

    console.info('update-faculty.js: starting update-faculty');
    await updateFaculty.updateFaculty();
    console.info('update-faculty.js: finishing update-faculty');

    // if pm2 is being used register with the manager
    if (process.send) {
      process.send('ready');
      console.info('update-faculty.js: registered with pm2 manager');
    }

    console.info('update-faculty.js: -------------------------------------------');

    // shutdown cleanly on sigint for pm2
    process.on('SIGINT', async () => {
      console.info('\n\nupdate-faculty.js: -------------------------------------');
      console.info('update-faculty.js: SIGINT recieved, shutting down');
      await dbconn.close();
      console.info('update-faculty.js: ' + __storage.engine + ' database connections closed');
      console.info('update-faculty.js: update-faculty completely stopped, exiting');
      console.info('update-faculty.js: -----------------------------------------');
      process.exit(0);
    });

    // normal exit
    await dbconn.close();
    console.info('update-faculty.js: process finished, shutting down');
    console.info('update-faculty.js: ' + __storage.engine + ' database connections closed');
    console.info('update-faculty.js: update-faculty completely stopped, exiting');
    console.info('update-faculty.js: -----------------------------------------');
    process.exit(0);

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
} // end main() function

main();
