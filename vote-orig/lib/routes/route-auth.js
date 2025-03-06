/*****************************************************************************
**                                                                          **
** route-auth.js                                                            **
**  express router to handle all operations related to ident/auth           **
**                                                                          **
**                                                                          **
*****************************************************************************/

// ext libraries
const express = require('express'),
      router = express.Router(),
      AJV = require("ajv");

// app libraries
const logger = require(__apphome + '/lib/util/logger'),
      bank = require(__apphome + '/lib/session/bank'),
      modAuth = require(__apphome + '/lib/auth/mod-auth'),
      cliAuth = require(__apphome + '/lib/auth/cli-auth');

// data validator for request data security passed to app
const ajv = new AJV({allErrors: true, async: true});
const validate = {
  'login': ajv.compile({
    'type': 'object',
    'properties': {
      'name': {'type': 'string'},
      'email': {'type': 'string'},
      'key': {'type': 'string'}
    },
    'required': ["name", "email", "key"],
    'additionalProperties': false
  }),
  'modlogin': ajv.compile({
    'type': 'object',
    'properties': {
      'passwd': {'type': 'string'},
      'key': {'type': 'string'}
    },
    'required': ["passwd", "key"],
    'additionalProperties': false
  }),
};

// logger info
const f = "route-auth";

router.post('/login', async (req, res) => {
  try {
    logger.info(
      `${f} login post`, 
      { "info": "client login from", 
        "data": req.session }
    );

    /*
    ** Data object format in body 
    ** {
    **   "name": "name_from_user",
    **   "email": "email_from_user"
    **   "key": "session_key_from_user"
    ** }
    */

    const data = req.body;
    const v = await validate.login(data);

    if(v) {
      // data object is valid from the client
      r = await cliAuth.login(data, req.session); // lib/auth/cli-auth
      logger.info(`${f} login route`, {"info": "results", "data": r});
  
      res.json({ stat: true, message: r });
      res.end();
    } else {
      // data validation problem
      logger.err(
        `${f} modlogin post`, 
        { "info": "modlogin validate", 
          "data": validate.login.errors }
      );
      throw 'malformed data';
    }
    /*
    let r = "badkey";
    const modInfo = await getModeratorInfo();
    if (data.key == modInfo.key) {
      this.voterAuth(socket);
      r = await cliAuth.login(socket, data, modInfo); // lib/auth/cli-auth
      const v = await bank.vote.getCurrent(r.ident) // returns senator voter info
      if (v) {
        if (v.voting) {
          r.vote = v;
        }
      }
      logger.info(`${f} login route`, {"info": "results", "data": r});
    }
    ack({ stat: true, message: r });
    */
  } catch (err) {
    logger.err(`${f} login post`, err);
    res.status(404);
    res.end();
  }
});

router.post('/modlogin', async(req, res) => {
  try {

    /*
    ** Data object format in body 
    ** {
    **   "passwd": "password_from_user",
    **   "key": "session_key_from_user"
    ** }
    */

    const data = req.body;
    const v = await validate.modlogin(data);
    if(v) {

      const r = await modAuth.login(data, req.session); // lib/auth/mod-auth
      // r will be badpass if auth fail

      /*
      ** object structure to be sent for successful login
      ** {
      **   "stat": true,
      **   "message": {
      **     "ident": {
      **       "name": "Moderator",
      **       "email": "moderator",
      **       "key": "key_sent_from_successful_auth"
      **     },
      **     "clientCount": 0,
      **     "vote": null
      **   }
      ** }
      */
      logger.info(
        `${f} modlogin post`, 
        { "info": "modlogin modAuth result", 
          "data": r }
      );

      res.json({ stat: true, message: r });
      res.end();
    } else {
      // data validation problem
      logger.err(
        `${f} modlogin post`, 
        { "info": "modlogin validate", 
          "data": validate.modlogin.errors }
      );
      throw 'malformed data';
    }
  } catch (err) {
    logger.err(`${f} modlogin post`, err);
    res.status(404);
    res.end();
  }  
});

router.get('/logout', async (req, res) => {
  logger.info(
    `${f} logout get`, 
    { "info": "logout called from", "data": req.session }
  );
  try {
    if(req.session.hasOwnProperty('ident')) {
      const r = await cliAuth.logout(req.session); // lib/auth/cli-auth
      res.json({ stat: true, message: r });
      res.end();
    } else {
      throw 'auth logout failed';
    }



    /*
    const modInfo = await getModeratorInfo();
    const r = {
      ident: {},
      serverSession: modInfo.serverSession
    }
    this.voterDeauth(socket);
    ack({ stat: true, message: r });
    */
  } catch (err) {
    logger.err(`${f} logout get`, err);
    res.status(404);
    res.end();  
  }
});

router.post('/modlogout', async (req, res) => {
  logger.info(
    `${f} modlogout post`, 
    { "info": "moderator (req.session.id) logout from",
      "data": req.session.id }
  );
  logger.info(
    `${f} modlogout post`, 
    { "info": "moderator (__moderator.id) logout from", 
      "data": __moderator.id }
  );
  try {
    if(req.session.id == __moderator.id) { // this is the moderator
      const r = await modAuth.logout(req.session); // lib/auth/mod-auth

      /*
      ** Object sample to be sent to client
      ** {
      **   "stat": true,
      **   "message": {
      **      "ident": {},
      **      "vote": null
      **   }
      ** }
      */

      res.json({ stat: true, message: r });
      res.end();
    } else {
      throw 'auth logout failed';
    }
  } catch (err) {
    logger.err(`${f} modlogout post`, err);
    res.status(404);
    res.end();
  }
});


module.exports = router;