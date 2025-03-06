/*
** view/vote/vote-build.js
**  vote build pane in the center top
**  manages build of votes
**
*/

const voteBuild = {
  onVoteLoad: function () {
    this.listeners();
  },
  init: function () {
    if(global.loglevel > 0) console.log('vote/vote-build.js: init');
  },
  state: {
    change: function (state) {
      if(global.loglevel > 0) console.log('vote/vote-build.js: state change: ' + state);
      // various states handled
      if (state == 'build') {
        this.build();
      } else {
        this.other();
      }
    },
    build: function () {
      votePane.panelPos('top');
      $('#mod-title h2').html(vote.info.title);
      voteBuild.candidateList.populate('build');
      $('#btn-go-mgr').show();
      $('#btn-start-vote').show();
      $('#top-bar-right p').show();
      $('#vote-list').show();
    },
    other: function () {
      $('#btn-go-mgr').hide();
      $('#btn-start-vote').hide();
      $('#vote-list').hide();
      $('#top-bar-right p').hide();
    }
  },
  updateUI: function () {
    // runs on the timer event
  },
  setStartButton: function() {
    if (vote.info.candidates.length > 0) {
      global.util.button.enable('#btn-start-vote');
    } else {
      global.util.button.disable('#btn-start-vote');
    }
  },
  listeners: function () {
    $('#btn-start-vote').on('click', function (e) {
      const btnId = $(this).attr('id');
      if(global.loglevel > 0) console.log(btnId + ': btn click event');
      vote.voteStat.start();
    });
    $('#btn-edit-title').on('click', function (e) {
      $('#btn-edit-title').hide();
      $('#vote-title > h2').hide();

      const txt = $('#vote-title > h2').html().replace(/<br>/g, '\n');
      $('#vote-title > textarea').val(txt);

      $('#btn-save-title').show();
      $('#vote-title > textarea').show();
      $('#vote-title > textarea').focus();
    });
    $('#vote-title > h2').on('dblclick', function (e) {
      $('#btn-edit-title').trigger('click');
    });
    $('#btn-save-title').on('click', function (e) {
      $('#btn-save-title').hide();
      $('#vote-title > textarea').hide();

      const txt = $('#vote-title > textarea').val().replace(/\n/g, '<br>');
      $('#vote-title > h2').html(txt);

      vote.info.title = txt;
      const v = {
        id: vote.info._id,
        title: vote.info.title
      }
      vote.persist.save(v);

      if(global.loglevel > 1) console.log(vote.info);
      $('#btn-edit-title').show();
      $('#vote-title > h2').show();
    });
  },
  candidateList: {
    populate: function (s) {
      voteBuild.setStartButton();
      $('#mod-candidates').html('');
      for (let i = 0; i < vote.info.candidates.length; i++) {
        let h = '<div class="item flex flex-vcenter flex-hspread font-default" data-email="'
          + vote.info.candidates[i].email + '">';
        if (s == "build") {
          h += this.buildRow(vote.info.candidates[i]);
        } else {
          h += this.resultRow(vote.info.candidates[i], s);
        }
        h += '</div>';
        $('#mod-candidates').append(h);
      }
      if (vote.info.type == "position") {
        if (s == "build") {
          calls.facultyList();

        } else if (s == "eval") {
          voteBuild.candidateList.positionListeners.addrem(s);
        }
      }
    },
    filterFacultyList: function (c) {
      for (let i = 0; i < vote.facultyList.length; i++) {
        for (let j = 0; j < c.length; j++) {
          if (vote.facultyList[i].data == c[j].email) {
            vote.facultyList.splice(i, 1);
          }
        }
      }
    },
    buildRow: function (c) {
      let h = '<div class="flex flex-vcenter font-default">'
        + this.photo(c)
        + this.name(c)
        + '</div>';
      if (vote.info.type == "position") {
        h += this.remButton();
      }
      return h;
    },
    resultRow: function (c, s) {
      if(global.loglevel > 1) console.log(s);
      let h = '<div class="flex flex-vcenter font-default">'
        + this.results(c, s)
        + this.name(c)
        + '</div>';
      if (vote.info.type == "position" && s == "eval") {
        h += this.remButton();
      }
      return h;
    },
    appendAdd: function () {
      let h = '<div class="item flex flex-hcenter flex-vcenter font-default">';
      h += this.addButton();
      h += '</div>';
      $('#mod-candidates').prepend(h);
    },
    insertCandidate: function (c) {
      vote.info.candidates.push(c),
        this.filterFacultyList([c]);
      $('#inp-candidate').autocomplete({
        visibleLimit: 5,
        source: [{ data: vote.facultyList }],
        getTitle: function (item) {
          return item.value;
        }
      });
      let h = this.buildRow(c);
      $('#inp-candidate').parents('.item').attr('data-email', c.email);
      $('#inp-candidate').parents('.item').removeClass('flex-hcenter');
      $('#inp-candidate').parents('.item').addClass('flex-hspread');
      $('#inp-candidate').parents('.item').html(h);
      this.positionListeners.addrem();
      voteBuild.setStartButton();
      $('#btn-add-candidate').show();
      $('#btn-add-candidate').focus();
    },
    // rowTag: function () {
    //   return '<div class="item flex flex-vcenter font-default">';
    // },
    // endRowTag: function () {
    //   return '</div>';
    // },
    addButton: function () {
      return '<a id="btn-add-candidate" class="btn-link icon add"></a>';
    },
    candidateInp: function () {
      return '<input id="inp-candidate" class="padding-sm bg-transparent font-mdlg font-dkgray" type="text" name="inp_candidate" placeholder="name" />';
    },
    remButton: function () {
      return '<a class="btn-link icon rem"></a>';
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
    results: function (c, s) {
      const clientVotes = c.votes;
      const totalVotes = vote.voteCount;
      let percent = 0;
      if (totalVotes > 0) {
        percent = Math.round((clientVotes / totalVotes) * 100);
      }
      let color = "bg-green";
      if (s == "eval") {
        color = "bg-blue";
      }
      return '<div class="width-md-box padding-txt-buf flex flex-column flex-vcenter font-no-select font-white font-md radius bg-blue margin-right-md '
        + color + '">'
        + ' <p class="border-bot-white font-bold font-center full-width margin-left-sm margin-right-sm">Votes</p>'
        + ' <div class="flex flex-hcenter flex-vcenter">'
        //+ '  <p class="margin-left-sm margin-right-md">'
        + '  <p>'
        + clientVotes
        + '  </p>'
        //+ '  <p>' + percent + '%</p>'
        + ' </div>'
        + '</div>';
    },
    name: function (c) {
      return '<p class="font-lg font-no-select"> '
        // + 'data-email="' + c.email + '">'
        + c.name
        + '</p>';
    },
    positionListeners: {
      addrem: function (s) {
        $('#btn-add-candidate, .rem').off('click');
        $('#btn-add-candidate').on('click', function (e) {
          const btnId = $(this).attr('id');
          $(this).hide();
          if(global.loglevel > 0) console.log('click event from ' + btnId);
          let h = '<div class="item flex flex-hcenter flex-vcenter font-default">';
          h += voteBuild.candidateList.candidateInp();
          h += '</div>';
          $(this).parent().after(h);
          // $('#inp-candidate').parent().addClass('padding-right-md');
          voteBuild.candidateList.positionListeners.searchInput();
          $('#inp-candidate').focus();
        });
        $('.rem').on('click', function (e) {
          const id = $(this).parent().attr('data-email');
          if(global.loglevel > 0) console.log('remove button for ' + id);
          $(this).parent().remove(); // removes from page
          for (let i = 0; i < vote.info.candidates.length; i++) {
            if (vote.info.candidates[i].email == id) {
              // remove from this list
              const c = vote.info.candidates[i];
              if (s == "build") {
                // add back to the lookup and refresh
                vote.facultyList.push({
                  value: c.first_name + ' ' + c.middle_name + ' ' + c.last_name,
                  data: c.email
                });
                $('#inp-candidate').autocomplete({
                  visibleLimit: 5,
                  source: [{ data: vote.facultyList }],
                  getTitle: function (item) {
                    return item.value;
                  }
                });
              }
              // remove from the candidates
              vote.info.candidates.splice(i, 1);
            }
          }
          voteBuild.setStartButton();
          // remove from database
          vote.persist.delCandidate({
            vid: vote.info._id,
            email: id
          });
        });
      },
      searchInput: function () {
        $('#inp-candidate').autocomplete({
          visibleLimit: 5,
          source: [{ data: vote.facultyList }],
          getTitle: function (item) {
            return item.value;
          }
        }).on('selected.xdsoft', function (e, suggestion) {
          if(global.loglevel > 0) console.log('view/vote/vote-build.js: selected.xdsoft event ' + JSON.stringify(suggestion));
          vote.persist.newCandidate({
            vid: vote.info._id,
            onList: true,
            email: suggestion.data
          });
        });
        $('#inp-candidate').on('keyup', function (e) {
          let cname = $(this).val();
          if (cname.length > 2 && e.keyCode === 13) {
            // enter key with more than two characters
            //    add this as an unknown value
            if(global.loglevel > 1) console.log('enter key ' + cname);
            vote.persist.newCandidate({
              vid: vote.info._id,
              onList: false,
              email: cname
            });
          }
        });
        // $('#inp-candidate').on('focus', function (e) {
        //   // this event ensures valid selection from autocomplete
        //   if(global.loglevel > 0) console.log('view/vote/vote-build.js: inp-senator focus event');
        //   $(this).val('');
        //   // delete ident.tmpCred.name;
        //   // delete ident.tmpCred.email;
        //   // $('#inp-key').trigger('keyup');
        // });
      }
    }
  }
};
