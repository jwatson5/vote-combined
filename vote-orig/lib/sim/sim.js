/**********************************************************************
** sim/sim.js                                                        **
**                                                                   **
**  completely simulates connected clients and votes for testing     **
**    the ui                                                         **
**                                                                   **
**********************************************************************/

//console.info('sim/sim.js: ');

let senators = {
    init: function(bank, db) {
      this.bank = bank;
      this.db = db;
      this.setNum();
    },
    bank: null,
    db: null,
    timer: null,
    min: 30, 
    max: 75,
    num: null,
    setNum: function() {
      this.num = Math.floor(Math.random() * (this.max - this.min) + this.min);
    },
    start: function() {
      this.timer = setInterval(async () => {
        let s = this.bank.voteSession.get();
        if(this.bank.voteSession.voters.connected() <= this.num 
              && s.name) { // s.name is not null if mod has loaded a session
          //console.info('sim/sim.js: num is less than connected, adding some');
          //add 1 - 6 senators each interval
          let numtoadd = Math.floor(Math.random() * 5) + 1;
          let qpipe = [
            {$project: {_id: 0, email: 1}},
            {$sample: {size: numtoadd}}
          ];
          let persVoters = await this.db.collection('faculty').aggregate(qpipe).toArray();
          //console.info('sim/sim.js: persVoters - ' + JSON.stringify(persVoters));
          let added = 0;
          for(let i = 0; i < persVoters.length; i++) {
            if(!this.bank.voteSession.voters.isConnected(persVoters[i].email)) {
              this.bank.voteSession.voters.add({
                email: persVoters[i].email,
                socket: null,
                session: null
              });
              added++;
            }
          }
          //console.info('sim/sim.js: added ' + added + ' clients to voter array');
        } else {
          clearInterval(this.timer);
          this.timer = null;
          console.info('sim/sim.js: timer ended num is ' 
                        + this.bank.voteSession.voters.connected());
        }
      }, 600)
      console.info('sim/sim.js: timer started num is ' + this.num);
    }
};

module.exports = {
  init: function(minSenators, maxSenators, bank, dbconn) {
    senators.min = minSenators;
    senators.max = maxSenators;
    senators.init(bank, dbconn);
  }, // end init()
  simClients: function() {
    senators.start();
  }, // end simClients
  destroy: function() {
    if(senators.timer) {
      clearInterval(senators.timer);
      senators.timer = null;
    }
  } // end destroy
};

/*
const dbconn = require('./db');

const maxSenators = 75,
      minSenators = 30;

const numSenators = Math.floor(
  Math.random() * (maxSenators - minSenators) + minSenators
);

module.exports.vote = async function(app) {
  if(app.locals.vote.slide) {
    // initialize new votelog if this is not a repeat
    if(!app.locals.vote.slide.votelog) {
      app.locals.vote.slide.votelog = new Array();
    }
    // initialize vote count for nominees
    app.locals.vote.slide.totalVotes = 0;
    for(let i = 0; i < app.locals.vote.slide.nominees.length; i++) {
      app.locals.vote.slide.nominees[i].votes = 0;
    }

    // simulate voting senate session
    clientsVote = {
      num: 0,
      timer: null,
      start: function() {
        this.timer = setInterval(function() {
          console.log('timer started votes are ' + clientsVote.num);
          if(clientsVote.num < app.locals.authClients.length
                && app.locals.state.currentState == 'voting') {
            console.log('casting some more votes');
            clientsVote.castVotes();
          } else {
            console.log('timer ended votes are ' + clientsVote.num);
            clearInterval(clientsVote.timer);
          }
        }, 1300);
      },
      castVotes: function() {
        // 1 - 5 senators vote each interval
        let numtoadd = this.num + Math.floor(Math.random() * 4) + 1;
        if(numtoadd > app.locals.authClients.length) {
          numtoadd = app.locals.authClients.length;
        }
        // add some more votes
        for(let i = this.num; i < numtoadd; i++) {
          let nominee = Math.floor(
            Math.random() * app.locals.vote.slide.nominees.length
          );
          app.locals.vote.register({
            id: app.locals.authClients[i].user,
            vote: app.locals.vote.slide.nominees[nominee].email,
          });
          this.num++; 
        }
      }
    };

    clientsVote.start();
  }
}; // end vote

module.exports.stopSession = async function(app) {
  app.locals.authClients = new Array();

}; // end stopSession

module.exports.startSession = async function(app) {
  try {
    const db = dbconn.db();

    console.log("senators from sim: " + numSenators);

    // only populate if not full
    if(app.locals.authClients.length <= numSenators) {
      // get total number of faculty
      let qpipe = [
        {$count: "count"}
      ];
      
      const totalFaculty = await db.collection('faculty').aggregate(qpipe).toArray();
      console.log(totalFaculty);

      // simulate the connection of senators
      let clientsConn = {
        num: 0,
        timer: null,
        start: function() {
          this.timer = setInterval(function() {
            console.log('timer started num is ' + clientsConn.num);
            if(clientsConn.num <= numSenators 
                  && app.locals.state.currentState == 'session') {
              console.log('num is less than senators');
              clientsConn.addClients().then(function(data) {
                app.locals.authClients = app.locals.authClients.concat(data);
                console.log('add clients now at: ' + app.locals.authClients.length);
              });
            } else {
              console.log('timer ended num is ' + clientsConn.num);
              clearInterval(clientsConn.timer);
            }
          }, 600)
        },
        addClients: async function() {
          try{
            let ret = new Array();
            //add 1 - 6 senators each interval
            let numtoadd = Math.floor(Math.random() * 5) + 1;
            for(let i = 0; i < numtoadd; i++) {
              let index = Math.floor(
                Math.random() * totalFaculty[0].count
              );
              const res = await db.collection('faculty').findOne({}, {skip: index});
              ret.push({
                user: res.email,
                session: null,
                socket: null
              });
            }
            this.num += numtoadd;
            return ret;
          } catch(err) {
            console.log(err);
          }
        }
      };

      //app.locals.authClients.push(clientsConn.addClients());
      //clientsConn.addClients().then(function(data) {
      //  console.log(data);
      //});
      //console.log(clientsConn.addClients());
      clientsConn.start();
      console.log('length of clients: ' + app.locals.authClients.length);
    } // end if enough clients already
  } catch(err) {
    console.log(err);
  }
}; // end startSession
*/
