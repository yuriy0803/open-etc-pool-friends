import jdenticon from 'jdenticon';
import Ember from 'ember';
import { helper } from '@ember/component/helper';

export function identicon([value, size]) {

  var icon = jdenticon.toSvg(value, size, "0");     

  return Ember.String.htmlSafe(icon);
}

export default helper(identicon);