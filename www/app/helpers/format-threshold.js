import { helper as buildHelper } from '@ember/component/helper';

export function formatBalance(value) {
    if (value < 0) {
        value = 0;
    }
    value = value * 0.000000001;
    return value.toFixed(2); // Change toFixed(1) to toFixed(2)
}

export default buildHelper(formatBalance);
