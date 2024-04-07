import Ember from 'ember';

export default Ember.Controller.extend({
  applicationController: Ember.inject.controller('application'),
  stats: Ember.computed.reads('applicationController'),
  config: Ember.computed.reads('applicationController.config'),

	cachedLogin: Ember.computed('login', {
    get() {
      return this.get('login') || Ember.$.cookie('login');
    },
    set(key, value) {
      Ember.$.cookie('login', value);
      this.set('model.login', value);
      return value;
    }
  }),
  
  chartOptions: Ember.computed("model.hashrate", {
    get() {
        var now = new Date();
        var e = this,
            t = e.getWithDefault("stats.model.poolCharts"),
            a = {
                chart: {
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    type: "spline",
                    height: 300,
                    marginRight: 10,
                    events: {
                        load: function() {
                            var self = this;
                            var chartInterval = setInterval(function() {
                                if (!self.series) {
                                    clearInterval(chartInterval);
                                    return;
                                }
                                var series = self.series[0];
                                var now = new Date();

                                var shift = false;
                                // partially update chart
                                if (now - series.data[0].x > 18*60*60*1000) {
                                    // show 18 hours ~ 15(min) * 74(points) ~ poolChartsNum: 74, poolChars: "0 */15 ..."
                                    shift = true;
                                }
                                // check latest added temporary point and remove tempory added point for less than 5 minutes
                                if (series.data.length > 1 && series.data[series.data.length - 1].x - series.data[series.data.length - 2].x < 5*60*1000) {
                                    series.removePoint(series.data.length - 1, false, false);
                                }
                                var x = now, y = e.getWithDefault("model.hashrate");
                                var d = x.toLocaleString();
                                series.addPoint({x: x, y: y, d:d}, true, shift);
                            }, e.get('config.highcharts.main.interval') || 60000);
                        }
                    }
                },
                title: {
                    text: "Our pool's hashrate"
                },
                xAxis: {
                    labels: {
                        style: {
                            color: "#000"
                        }
                    },
                    ordinal: false,
                    type: "datetime",
                    dateTimeLabelFormats: {
                        millisecond: "%H:%M:%S",
                        //second: "%H:%M:%S",
                                    second: "%H:%M",
                                    minute: "%H:%M",
                                    hour: "%H:%M",
                                    day: "%d.%m.%y",
                                    week: "%m/%d",
                                    month: "%b '%y",
                                   year: "%Y"
                    },
                    gridLineWidth: 1,
                    gridLineColor: "#e6e6e6"
                },
                yAxis: {
                    title: {
                        text: " Pool Hash Rate",
                        style: {
                            color: "#000"
                        }
                    },
                    labels: {
                        style: {
                            color: "#000"
                        }
                    },
                    gridLineWidth: 1,
                    gridLineColor: "#e6e6e6"
                },
                plotLines: [{
                    value: 0,
                    width: 1,
                    color: "#000"
                }],
                legend: {
                    enabled: false
                },
                tooltip: {
                    formatter: function() {
                        function scale(v) {
                            var f = v;
                            var units = ['', 'K', 'M', 'G', 'T'];
                            for (var i = 0; i < 5 && f > 1000; i++)  {
                                f /= 1000;
                            }
                            return f.toFixed(2) + ' ' + units[i];
                        }
                        var h = scale(this.point.y);

                        return "<b>" + this.point.d + "</b><br />" +
                            "<b>Pool Hashrate&nbsp;" + h + "H/s</b>"
                    },
                    useHTML: true
                },
                exporting: {
                    enabled: false
                },
                plotOptions: {
                    line: {
                        pointInterval: 5
                    },
                    pointInterval:10
                },
                series: [{
                    color: "#1994b8",
                    name: "Hashrate",
                    shadow: true,
                    data: function() {
                        var a = [];
                        if (null != t) {
                            t.forEach(function(d) {
                                var x = new Date(1000 * d.x);
                                var l = x.toLocaleString();
                                var y = d.y;
                                a.push({x: x, y: y, d: l});
                            });
                        }
                        var l = now.toLocaleString();
                        var y = e.getWithDefault("model.hashrate");
                        var last = {x: now, y: y, d: l};
                        var interval = e.get('config.highcharts.main.interval') || 60000;
                        if (a.length > 0 && now - a[a.length - 1].x > interval) {
                            a.push(last);
                        }
                        return a;
                    }()
                }]
            };
            a.title.text = this.getWithDefault('config.highcharts.main.title', "");
            a.yAxis.title.text = this.getWithDefault('config.highcharts.main.ytitle', "Pool Hashrate");
            a.chart.height = this.getWithDefault('config.highcharts.main.height', 300);
            a.chart.type = this.getWithDefault('config.highcharts.main.type', 'spline');
            a.chart.backgroundColor = this.getWithDefault('config.highcharts.main.backgroundColor', "rgba(255, 255, 255, 0.1)");
            a.xAxis.labels.style.color = this.getWithDefault('config.highcharts.main.labelColor', "#000");
            a.yAxis.labels.style.color = this.getWithDefault('config.highcharts.main.labelColor', "#000");
            a.yAxis.title.style.color = this.getWithDefault('config.highcharts.main.labelColor', "#000");
            a.xAxis.gridLineColor = this.getWithDefault('config.highcharts.main.gridLineColor', "#e6e6e6");
            a.yAxis.gridLineColor = this.getWithDefault('config.highcharts.main.gridLineColor', "#e6e6e6");
            a.xAxis.gridLineWidth = this.getWithDefault('config.highcharts.main.gridLineWidthX', "0");
            a.yAxis.gridLineWidth = this.getWithDefault('config.highcharts.main.gridLineWidthY', "1");
            a.xAxis.lineColor = this.getWithDefault('config.highcharts.main.lineColor', "#ccd6eb");
            a.yAxis.lineColor = this.getWithDefault('config.highcharts.main.lineColor', "#ccd6eb");
            a.xAxis.tickColor = this.getWithDefault('config.highcharts.main.tickColor', "#ccd6eb");
            a.yAxis.tickColor = this.getWithDefault('config.highcharts.main.tickColor', "#ccd6eb");
        return a;
        }
    }),
  
  chartDiff: Ember.computed("model.hashrate", {
        get() {
            var now = new Date();
            var e = this,
                t = e.getWithDefault("stats.model.netCharts"),
                a = {
                    chart: {
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                        type: "spline",
                        height: 300,
                        marginRight: 10,
                        events: {
                            load: function() {
                                var self = this;
                                var chartInterval = setInterval(function() {
                                    if (!self.series) {
                                        clearInterval(chartInterval);
                                        return;
                                    }
                                    var series = self.series[0];
                                    var now = new Date();
    
                                    var shift = false;
                                    // partially update chart
                                    if (now - series.data[0].x > 18*60*60*1000) {
                                        // show 18 hours ~ 15(min) * 74(points) ~ poolChartsNum: 74, poolChars: "0 */15 ..."
                                        shift = true;
                                    }
                                    // check latest added temporary point and remove tempory added point for less than 5 minutes
                                    if (series.data.length > 1 && series.data[series.data.length - 1].x - series.data[series.data.length - 2].x < 5*60*1000) {
                                        series.removePoint(series.data.length - 1, false, false);
                                    }
                                    var x = now, y = e.getWithDefault("stats.model.netCharts");
                                    var d = x.toLocaleString();
                                    series.addPoint({x: x, y: y, d:d}, true, shift);
                                }, e.get('config.highcharts.main.interval') || 60000);
                            }
                        }
                    },
                    title: {
                        text: "Our pool's hashrate"
                    },
                    xAxis: {
                        labels: {
                            style: {
                                color: "#000"
                            }
                        },
                        ordinal: false,
                        type: "datetime",
                        dateTimeLabelFormats: {
                            millisecond: "%H:%M:%S",
                            //second: "%H:%M:%S",
                                        second: "%H:%M",
                                        minute: "%H:%M",
                                        hour: "%H:%M",
                                        day: "%d.%m.%y",
                                        week: "%m/%d",
                                        month: "%b '%y",
                                       year: "%Y"
                        },
                        gridLineWidth: 1,
                        gridLineColor: "#e6e6e6"
                    },
                    yAxis: {
                        title: {
                            text: " Pool Hash Rate",
                            style: {
                                color: "#000"
                            }
                        },
                        labels: {
                            style: {
                                color: "#000"
                            }
                        },
                        gridLineWidth: 1,
                        gridLineColor: "#e6e6e6"
                    },
                    plotLines: [{
                        value: 0,
                        width: 1,
                        color: "#000"
                    }],
                    legend: {
                        enabled: false
                    },
                    tooltip: {
                        formatter: function() {
                            function scale(v) {
                                var f = v;
                                var units = ['', 'K', 'M', 'G', 'T', 'P'];
                                for (var i = 0; i < 5 && f > 1000; i++)  {
                                    f /= 1000;
                                }
                                return f.toFixed(2) + ' ' + units[i];
                            }
                            var h = scale(this.point.y);
    
                            return "<b>" + this.point.d + "</b><br />" +
                                "<b>Network Difficulty&nbsp;" + h + "H/s</b>"
                        },
                        useHTML: true
                    },
                    exporting: {
                        enabled: false
                    },
                    plotOptions: {
                        line: {
                            pointInterval: 5
                        },
                        pointStart: Date.UTC(2022, 0, 1),
                        pointInterval: 24 * 3600 * 1000 // one day
                    },
                    series: [{
                        color: "#e99002",
                        name: "Hashrate",
                        shadow: true,
                        data: function() {
                            var a = [];
                            if (null != t) {
                                t.forEach(function(d) {
                                    var x = new Date(1000 * d.x);
                                    var l = x.toLocaleString();
                                    var y = d.y;
                                    a.push({x: x, y: y, d: l});
                                });
                            }
                            var l = now.toLocaleString();
                            var y = e.getWithDefault("stats.model.netCharts");
                            var last = {x: now, y: y, d: l};
                            var interval = e.get('config.highcharts.main.interval') || 60000;
                            if (a.length > 0 && now - a[a.length - 1].x > interval) {
                                a.push(last);
                            }
                            return a;
                        }()
                    }]
                };
                a.title.text = this.getWithDefault('config.highcharts.main.title', "");
                a.yAxis.title.text = this.getWithDefault('config.highcharts.main.ytitle', "Pool Hashrate");
                a.chart.height = this.getWithDefault('config.highcharts.main.height', 300);
                a.chart.type = this.getWithDefault('config.highcharts.main.type', 'spline');
                a.chart.backgroundColor = this.getWithDefault('config.highcharts.main.backgroundColor', "rgba(255, 255, 255, 0.1)");
                a.xAxis.labels.style.color = this.getWithDefault('config.highcharts.main.labelColor', "#000");
                a.yAxis.labels.style.color = this.getWithDefault('config.highcharts.main.labelColor', "#000");
                a.yAxis.title.style.color = this.getWithDefault('config.highcharts.main.labelColor', "#000");
                a.xAxis.gridLineColor = this.getWithDefault('config.highcharts.main.gridLineColor', "#e6e6e6");
                a.yAxis.gridLineColor = this.getWithDefault('config.highcharts.main.gridLineColor', "#e6e6e6");
                a.xAxis.gridLineWidth = this.getWithDefault('config.highcharts.main.gridLineWidthX', "0");
                a.yAxis.gridLineWidth = this.getWithDefault('config.highcharts.main.gridLineWidthY', "1");
                a.xAxis.lineColor = this.getWithDefault('config.highcharts.main.lineColor', "#ccd6eb");
                a.yAxis.lineColor = this.getWithDefault('config.highcharts.main.lineColor', "#ccd6eb");
                a.xAxis.tickColor = this.getWithDefault('config.highcharts.main.tickColor', "#ccd6eb");
                a.yAxis.tickColor = this.getWithDefault('config.highcharts.main.tickColor', "#ccd6eb");
               
            return a;
        }
    }),
    dag: Ember.computed("stats", "model", {
        get() {
            var percent = (this.get("epoch") * 8192) / 1024 / 1024 + 1;
            if (!percent) {
                return 0;
            }
            return percent;
        },
    }),
    epoch: Ember.computed("model.stats", {
        get() {
            return parseInt(this.get("applicationController.height") / 30000);
        },
    }),
});