/*
** controller/vote.js
**  vote controller object
**  manages all voting activity and states
**
*/

let vote = {
  info: null,
  currentVote: null,
  hasVoted: false,
  update: function () {
    if(global.loglevel > 0) console.log('controller/vote.js: update');
    // this is going to be run every global app state chagne
    $('#candidate-list').html('');
    if (this.info) {
      if(global.loglevel > 0) console.log('controller/vote.js: active vote in progress');
      formVote.state.change('active');
    } else {
      if(global.loglevel > 0) console.log('controller/vote.js: waiting for a vote to start');
      formVote.state.change('waiting');
    }
  },
  castVote: function (v, e) {
    // results back from the server
    const voteResult = (m) => {
      if(m.message == "unvote") {
        vote.currentVote = null;
      } else {
        vote.currentVote = v;
      }
      vote.hasVoted = true;
      formVote.selectCandidate(e);
    };
    // send the senators request with callback
    calls.castVote(v, voteResult);
  }
}