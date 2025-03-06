/*
** init.js
**  library loader for development for web voting app
**
*/
//let socket = null;

$(function () {
  //console.log('init.js: jquery ready state');
  libraries();
}); // end jquery ready

function init() {
  global.onPageLoad();
}

function libraries() {
  $.when(
    $.getScript('js/mod/controller/calls.js'),
    $.getScript('js/mod/controller/global.js'),
    $.getScript('js/mod/controller/ident.js'),
    $.getScript('js/mod/controller/vote.js'),
    $.getScript('js/mod/view/statusBar.js'),
    $.getScript('js/mod/view/vote-pane.js'),
    $.getScript('js/mod/view/form-ident.js'),
    $.getScript('js/mod/view/vote/vote-mgr.js'),
    $.getScript('js/mod/view/vote/vote-build.js'),
    $.getScript('js/mod/view/vote/vote-info.js'),
    $.getScript('js/mod/view/vote/vote-results.js'),
    $.Deferred(function (deferred) {
      $(deferred.resolve);
    })
  ).done(function () {
    if(global.loglevel > 0) console.log('init.js: libraries loaded');
    init();
  });
}
