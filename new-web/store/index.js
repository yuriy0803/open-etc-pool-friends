import axios from 'axios';
import consola from 'consola';
import config from '@/params/config.json';
import networks from '@/params/networks.json';

const TARGET_TIME = networks[config.network].blockTime;
const EPOCH_LENGTH = networks[config.network].epochLength;
const API_URL = config.api + '/api';

export const state = () => ({
  env: {
    title: config.title,
    description: config.description,
    logo: config.logo,
    favicon: config.favicon,
    banner: config.banner,
    url: config.url,
    api: API_URL,
    network: networks[config.network],
    stratum: config.stratum,
    symbol: networks[config.network].symbol,
    explorer: config.explorer,
    poolFee: config.poolFee,
    payoutThreshold: config.payoutThreshold,
    extraPools: config.extraPools,
    mode: config.mode,
  },
  networks,
  minersOnline: 0,
  poolHashRate: 0,
  lastBlockFound: 0,
  roundShares: 0,
  height: 0,
  difficulty: 0,
  blocktime: 0,
  networkHashrate: 0,
  miners: {},
  blocks: {},
  payments: {},
  epoch: 0,
  dagSize: 0, // in MB
  now: Date.now(), // global now Date for time since calcs
  percent: 0,
});

export const mutations = {
  SET_STATS(state, info) {
    state.minersOnline = info.minersOnline || state.minersOnline;
    state.poolHashRate = info.poolHashRate || state.poolHashRate;
    state.lastBlockFound = info.lastBlockFound || state.lastBlockFound;
    state.roundShares = info.roundShares || state.roundShares;
    state.poolFee = info.poolFee || state.poolFee;
    state.height = info.height || state.height;
    state.difficulty = info.difficulty || state.difficulty;
    state.networkHashrate = state.difficulty / info.blocktime; // Use the blocktime from the API
    state.epoch = Math.trunc(info.height / EPOCH_LENGTH);
    state.dagSize = (state.epoch * 8192) / 1024 / 1024 + 1;

    // Calculate the percent
    const percent = (state.roundShares / state.difficulty) * 100;
    state.percent = percent.toFixed(0); // Store the result in the state
  },
  SET_MINERS(state, miners) {
    state.miners = miners;
  },
  SET_BLOCKS(state, blocks) {
    state.blocks = blocks;
  },
  SET_PAYMENTS(state, txns) {
    state.payments = txns;
  },
  SET_NOW(state, now) {
    state.now = now;
  },
};

export const actions = {
  async stats({ commit }) {
    try {
      const { data } = await axios.get(`${API_URL}/stats`);
      if (data) {
        const info = {
          minersOnline: data.minersTotal,
          poolHashRate: data.hashrate,
          height: data.nodes[0].height,
          difficulty: data.nodes[0].difficulty,
          lastBlockFound: data.stats.lastBlockFound,
          blocktime: data.nodes[0].blocktime, // Add the blocktime from the API
          roundShares: data.stats.roundShares, // Extrahieren Sie den Wert von roundShares aus den API-Daten
        };
        commit('SET_STATS', info);
      }
    } catch (error) {
      consola.error(error);
      throw new Error('Failed to fetch stats');
    }
  },
  async miners({ commit }) {
    try {
      const { data } = await axios.get(`${API_URL}/miners`);
      if (data) {
        commit('SET_MINERS', data.miners);
      }
    } catch (error) {
      consola.error(error);
      throw new Error('Failed to fetch miners');
    }
  },
  async blocks({ commit }) {
    try {
      const { data } = await axios.get(`${API_URL}/blocks`);
      if (data) {
        commit('SET_BLOCKS', data);
      }
    } catch (error) {
      consola.error(error);
      throw new Error('Failed to fetch blocks');
    }
  },
  async payments({ commit }) {
    try {
      const { data } = await axios.get(`${API_URL}/payments`);
      if (data) {
        commit('SET_PAYMENTS', data);
      }
    } catch (error) {
      consola.error(error);
      throw new Error('Failed to fetch payments');
    }
  },
  now({ commit }) {
    commit('SET_NOW', Date.now());
  },
};
