const slideChart = {
  init: function() {
    if(!slideController.currentChart) {
      console.log(slideController.currentChart);
      //let ctx = $('#ctx-' + slideController.currentSlide.id).children()[0].getContext('2d');
      let ctx = $('section.present .ctx').children()[0].getContext('2d');
      slideController.currentChart = new Chart(ctx, this.settings());
      //console.log(slideController.currentSlide.chart);
    }
    // update chart with data
    this.update();
  },

  update: function() {
    slideController.currentSlide.nominees.sort(this.compare);

    // setup max ticks by 10s 1 10 above the highest vote
    let maxTicks = Math.floor(slideController.currentSlide.nominees[0].votes / 10 + 1) * 10;

    let d = {labels: new Array(), data: new Array()};
    for(let i = 0; i < slideController.currentSlide.nominees.length; i++) {
      let abbrName = slideController.currentSlide.nominees[i].fullName;
      if(slideController.currentSlide.lookup) {
        abbrName = (slideController.currentSlide.nominees[i].first_name).substring(0,1)
                   + '. ' + slideController.currentSlide.nominees[i].last_name;
      }
      d.labels.push(abbrName);
      d.data.push(slideController.currentSlide.nominees[i].votes);
    }

    if(slideController.currentChart) {
      slideController.currentChart.data.labels = d.labels;
      slideController.currentChart.data.datasets[0].data = d.data;
      slideController.currentChart.scales['x-axis-0'].options.ticks.max = maxTicks;
      slideController.currentChart.update();
    }
  },

  show: function() {
    //$('#ctx-' + slideController.currentSlide.id).show();
    $('section.present .ctx').show();
  },

  hide: function() {
    //$('#ctx-' + slideController.currentSlide.id).hide();
    $('section.present .ctx').hide();
  },

  listeners: function() {

  },

  compare: function(a, b) {
    if(a.votes < b.votes)
      return 1;
    if(a.votes > b.votes)
      return -1;
    return 0;
  },

  settings: function() {
      let o = {
        legend: {
          display: false
        },
        scales: {
          yAxes: [ {ticks: {fontSize: 24, fontColor: 'rgb(50,50,50)'}} ],
          xAxes: [ {ticks: {fontSize: 20, fontColor: 'rgb(50,50,50)', beginAtZero: true, max: 30}} ]
        }
      };
      let d = {
        labels: new Array(), 
        datasets: [{
          label: "votes", 
          data: new Array(), 
          backgroundColor: 'rgba(42,118,221,0.5)'
        }]
      };
      return {
        type: 'horizontalBar',
        data: d, 
        options: o
      };
  } // end voteChart.settings
};
