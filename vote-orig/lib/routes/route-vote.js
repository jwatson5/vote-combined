/*****************************************************************************
**                                                                          **
** route-vote.js                                                            **
**  express router to handler all operations related to the voting          **
**                                                                          **
**                                                                          **
*****************************************************************************/

const express = require('express'),
      router = express.Router(),
      AJV = require("ajv");

const logger = require(__apphome + '/lib/util/logger'),
      bank = require(__apphome + '/lib/session/bank');

// data validator for request data security passed to app
const ajv = new AJV({allErrors: true, async: true});
const validate = {
  'cast': ajv.compile({
    'type': 'object',
    'properties': {
      'voter': {'type': 'string'},
      'candidate': {'type': 'string'}
    },
    'required': ["voter", "candidate"],
    'additionalProperties': false
  }),
  'newV': ajv.compile({
    'type': 'object',
    'properties': {
      'type': {'type': 'string'},
      'name': {'type': 'string'},
      'title': {'type': 'string'},
      'candidates': {
          'type': 'array', 
          'items': {
            'type': 'object',
            'properties': {
              'name': {'type': 'string'},
              'email': {'type': 'string'},
              'initial': {'type': 'string'},
              'photo': {'type': ['string', 'null']},
              'votes': {'type': 'integer'}
            },
            'required': ["name", "email", "initial", "photo", "votes"],
            'additionalProperties': false
          }
      },
    },
    'required': ["type", "name", "title", "candidates"],
    'additionalProperties': false
  }),
  'newC': ajv.compile({
    'type': 'object',
    'properties': {
      'passwd': {'type': 'string'},
      'key': {'type': 'string'}
    },
    'required': ["passwd", "key"],
    'additionalProperties': false
  }),
  'delC': ajv.compile({
    'type': 'object',
    'properties': {
      'passwd': {'type': 'string'},
      'key': {'type': 'string'}
    },
    'required': ["passwd", "key"],
    'additionalProperties': false
  }),
  'update': ajv.compile({
    'type': 'object',
    'properties': {
      'title': {'type': 'string'},
    },
    'required': ["title"],
    'additionalProperties': false
  }),
  'voteid': ajv.compile({
    'type': 'object',
    'properties': {
      'id': {'type': 'string'}
    },
    'required': ["id"],
    'additionalProperties': false
  }),
};

// logger info
const f = "route-vote";

function emitVoteChange(data) {
  logger.info(
    `${f}.emitVoteChange`, 
    { "info": "moderator emitVoteChange", "data": data }
  );
}

router.put('/cast', async (req, res) => {
  try {

    /*
    const c = $(this).attr('data-email');
    const voteInfo = {
      voter: global.ident.email,
      candidate: c
    };
    */

    const data = req.body;
    const v = validate.cast(data);
    if(req.session.hasOwnProperty('ident') && v) {
      logger.info(
        `${f} cast put`, 
        { "info": "vote cast-vote from id", "data": v }
      );
      const r = await bank.vote.processVote(data);
      res.json({ stat: true, message: r });
      res.end();    
    } else {
      if(v) {
        // not authorized to call route
        throw 'not authorized';
      } else {
        // data validation problem
        logger.err(
          `${f} cast put`, 
          { "info": "cast-vote validate", "data": validate.cast.errors }
        );
        throw 'malformed data';
      }
    }
  } catch (err) {
    logger.err(`${f} cast put`, err);
    res.status(404);
    res.end();
  }    
});

router.get('/info', async (req, res) => {
  try {
    if(req.session.id == __moderator.id) { // op for moderator only
      const r = {
        "clientCount": await bank.vote.votersCount(),
        "voteCount": await bank.vote.totalVotes(),
      };
     
      /*
      ** Object sample
      ** {
      **   "stat": true,
      **   "message": {
      **      "clientCount": 0,
      **      "voteCount": {}
      **   }
      ** }
      */

      res.json({ stat: true, message: r });
      res.end();  
    } else {
      throw 'not authorized';
    }
  } catch (err) {
    logger.err(`${f} info get`, err);
    res.status(404);
    res.end();
  }    
});

