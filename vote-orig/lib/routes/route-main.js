/*****************************************************************************
**                                                                          **
** route-main.js                                                            **
**  express router to handle all operations related to ident/auth           **
**                                                                          **
**                                                                          **
*****************************************************************************/

const express = require('express'),
      router = express.Router(),
      AJV = require("ajv");

const logger = require(__apphome + '/lib/util/logger'),
      bank = require(__apphome + '/lib/session/bank'),
      updateFaculty = require(__apphome + '/lib/util/faculty-profiles');

// data validator for request data security passed to app
const ajv = new AJV();
const validate = {
  'setConfig': ajv.compile({
    'type': 'object',
    'properties': {
      'status': {'type': 'boolean'},
    }
  }),
  'uFaculty': ajv.compile({
    'type': 'object',
    'properties': {
      'op': {'type': 'string'},
    }
  }),
};

// logger info
const f = "route-main";

router.get('/faculty-list', async (req, res) => {
  try {
    // TODO: I think this is moderator only...
    if(req.session.hasOwnProperty('ident')) { // only send to auth clients
      // retrieve faculty list
      logger.info(
        `${f} faculty-list get`, 
        { "info": "recieved faculty-list event from", 
          "data": req.session.id }
      );
      const r = await bank.faculty.lookup();
      res.json({ stat: true, message: r });
      res.end();
    } else {
      throw 'not authorized';
    }
  } catch (err) {
    logger.err(`${f} faculty-list get`, err);
    res.status(404);
    res.end();  
  }    
});

router.get('/senator-list', async (req, res) => {
  try {
    // retrieve senator list
    logger.info(
      `${f} senator-list get`, 
      { "info": "recieved senator-list event from", 
        "data": req.session.id }
    );
    const r = await bank.faculty.senators();
    res.json({ stat: true, message: r });
    res.end();  
  } catch (err) {
    logger.err(`${f} senator-list get`, err);
    res.status(404);
    res.end();  
  }    
});

router.put('/set-config', async (req, res) => {
  try {
    const data = req.body;
    const v = validate.setConfig(data);
    if((req.session.id == __moderator.id) && v) { // op for moderator only
      logger.info(
        `${f} set-config put`, 
        { "info": "recieved moderator set-config event from", 
          "data": req.session.id }
      );      
      let id = req.session.ident;
      if (data.status) {
        id.config = data.status;
        id.progress = updateFaculty.getProgress();
      } else {
        delete id.config;
        delete id.progress;
      }
      req.session.ident = id;
      await bank.saveSession(req.session);
      __moderator = req.session;
      res.json({ stat: true, message: id });
      res.end(); 
    } else {
      if(v) {
        // not authorized to call route
        throw 'not authorized';
      } else {
        // data validation problem
        logger.err(
          `${f} set-config put`, 
          { "info": "set-config validate", "data": validate.setConfig.errors }
        );
        throw 'malformed data';
      }
    }
  } catch (err) {
    logger.err(`${f} set-config put`, err);
    res.status(404);
    res.end();
  }    
});

router.put('/update-faculty', async (req, res) => {
  try {
    const data = req.body;
    const v = validate.uFaculty(data);
    if((req.session.id == __moderator.id) && v) { // op for moderator only
      let r = true;
      if (data.op == "start") {
        logger.info(
          `${f} update-faculty put`, 
          { "info": "recieved moderator update-faculty event from",
            "data": req.session.id }
        );
        updateFaculty.updateFaculty();
      } else if (data.op == "check") {
        r = updateFaculty.getProgress();
        if (r == 100) {
          updateFaculty.reset();
        }
      }
      res.json({ stat: true, message: r });
      res.end(); 
    } else {
      if(v) {
        // not authorized to call route
        throw 'not authorized';
      } else {
        // data validation problem
        logger.err(
          `${f} update-faculty put`, 
          { "info": "update-faculty validate", 
            "data": validate.uFaculty.errors }
        );
        throw 'malformed data';
      }
    }
  } catch (err) {
    logger.err(`${f} update-faculty put`, err);
    res.status(404);
    res.end();
  }    
});

