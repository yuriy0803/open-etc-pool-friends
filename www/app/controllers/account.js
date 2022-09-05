import Ember from 'ember';

export default Ember.Controller.extend({
    applicationController: Ember.inject.controller('application'),
    config: Ember.computed.reads('applicationController.config'),
    stats: Ember.computed.reads('applicationController.model.stats'),
    hashrate: Ember.computed.reads('applicationController.hashrate'),

    PersonalLuck: Ember.computed("stats", "model", {
        get() {
            var percent = this.get("model.stats.roundShares") / this.get("applicationController.difficulty");
            if (!percent) {
                return 0;
            }
            return percent;
        },
    }),

  roundPercent: Ember.computed('stats', 'model', {
    get() {
      var percent = this.get('model.roundShares') / this.get('stats.nShares');
      if (!percent) {
        return 0;
      }
      
      if(percent>100){
        return 100;
    }
      return percent;
    }
  }),
  
    earnPerDay: Ember.computed('model', {
        get() {
            return 24 * 60 * 60 / this.get('applicationController.blockTime') * this.get('config').BlockReward *
                this.getWithDefault('model.hashrate') / this.get('hashrate');
        }
    })
  
});