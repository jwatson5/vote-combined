/*
** view/vote/vote-results.js
**  vote results (session is in voted) pane in the center
**  manages the list and chart view of vote results
**
*/

let voteResults = {
  onVoteLoad: function () {
    this.listeners();
  },
  init: function () {
    if(global.loglevel > 0) console.log('vote/vote-results.js: init');
  },
  state: {
    change: function (state) {
      if(global.loglevel > 0) console.log('vote/vote-results.js: state change: ' + state);
      if (state == "voted") {
        this.voted();
      } else {
        this.other();
      }
    },
    voted: function () {
      votePane.panelPos('top');
      $('#mod-title h2').html(vote.info.title);
      // $('#mod-candidates').html('');
      vote.sortCandidates();
      voteBuild.candidateList.populate(vote.info.result);

      // check vote.info.result - if eval or accepted
      if (vote.info.result == "eval") {
        $('#top-bar-right > p').show();
        $('#btn-go-mgr').hide();
        setTimeout(function () {
          $('#stat-vote-done').hide();
          $('#btn-go-mgr').show();
          $('#btn-accept-vote').show();
          $('#btn-revote').show();
        }, 600);
      } else {
        $('#top-bar-right > p').hide();
        $('#btn-revote').hide();
        $('#btn-accept-vote').hide();
        $('#btn-go-mgr').show();
        $('#stat-vote-done').show();
      }

      $('#vote-list').show();
    },
    other: function () {
      // $('#btn-go-mgr').hide();
      $('#stat-vote-done').hide();
      $('#btn-revote').hide();
      $('#btn-accept-vote').hide();
    }
  },
  updateUI: function () {

  },
  listeners: function () {
    $('#btn-revote').on('click', function (e) {
      const btnId = $(this).attr('id');
      if(global.loglevel > 0) console.log(btnId + ': btn click event');
      vote.voteStat.revote();
    });
    $('#btn-accept-vote').on('click', function (e) {
      const btnId = $(this).attr('id');
      if(global.loglevel > 0) console.log(btnId + ': btn click event');
      vote.voteStat.accept();
    });
  },
  removeListeners: function () {
    $('#btn-revote').off('click');
  }
};