router.route('/data/:id')
.get(async (req, res) => {
  try {
    const data = req.params;
    logger.info(
      `${f} data/:id get`, 
      { "info": "moderator vote-load", "data": data }
    );
    const v = validate.voteid(data);
    if((req.session.id == __moderator.id) && v) { // op for moderator only
      logger.info(
        `${f} data/:id get`, 
        { "info": "moderator vote-load from id", "data": req.session.id }
      );
      const r = await bank.vote.load(data.id);
      res.json({ stat: true, message: r });
      res.end();
    } else {
      if(v) {
        // not authorized to call route
        throw 'not authorized';
      } else {
        // data validation problem
        logger.err(
          `${f} data/:id get`, 
          { "info": "vote-load validate", "data": validate.voteid.errors }
        );
        throw 'malformed data';
      }
    }
  } catch (err) {
    logger.err(`${f} data/:id get`, err);
    res.json({ stat: false, message: err });
    res.end();
  }    
})
.post(async (req, res) => {
  try {

    /*
    ** Object from client in body
    ** {
    **   "type": "motion",
    **   "name": "user_entered_name",
    **   "title": "user_entered_title",
    **   "candidates": [
    **     {
    **       "name": "Yea",
    **       "email": "yea",
    **       "initial": "Y",
    **       "photo": null,
    **       "votes": 0
    **     },
    **     ........
    **   ]
    ** }
    */

    const data = req.body;
    const v = validate.newV(data);
    if((req.session.id == __moderator.id) && v) { // op for moderator only
      logger.info(
        `${f} data/:id post`, 
        { "info": "moderator vote-new from id", "data": req.session.id }
      );
      const r = await bank.vote.new(data);

      /*
      ** Object sample sent to client
      ** {
      **   "stat": true,
      **   "message": {
      **     "_id": "63ed170c4f30ba0aae14aafb",
      **     "loaded": true,
      **     "voting": false,
      **     "type": "motion",
      **     "name": "user_entered_name",
      **     "title": "user_entered_title",
      **     "candidates": [
      **       {
      **         "name": "Yea",
      **         "email": "yea",
      **         "initial": "Y",
      **         "photo": null,
      **         "votes": 0
      **       },
      **       ........
      **     ],
      **     "votes": [],
      **     "nominees": [],
      **     "deleted": false,
      **     "date": "2023-02-15T17:31:56.650Z",
      **     "log": []
      **   }
      ** }
      */

      res.json({ stat: true, message: r });
      res.end();    
    } else {
      if(v) {
        // not authorized to call route
        throw 'not authorized';
      } else {
        // data validation problem
        logger.err(
          `${f} data/:id post`, 
          { "info": "vote-new validate", "data": validate.newV.errors }
        );
        throw 'malformed data';
      }
    }
  } catch (err) {
    logger.err(`${f} data/:id post`, err);
    res.json({ stat: false, message: err });
    res.end();
  }    
})
.put(async (req, res) => {
  try {

    /*
    ** Object from client in body
    ** {
    **   id: "63ed231fa4baa68420497118",
    **   title: "tmp 21",
    ** }
    */

    const p = req.params;
    const b = req.body;
    const vp = validate.voteid(p);
    const vb = validate.update(b);
    if((req.session.id == __moderator.id) && vp && vb) { // op for moderator only
      logger.info(
        `${f} data/:id put`, 
        { "info": "moderator vote-update from id", "data": req.session.id }
      );
      const data = {
        "_id": p.id,
        "title": b.title,
      };
      logger.info(
        `${f} data/:id put`, 
        { "info": "data object", "data": req.session.id }
      );
      const r = await bank.vote.update(data);
      res.json({ stat: true, message: r });
      res.end();
    } else {
      if(vp && vb) {
        // not authorized to call route
        throw 'not authorized';
      } else {
        // data validation problem
        logger.err(
          `${f} data/:id put`, 
          { "info": "vote-update validate", "data": validate.voteid.errors }
        );
        logger.err(
          `${f} data/:id put`, 
          { "info": "vote-update validate", "data": validate.update.errors }
        );
        throw 'malformed data';
      }
    }
  } catch (err) {
    logger.err(`${f} data/:id put`, err);
    res.json({ stat: false, message: err });
    res.end();
  }    
})
.delete(async (req, res) => {
  try {
    const data = req.params;
    logger.info(
      `${f} data/:id delete`, 
      { "info": "moderator vote-delete", "data": data }
    );
    const v = validate.voteid(data);
    if((req.session.id == __moderator.id) && v) { // op for moderator only
      logger.info(
        `${f} data/:id delete`, 
        { "info": "moderator vote-delete from id", "data": req.session.id }
      );
      const r = await bank.vote.delete(data.id);
      res.json({ stat: true, message: r });
      res.end();
    } else {
      if(v) {
        // not authorized to call route
        throw 'not authorized';
      } else {
        // data validation problem
        logger.err(
          `${f} data/:id delete`, 
          { "info": "vote-delete validate", "data": validate.voteid.errors }
        );
        throw 'malformed data';
      }
    }
  } catch (err) {
    logger.err(`${f} data/:id delete`, err);
    res.json({ stat: false, message: err });
    res.end();
  }    
});

