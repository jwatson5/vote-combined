/*
** view/vote/vote-info.js
**  vote info (session is in voting) pane in the center top
**  manages ui updates during the voting state
**
*/

let voteInfo = {
  onVoteLoad: function () {
    this.listeners();
  },
  init: function () {
    if(global.loglevel > 0) console.log('vote/vote-info.js: init');
  },
  state: {
    change: function (state) {
      if(global.loglevel > 0) console.log('vote/vote-info.js: state change: ' + state);
      // simple state change
      if (state == "voting") {
        this.voting();
      } else {
        this.other();
      }
    },
    voting: function () {
      global.util.button.disable('#btn-logout-init');
      $('#vote-info > h2').html(vote.info.title);
      votePane.panelPos('center');
      setTimeout(() => {
        $('#btn-stop-vote').show();
      }, 744);
      $('#vote-info').show();
    },
    other: function () {
      global.util.button.enable('#btn-logout-init');
      $('#btn-stop-vote').hide();
      $('#vote-info').hide();
    }
  },
  updateUI: function () {
    $('#vote-info .info-votenum').html(vote.voteCount);
    // let percent = 0;
    // if (vote.clients > 0) {
    //   percent = Math.round((vote.voteCount / vote.clients) * 100);
    // }
    // if (percent < 100) {
    //   $('#vote-info-box, #vote-info-box > p, #vote-info-box > div').removeClass('bg-green');
    //   $('#vote-info-box, #vote-info-box > p, #vote-info-box > div').addClass('bg-blue');
    // } else {
    //   $('#vote-info-box, #vote-info-box > p, #vote-info-box > div').addClass('bg-green');
    //   $('#vote-info-box, #vote-info-box > p, #vote-info-box > div').removeClass('bg-blue');
    // }
    // if(global.loglevel > 0) console.log({clients: vote.clients})
    // $('#vote-info .info-votenum').html(vote.voteCount + ' / ' + vote.clients);
    // $('#vote-info .info-voteper').html(percent + ' %');
  },
  listeners: function () {
    $('#btn-stop-vote').on('click', function (e) {
      const btnId = $(this).attr('id');
      if(global.loglevel > 0) console.log(btnId + ': btn click event');
      vote.voteStat.stop();
    });
  }
};
