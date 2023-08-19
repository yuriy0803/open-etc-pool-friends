<template>
  <v-row justify="center" align="center">
    <v-col cols="12" sm="12" md="12">
      <v-row no-gutters class="px-4">
        <v-alert type="info" class="w-100 mb-0">
          Change the address in the examples below to YOUR address before starting your miner.
        </v-alert>
      </v-row>
      <v-row no-gutters class="px-4">
        <v-col cols="12" sm="12" md="12">
          <v-card v-for="(miner, index) in miners" :key="index" tile class="my-2">
            <v-card-title class="headline ma-0">
              {{ miner.title }}
              <v-spacer />
              <a class="pa-0" :href="miner.releases" target="_blank">
                <v-btn color="primary" label>
                  {{ miner.minVer }}+
                  <v-icon class="ml-2" small>mdi-download</v-icon>
                </v-btn>
              </a>
            </v-card-title>
            <v-card-text class="pa-0">
              <article>
                <nuxt-content :document="miner" :class="{ 'code-lightmode': !darkMode }" />
              </article>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-col>
  </v-row>
</template>

<script>
import config from '~/params/config.json'

export default {
  async asyncData({ $content }) {
    const network = config.network
    const pathPrefix = `help/miners/${network}`
    const supportsClassic = ['lolminer', 'nanominer', 'trex', 'nbminer', 'gminer', 'teamred', 'srbminer']
    const supportsMordor = ['lolminer', 'gminer']
    const miners = []

    const supportedMiners = network === 'mordor' ? supportsMordor : supportsClassic

    for (const miner of supportedMiners) {
      const doc = await $content(`${pathPrefix}/${miner}`).fetch()
      miners.push(doc)
    }

    shuffleArray(miners)

    return {
      miners,
    }
  },
  computed: {
    darkMode() {
      return this.$vuetify.theme.dark
    },
  },
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = array[i]
    array[i] = array[j]
    array[j] = temp
  }
}
</script>

<style lang="scss" scoped>
.v-card__title {
  background-color: var(--v-secondary-base) !important;
}
</style>