router.route('/candidate')
.post(async (req, res) => {
  try {
    const data = req.body;
    const v = validate.newC(data);
    if((req.session.id == __moderator.id) && v) { // op for moderator only
      logger.info(
        `${f} candidate post`, 
        { "info": "moderator vote-new-candidate from id", "data": req.session.id }
      );
      const r = await bank.vote.addCandidate(data);
      res.json({ stat: true, message: r });
      res.end();
    } else {
      if(v) {
        // not authorized to call route
        throw 'not authorized';
      } else {
        // data validation problem
        logger.err(
          `${f} candidate post`, 
          { "info": "vote-new-candidate validate", "data": validate.newC.errors }
        );
        throw 'malformed data';
      }
    }
  } catch (err) {
    logger.err(`${f} candidate post`, err);
    res.json({ stat: false, message: err });
    res.end();
  }    
})
.delete(async (req, res) => {
  try {
    const data = req.body;
    const v = validate.delC(data);
    if((req.session.id == __moderator.id) && v) { // op for moderator only
      logger.info(
        `${f} candidate delete`, 
        { "info": "moderator vote-del-candidate from id", "data": req.session.id }
      );
      const r = await bank.vote.remCandidate(data.vid, data.email);
      res.json({ stat: true, message: r });
      res.end();
    } else {
      if(v) {
        // not authorized to call route
        throw 'not authorized';
      } else {
        // data validation problem
        logger.err(
          `${f} candidate delete`, 
          { "info": "vote-del-candidate validate", "data": validate.delC.errors }
        );
        throw 'malformed data';
      }
    }
   
  } catch (err) {
    logger.err(`${f} candidate delete`, err);
    res.json({ stat: false, message: err });
    res.end();
  }    
});

