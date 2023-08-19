<template>
  <a :href="formatUrl()" target="_blank">{{ formatHash(hash, clip) }}</a>
</template>
<script>
export default {
  props: {
    hash: {
      type: String,
      default() {
        return '0x0'
      },
    },
    linkType: {
      type: String,
      default() {
        return 'tx'
      },
    },
    clip: {
      type: Number,
      default() {
        return 0
      },
    },
    separator: {
      type: String,
      default() {
        return '...'
      },
    },
    config: {
      type: Object,
      default() {
        return {}
      },
    },
  },
  methods: {
    formatUrl() {
      const { url, type, network, symbol } = this.config.explorer;
      let append = '/';

      switch (this.linkType) {
        case 'block':
          append = (type === 'blockscout') ? append + 'blocks/' : append + 'block/';
          break;
        case 'account':
          append = (type === 'etherchain') ? append + 'account/' : append + 'address/';
          break;
        case 'token':
          append = (type === 'blockscout') ? append + 'tokens/' : append + 'token/';
          break;
        case 'tx':
          append = append + 'tx/';
          break;
        default:
          console.error('Invalid linkType argument. It should be one of: block, account, token, or tx');
          return '';
      }

      switch (type) {
        case 'expedition':
          if (network === 'classic') {
            network = 'mainnet';
          }
          append = append + this.hash + '?network=' + network;
          break;
        case 'blockscout':
          if (network === 'classic') {
            network = 'mainnet';
          }
          append = `/${symbol.toLowerCase()}/${network}${append}${this.hash}`;
          break;
        default:
          append = append + this.hash;
      }
      return url + append;
    },
    formatHash(hash, len) {
      if (hash === '0x0' || !hash) {
        return 'N/A';
      }
      if (len > 0) {
        const start = hash.substring(0, len + 2);
        const end = hash.substring(hash.length - len);
        return start + this.separator + end;
      }
      return hash;
    },
  },
};
</script>