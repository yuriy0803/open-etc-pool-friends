import Ember from 'ember';

export function formatTx(value) {
  return value[0].substring(0, 26) + "..." + value[0].substring(26);
}

export default Ember.Helper.helper(formatTx);