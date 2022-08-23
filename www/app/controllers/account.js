import Ember from 'ember';

export default Ember.Controller.extend({
  applicationController: Ember.inject.controller('application'),
  stats: Ember.computed.reads('applicationController.model.stats'),

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
  })
});