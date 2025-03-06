/*
** controller/vote.js
**  manages all vote logic - initiates from controller state [vote]
**
*/

let vote = {
  clients: 0,
  voteCount: 0,
  facultyList: null,
  info: null,
  history: new Array(),
  components: new Array(),
  init: function () {
    if(global.loglevel > 0) console.log('controller/vote.js: init');
    this.components = new Array();

    this.components.push(voteMgr); // view/vote/vote-mgr.js
    this.components.push(voteBuild); // view/vote/vote-build.js
    this.components.push(voteInfo); // view/vote/vote-info.js
    this.components.push(voteResults); // view/vote/vote-results.js

    // run onVoteLoad for the differents ui components
    for (let i = 0; i < this.components.length; i++) {
      if (typeof this.components[i].onVoteLoad === "function") {
        this.components[i].onVoteLoad();
      }
    }

    if(global.loglevel > 0) console.log('vote.init: vote update state');
    this.state.change();
    this.updateVoteUI();

    // this was a poll to update the total connected clients
    //  I don't think it's needed any longer, 3/2/23 - using sse
    this.infoPoll.start();
    calls.sse.start();
    calls.voteData();
  },
  state: {
    change: function () {
      // setup vote states: manager build voting voted
      let state = "manager";
      if (vote.info) {
        // there was an active vote loaded on server
        if (vote.info.voting) {
          state = "voting";
        } else if (vote.info.result) {
          state = "voted";
        } else {
          state = "build";
        }
      }
      if(global.loglevel > 0) console.log('controller/vote.js: state change is - ' + state);
      // change all the registered components to the new state
      for (let i = 0; i < vote.components.length; i++) {
        if (typeof vote.components[i].state.change === "function") {
          vote.components[i].state.change(state);
        }
      }
    }
  },
  updateVoteUI: function () {
    for (let i = 0; i < vote.components.length; i++) {
      if (typeof vote.components[i].updateUI === "function") {
        vote.components[i].updateUI();
      }
    }
  },
  getHistory: function () {
    calls.voteHistory();
  },
  sortCandidates: function () {
    this.info.candidates.sort(
      function (a, b) {
        if (a.votes < b.votes)
          return 1;
        if (a.votes > b.votes)
          return -1;
        return 0;
      }
    );
  },
  voteStat: {
    start: function () {
      calls.voteStart(vote.info._id);
    },
    stop: function () {
      // vote.info.result = "eval";
      calls.voteStop(vote.info._id);
    },
    revote: function () {
      calls.voteRevote(vote.info._id);
    },
    accept: function () {
      calls.voteAccept(vote.info._id);
    },
    reset: function () {
      if(global.loglevel > 1) console.log(vote.info);
      calls.voteReset(vote.info._id);
    }
  },
  persist: {
    new: function (v) {
      calls.voteNew(v);
    },
    newCandidate: function (c) {
      $('#top-bar-right p').addClass('bg-green font-white');
      $('#top-bar-right p').html('Saving...');
      calls.voteNewCandidate(c);
    },
    delCandidate: function (d) {
      $('#top-bar-right p').addClass('bg-green font-white');
      $('#top-bar-right p').html('Saving...');
      calls.voteDelCandidate(d);
    },
    load: function (id) {
      calls.voteLoad(id);
    },
    delete: function (id) {
      calls.voteDelete(id);
    },
    save: function (v) {
      // v should contain the _id and only the fields to update
      $('#top-bar-right p').addClass('bg-green font-white');
      $('#top-bar-right p').html('Saving...');
      calls.voteUpdate(v);
    },
    update: function (v) {
      // add the result as the vote info
      vote.info = Object.assign({}, v);
      if(global.loglevel > 0) console.log('vote.persist: vote update state');
      if(global.loglevel > 1) console.log(v);
      vote.state.change();
    }
  },
  infoPoll: { // this will be deprecated sometime 
    timer: null,
    start: function () {
      this.timer = setInterval(function () {
        calls.voteData();
      }, 1056);
    },
    stop: function () {
      clearInterval(this.timer);
    }
  }
};
