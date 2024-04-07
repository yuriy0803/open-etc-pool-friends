import EmberObject from '@ember/object';
import { computed } from '@ember/object';

var Block = EmberObject.extend({

  variance: computed('difficulty', 'shares', function() {
    let percent = this.get('shares') / this.get('difficulty');
    if (!percent) {
      return 0;
    }
    return percent;
  }),

  isLucky: computed('variance', function() {
    return this.get('variance') <= 1.0;
  }),


  isSolo: computed('miningType', function() {
    return this.get('miningType') == "solo";
  }),

  isOk: computed('orphan', 'uncle', function() {
    return !this.get('orphan');
  }),

  lastBlockFound: Ember.computed('model', {
    get() {
      return parseInt(this.get('model.lastBlockFound')) || 0;
    }
  }),

  formatReward: computed('reward', function() {
    if (!this.get('orphan')) {
      let value = parseInt(this.get('reward')) * 0.000000000000000001;
      return value.toFixed(6);
    } else {
      return 0;
    }
  })
});

export default Block;