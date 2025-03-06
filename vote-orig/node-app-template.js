/*
** node-app-template.js - template for pm2 clean apps
*/

global.__apphome = __dirname;
global.__mode = process.env.NODE_ENV;

// local libraries

async function main() {
  try {
    __log('index.js', '---------------------------------------------------');
    __log('index.js', '');
    __log('index.js', 'starting app');
    __log('index.js', '');

    if(__mode == 'development') {
      __log('index.js', 'application mode is ' + __mode);
      __log('index.js', '');
    }
    if(process.send) {
      // only runs if this was started from another process
      //  this sends pm2 a ready message
      process.send('ready');
      __log('index.js', 'registered with pm2 manager');
      __log('index.js', '');
    }
    __log('index.js', '---------------------------------------------------');
    // begin app here, runs until clean shutdown

    // shutdown cleanly on sigint for pm2
    process.on('SIGINT', async () => {
      __log('\n\nindex.js', '---------------------------------------------------');
      __log('index.js', 'SIGINT recieved, shutting down');
      __log('index.js', '');
      __log('index.js', 'app completely stopped, exiting');
      __log('index.js', '');
      __log('index.js', '---------------------------------------------------');
      process.exit(0);
    });
  } catch(err) {
    console.error(err);
    process.exit(1);
  }
} // end main() function

global.__log = function(src, msg) {
  if(typeof msg === 'string') {
    console.info(src + ': ' + msg);
  } else {
    console.info(src + ': ' + JSON.stringify(msg));
  }
}

main();
