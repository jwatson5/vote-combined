/*
** view/forms/vote.js
**  centerPanel vote object
**  manages all ui events for voting activity
**
*/

let formVote = {
  state: {
    change: function (state) {
      // states: active waiting complete
      if(global.loglevel > 0) console.log('/forms/vote.js: state change: ' + state);
      this[state]();
    },
    active: function () {
      global.util.button.disable('#btn-logout-init');
      formVote.update(); // update status message
      $('#title h2').html(vote.info.title);
      $('#title').show();
      formVote.candidateList.populate();
      $('#candidate-list').show();
      if (vote.currentVote) {
        const sel = 'div[data-email=\'' + vote.currentVote.candidate + '\']';
        const e = $(sel)[0];
        formVote.selectCandidate(e);
      }
    },
    waiting: function () {
      global.util.button.enable('#btn-logout-init');
      formVote.update(); // update status message
      if (vote.hasVoted) {
        $('#title h2').html('Vote finished'
          + '<span class="font-mdlg"><br>'
          + 'Waiting for another vote to start...'
          + '</span>'
        );
      } else {
        $('#title h2').html('Waiting for voting to start...');
      }
      $('#candidate-list').hide();
      $('#title').show();
    }
  },
  voteComplete: function () {
  },
  update: function () {
    // check to see if there are candidates and change
    //    center panel view accordingly
    let statText = 'Waiting...';
    let statColor = 'blue';
    if (vote.info) {
      statText = 'Select option to vote';
      statColor = 'blue';
      if (vote.currentVote) {
        statText = 'Vote saved - select to change vote';
        statColor = 'green';
      }
    }
    statusBar.message.color(statColor);
    statusBar.message.text(statText);
  },
  candidateList: {
    populate: function () {
      $('#candidate-list').html('');
      for (let i = 0; i < vote.info.candidates.length; i++) {
        let h = '<div class="item flex flex-vcenter font-default" data-email="'
          + vote.info.candidates[i].email + '">';
        h += this.photo(vote.info.candidates[i]);
        h += this.name(vote.info.candidates[i]);
        h += '</div>';
        $('#candidate-list').append(h);
      }
      formVote.listeners();
    },
    photo: function (c) {
      let h = '';
      if (c.photo) {
        h += '<img src="data:image/png;base64,'
          + c.photo
          + '" alt="' + c.name + '">';
      } else {
        h += '<div class="circle-text flex flex-hcenter flex-vcenter">'
        h += '<p class="font-lg">'
          + c.initial + '</p>';
        h += '</div>';
      }
      return h
    },
    name: function (c) {
      return '<p class="font-lg font-no-select"> '
        + c.name + '</p>';
    }
  },
  selectCandidate: function (element) {
    if(global.loglevel > 1) console.log('select candidate: ' + JSON.stringify(element));
    if(global.loglevel > 1) console.log('vote.currentVote: ' + JSON.stringify(vote.currentVote));
    vote.hasVoted = true;
    let unvote = false;
    if ($(element).hasClass('bg-green')) {
      // click on the same person, so unvote
      unvote = true;
      // vote.times = 0;
    }
    $('.item').removeClass('bg-green font-white');
    if (!unvote) {
      $(element).addClass('bg-green font-white');
    }
    this.update();
  },
  listeners: function () {
    $('.item').on('click', function (e) {
      if(global.loglevel > 1) console.log('center/vote.js: ' + $(this).children('p').html() + ' event');
      const c = $(this).attr('data-email');
      const voteInfo = {
        voter: global.ident.email,
        candidate: c
      };
      vote.castVote(voteInfo, this);
    });
    $('.item').on('dblclick', function (e) {
      $(this).trigger('click');
    });
  }
};