router.get('/refresh', async(req, res) => {
  try {
    logger.info(`${f} refresh get`, 'start');
    logger.info(`${f} refresh get session`, req.session);
    // default for initial connection
    let m = null;
    let curSess = false;
    if(__moderator) curSess = true;

    if(req.session.hasOwnProperty('ident')) {
      // is an authenticated client
      if(req.session.ident.name == "Moderator") {
        logger.info(`${f} refresh get moderator`, "moderator prev auth req");
        // previously authenticated moderator
        if(!curSess) { // no moderator object
          logger.info(`${f} refresh get moderator`, "moderator prev auth req, no server auth");
          // should rarely get here
          //  state session has auth info, but server has lost it
          __moderator = req.session;
        }
        logger.info(`${f} refresh get moderator`, "moderator match auth req");
        // here __moderator should == req.session.id
        // legit moderator
        /*servInfo = {
          serverSession: true,
          key: __moderator.ident.key
        };*/      
  
        m = {
          ident: req.session.ident,
          clientCount: await bank.vote.votersCount(),
          vote: await bank.vote.getCurrent(false),
          voteCount: await bank.vote.totalVotes()
        };
      } else {
        // authenticated senator
        /*
          This is what the senator client will set to refresh
          global.ident = data.ident; {name: data.name, email: data.email}
          global.serverSession = data.serverSession; // true/false
          vote.info = data.vote;     
                vdata = {_id: v._id, name: v.name,
                          title: v.title,
                          candidates: v.candidates
                };
          vote.currentVote = data.currentVote; 
                             await queries.vote.current.voter(cli.email);
        */

        logger.info(`${f} refresh get senator`, "is authenticated");
        logger.info(`${f} refresh get senator`, req.session.ident);
        // TODO: I'll have to run through my auth senator array and see
        //       if there is an existing session for this client (should be)
        //       if not, I need to add it to the array
        // auth senator
        m = {
          ident: req.session.ident,
          serverSession: curSess
        };
        // returns senator voter info
        let v = await bank.vote.getCurrent(session.ident); 
        if (v) {
          // current vote
          if (v.voting) {
            // session is in voting, so send cast vote info
            if (v.votes) {
              m.currentVote = v.votes[0];
              delete v.votes;
            }
            m.vote = v;
          }
        }
      }
    } else {
      // not an authenticated client
      logger.info(`${f} refresh get unauth`, "not authenticated");
      m = {
        ident: {},
        serverSession: curSess,
      };
    }

    logger.info(`${f} refresh get`, "finished");
    logger.info(`${f} refresh get message`, m);

    res.json({ stat: true, message: m });
    res.end();  

  } catch (err) {
    logger.err(`${f} refresh get`, err);
    res.status(404);
    res.end();  
  }    
});

router.get('/events', async (req, res) => {
  try {
    if(req.session.hasOwnProperty('ident')) { // authenticated senator
      logger.info(
        `${f} events get`, 
        { "info": "sse connected from", 
          "data": req.sessionID }
      );
      const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
      };
      res.writeHead(200, headers);
      const cliEvt = {
        id: req.sessionID,
        sse: res,
      };
      __senatorEvents.push(cliEvt);
      const initData = { "info": "sse initiated for", "data": req.sessionID };
      // send an initial log item... every other log will be sent by logger
      res.write(`data: ${JSON.stringify(initData)}\n\n`);

      req.on('close', async () => {
        logger.info(
          `${f} events get`, 
          { "info": "sse res closed from", 
            "data": req.sessionID }
        );
        let found = -1;
        for(let i = 0; i < __senatorEvents.length; i++) {
          if(req.sessionID == __senatorEvents[i].id) {
            logger.info(
              `${f}.logout`, 
              { "info": "senatorEvent found at",
                "data": i } 
            );
            found = i;
          }
        }
        if(found >= 0) __senatorEvents = __senatorEvents.splice(found, found);
        logger.info(
          `${f}.logout`, 
          { "info": "senatorEvent size",
            "data": __senatorEvents.length } 
        );
      for(let i = 0; i < __senatorEvents.length; i++) {
          logger.info(
            `${f}.logout`, 
            { "info": "senatorEvent item",
              "data": __senatorEvents[i].id } 
          );
        }
  
        await bank.deleteSession(req.session);
      });
    } else {
      throw 'not authorized';
    }
  } catch (err) {
    logger.err(`${f} modevents get`, err);
    res.status(404);
    res.end();
  }
});

router.get('/modevents', async (req, res) => {
  try {
    if(req.session.id == __moderator.id) { // this is the moderator
      logger.info(
        `${f} modevents get`, 
        { "info": "sse connected from", 
          "data": __moderator }
      );
      const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
      };
      res.writeHead(200, headers);
      
      //const eDat = {obj: "field1", nobj: 321};
      //res.write(`data: ${JSON.stringify(eDat)}\n\n`);
      //req.session.ident.sse = res;
      //await bank.saveSession(req.session);
      __moderator.ident.sse = res;

      const initData = { "info": "sse initiated for", "data": __moderator.id };
      // send an initial log item... every other log will be sent by logger
      res.write(`data: ${JSON.stringify(initData)}\n\n`);

      req.on('close', async () => {
        if(__moderator) {
          logger.info(
            `${f} modevents get`, 
            { "info": "sse res closed from", 
              "data": __moderator.id }
          );
          delete __moderator.ident.sse;
        }
      });

    } else {
      throw 'not authorized';
    }
  } catch (err) {
    logger.err(`${f} modevents get`, err);
    res.status(404);
    res.end();
  }
});

module.exports = router;