router.route('/control/:id')
.get(async (req, res) => {
  try {
    const data = req.params;
    const v = validate.voteid(data);
    if((req.session.id == __moderator.id) && v) { // op for moderator only
      logger.info(
        `${f} control get`, 
        { "info": "moderator vote-start from id", "data": req.session.id }
      );
      const r = await bank.vote.startVoting(data.id);
      logger.info(
        `${f} control get`, 
        { "info": "moderator vote-start data", "data": r }
      );
      logger.sendtoClients({op: "vote-update", data: r});
      res.json({ stat: true, message: r });
      res.end();
    } else {
      if(v) {
        // not authorized to call route
        throw 'not authorized';
      } else {
        // data validation problem
        logger.err(
          `${f} control get`, 
          { "info": "vote-start validate", "data": validate.voteid.errors }
        );
        throw 'malformed data';
      }
    }
  } catch (err) {
    logger.err(`${f} control get`, err);
    res.status(404);
    res.end();  
  }    
})
.post(async (req, res) => {
  try {
    const data = req.params;
    const v = validate.voteid(data);
    if((req.session.id == __moderator.id) && v) { // op for moderator only
      logger.info(
        `${f} control post`, 
        { "info": "moderator vote-accept from id", "data": req.session.id }
      );
      const r = await bank.vote.acceptVote(data.id);
      res.json({ stat: true, message: r });
      res.end();
    } else {
      if(v) {
        // not authorized to call route
        throw 'not authorized';
      } else {
        // data validation problem
        logger.err(
          `${f} control post`, 
          { "info": "vote-accept validate", "data": validate.voteid.errors }
        );
        throw 'malformed data';
      }
    }
  } catch (err) {
    logger.err(`${f} control post`, err);
    res.status(404);
    res.end();  
  }    
})
.put(async (req, res) => {
  try {
    const data = req.params;
    const v = validate.voteid(data);
    if((req.session.id == __moderator.id) && v) { // op for moderator only
      logger.info(
        `${f} control put`, 
        { "info": "moderator vote-revote from id", "data": req.session.id }
      );
      const r = await bank.vote.revote(data.id);
      logger.info(
        `${f} control put`, 
        { "info": "moderator vote-revote data", "data": r }
      );
      logger.sendtoClients({op: "vote-update", data: r});
      res.json({ stat: true, message: r });
      res.end();
    } else {
      if(v) {
        // not authorized to call route
        throw 'not authorized';
      } else {
        // data validation problem
        logger.err(
          `${f} control put`, 
          { "info": "vote-revote validate", "data": validate.voteid.errors }
        );
        throw 'malformed data';
      }
    }   
  } catch (err) {
    logger.err(`${f} control put`, err);
    res.status(404);
    res.end();  
  }    
})
.delete(async (req, res) => {
  try {
    const data = req.params;
    const v = validate.voteid(data);
    if((req.session.id == __moderator.id) && v) { // op for moderator only
      logger.info(
        `${f} control delete`, 
        { "info": "moderator vote-stop from id", "data": req.session.id }
      );
      const r = await bank.vote.stopVoting(data.id);
      //emitVoteChange(r);
      logger.info(
        `${f} control put`, 
        { "info": "moderator vote-revote data", "data": r }
      );
      logger.sendtoClients({op: "vote-update", data: r});
      res.json({ stat: true, message: r });
      res.end();
    } else {
      if(v) {
        // not authorized to call route
        throw 'not authorized';
      } else {
        // data validation problem
        logger.err(
          `${f} control delete`, 
          { "info": "vote-stop validate", "data": validate.voteid.errors }
        );
        throw 'malformed data';
      }
    }    
  } catch (err) {
    logger.err(`${f} control delete`, err);
    res.status(404);
    res.end();  
  }    
});

router.get('/hist', async (req, res) => {
  try {
    if(req.session.id == __moderator.id) { // op for moderator only
      logger.info(
        `${f} hist get`, 
        { "info": "moderator vote-hist from id", "data": req.session.id }
      );
      const r = await bank.vote.history();

      /*
      ** Object sample to be sent
      ** {
      **   "stat": true,
      **   "message": [
      **     {
      **       "_id": "63e5474876436750c3dd2220",
      **       "type": "motion",
      **       "name": "testign",
      **       "date": "2023-02-09T19:19:36.107Z"
      **     },
      **     ...
      **   ]
      ** }
      */

      res.json({ stat: true, message: r });
      res.end();
    } else {
      // not authorized to call route
      throw 'not authorized';
    }   
  } catch (err) {
    logger.err(`${f} hist get`, err);
    res.json({ stat: false, message: err });
    res.end();
  }    
});

router.put('/reset', async (req, res) => {
  try {
    logger.info(
      `${f} reset put`, 
      { "info": "moderator vote-reset body", "data": req.body }
    );
    const data = req.body;
    const v = await validate.voteid(data);
    if((req.session.id == __moderator.id) && v) { // op for moderator only
      logger.info(
        `${f} reset put`, 
        { "info": "moderator vote-reset from id", "data": req.session.id }
      );
      await bank.vote.close(data.id);
      res.json({ stat: true, message: null });
      res.end();
    } else {
      if(v) {
        // not authorized to call route
        throw 'not authorized';
      } else {
        // data validation problem
        logger.err(
          `${f} reset put`, 
          { "info": "vote-reset validate", "data": validate.voteid.errors }
        );
        throw 'malformed data';
      }
    }    
  } catch (err) {
    logger.err(`${f} reset put`, err);
    res.json({ stat: false, message: err });
    res.end();
  }    
});

module.exports = router;