import Ember from 'ember';

export function formatHashrate(params/*, hash*/) {
  var hashrate = params[0];
  var i = 0;
  var units = ['H/s', 'KH/s', 'MH/s', 'GH/s', 'TH/s', 'PH/s'];
  while (hashrate > 1000) {
    hashrate = hashrate / 1000;
    i++;
  }
  return hashrate.toFixed(2) + ' ' + units[i];
}

export default Ember.Helper.helper(formatHashrate);
