/*
** ui/vote/vote-mgr.js
**  vote manager pane in the center top
**  manages creation and loading of votes
**
*/

let voteMgr = {
  type: null,
  onVoteLoad: function () {
    this.listeners();
    this.init();
  },
  init: function () {
    if(global.loglevel > 0) console.log('vote/vote-mgr.js: init');
    global.util.button.disable('#btn-create-vote');
    // global.util.button.disable('#btn-new-position');
  },
  state: {
    change: function (state) {
      if(global.loglevel > 0) console.log('view/vote/vote-mgr.js: state change: ' + state);
      // simple state change
      if (state == "manager") {
        this.manager();
      } else {
        this.other();
      }
    },
    manager: function () {
      vote.getHistory(); // class voteMgr.voteHist.populate()

      votePane.panelPos('top');
      $('#btn-config').show();
      $('#vote-manager').show();

      if (ident.id.config) {
        // the page was likely revisted under the config modal
        //   reinstate
        $('#btn-config').trigger('click');
      }
    },
    other: function () {
      $('#btn-config').hide();
      $('#vote-manager').hide();
      $('#vote-new').hide();
    }
  },
  updateUI: function () {

  },
  listeners: function () {
    $('#btn-new-motion, #btn-new-position').on('click', function (e) {
      const btnId = $(this).attr('id');
      if(global.loglevel > 0) console.log(btnId + ': btn click event');
      if (btnId == "btn-new-motion") {
        voteMgr.type = "motion";
      } else {
        voteMgr.type = "position";
      }
      const t = voteMgr.type.substring(0, 1).toUpperCase() + voteMgr.type.substring(1);
      $('#vote-manager').hide();
      $('#vote-new > h2').html(t + ' Vote Information');
      $('#vote-new').show();
      $('#inp-vote-id').focus();
    });
    $('#inp-vote-id, #inp-vote-title').on('keyup', function (e) {
      let p = $('#inp-vote-id').val();
      let k = $('#inp-vote-title').val();
      if (p.length > 2 && k.length > 2) {
        global.util.button.enable('#btn-create-vote');
      } else {
        global.util.button.disable('#btn-create-vote');
      }
    });
    $('#btn-create-vote').on('click', function (e) {
      if (global.util.button.isEnabled('#btn-create-vote')) {
        if(global.loglevel > 0) console.log($(this).attr('id') + ': click event');
        global.util.button.disable('#btn-create-vote');
        let c = new Array();
        if (voteMgr.type == "motion") {
          c.push({ name: "Yea", email: 'yea', initial: 'Y', photo: null, votes: 0 });
          c.push({ name: "Nay", email: 'nay', initial: 'N', photo: null, votes: 0 });
          c.push({ name: "Abstain", email: 'abstain', initial: 'A', photo: null, votes: 0 });
        }
        const v = {
          type: voteMgr.type,
          name: $('#inp-vote-id').val(),
          title: $('#inp-vote-title').val().replace(/\n/g, '<br>'),
          candidates: c
        }
        vote.persist.new(v);
        $('#inp-vote-id, #inp-vote-title').val('');
      }
    });
    $('#btn-create-cancel').on('click', function (e) {
      $('#inp-vote-id, #inp-vote-title').val('');
      $('#vote-new').hide();
      voteMgr.state.change("manager");
      // global.state.change();
    });
    $('#btn-go-mgr').on('click', function (e) {
      // top panel control area button to 'close vote'
      const btnId = $(this).attr('id');
      if (global.util.button.isEnabled('#' + btnId)) {
        if(global.loglevel > 0) console.log($(this).attr('id') + ': click event');
        vote.voteStat.reset();
      }
    });
    $('#btn-config').on('click', function (e) {
      const btnId = $(this).attr('id');
      if (global.util.button.isEnabled('#' + btnId)) {
        voteMgr.config.init();
      }
    });
  },
  voteHist: {
    populate: function (votes) {
      // no result field - new blue
      //  result = 'eval' - not accepted blue
      // else - complete green
      const options = {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
      };
      let h = '';
      if (votes.length > 0) {
        for (let i = 0; i < votes.length; i++) {
          let voteStat = {
            msg: "new",
            color: "bg-blue"
          };
          const vs = votes[i].result;
          if (vs) {
            if (vs == "eval") {
              voteStat.msg = "not accepted";
            } else {
              voteStat = {
                msg: "complete",
                color: "bg-green"
              };
            }
          }
          const d = new Date(votes[i].date);
          const dStr = d.toLocaleDateString('en-US', options);


          h += '<div class="row flex flex-vcenter flex-hspread full-width padding-sm radius" '
            + 'data-id="' + votes[i]._id + '"">'
            + '<div class="flex flex-vcenter">'
            + ' <p class="font-white font-sm font-bold font-no-select margin-right-sm padding-xsm radius bg-mdgray">'
            + votes[i].type.substring(0, 1).toUpperCase()
            + ' </p>'
            + ' <p class="font-dkgray font-mdsm">'
            + '  <span class="font-bold">'
            + dStr
            + '  </span> - '
            + votes[i].name
            + ' </p>'
            + '</div>'
            + ' <div class="flex flex-vcenter">'
            + '  <p class="font-white font-center font-sm font-bold font-no-select padding-xsm margin-left-md margin-right-sm radius '
            + voteStat.color
            + '">'
            + voteStat.msg
            + '</p>'
            + '  <a class="btn-link load-vote cursor-pointer font-blue font-sm font-bold font-no-decoration font-no-select padding-sm">Load</a>'
            + '  <a class="btn-link icon trash-vote margin-left-sm"></a>'
            + ' </div>'
            + '</div>';
        }
      } else {
        h += '<div class="margin-top-md margin-bot-md"><p class="font-md font-dkgray font-italic">No vote history</p></div>'
      }
      $('#vote-hist > div').remove();
      $('#vote-hist').append(h);
      this.listeners();
    },
    listeners: function () {
      $('a.load-vote').on('click', function (e) {
        const id = $(this).parents('.row').attr('data-id');
        if(global.loglevel > 0) console.log('row load: btn click event ' + id);
        vote.persist.load(id);
      });
      $('a.trash-vote').on('click', function (e) {
        const id = $(this).parents('.row').attr('data-id');
        if(global.loglevel > 0) console.log('row load: btn click event ' + id);
        vote.persist.delete(id);
      });
    }
  },
  config: {
    init: function () {
      $('#btn-config-update-faculty').html('Update Faculty List');
      global.util.button.enable('#btn-config-update-faculty');
      $('#progress-update-faculty').hide();
      global.setConfig(true);

      // used to update client count - not needed
      //vote.infoPoll.stop();
      
      $('#modal-config').modal({
        escapeClose: false,
        clickClose: false,
        showClose: false
      });
      this.listeners();
    },
    pollStatus: {
      timer: null,
      start: function () {
        this.timer = setInterval(function () {
          calls.updateFaculty("check");
        }, 659);
      },
      stop: function () {
        clearInterval(this.timer);
      }
    },
    restart: function () {
      global.util.button.disable('#btn-config-update-faculty');
      global.util.button.disable('#btn-config-close');
      $('#progress-update-faculty').show();
      $('#btn-config-update-faculty').html('Updating list...');
      voteMgr.config.pollStatus.start();
    },
    close: function () {
      this.removeListeners();
      global.setConfig(false);

      // used to update client count - not needed
      //vote.infoPoll.start();
      
      $.modal.close();
    },
    listeners: function () {
      $('#btn-config-update-faculty').on('click', function (e) {
        const btnId = '#' + $(this).attr('id');
        if(global.loglevel > 1) console.log(btnId);
        if (global.util.button.isEnabled(btnId)) {
          global.util.button.disable(btnId);
          global.util.button.disable('#btn-config-close');
          $('#progress-update-faculty').show();
          $(btnId).html('Updating list...');
          calls.updateFaculty("start");
        }
      });
      $('#btn-config-close').on('click', function (e) {
        const btnId = $(this).attr('id');
        if(global.loglevel > 1) console.log(btnId);
        if (global.util.button.isEnabled('#' + btnId)) {
          voteMgr.config.close();
        }
      });
    },
    removeListeners: function () {
      $('#btn-config-close').off('click');
      $('#btn-config-update-faculty').off('click');
    }
  }
};
