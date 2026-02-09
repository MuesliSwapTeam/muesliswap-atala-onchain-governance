const CONFIGS = {
  mainnet: {
    blockfrostBaseUrl: 'https://cardano-mainnet.blockfrost.io/api/v0',
    blockfrostProjectId: 'mainnetoxChT32SOnqWIHAwiLXT0uXQoD8UXyMH',
    muesliApiBaseUrl: 'https://api.muesliswap.com',
    hookBaseUrl: 'https://hooks.did.muesliswap.com',
    mintingPolicyId: '74e785b8150ad5a3c43df33675695c58fde33f472f9d4bf97ceb9e73',
    delegationPolicyId: '3c84b8302198a7fe0beaafb9bbefd53010b047413d8832f3a76b9241',
    requiredSignerKeyHash: '36a95f079e147692ff9abe712c1393a59b161752541291972a763074',
    slotNetwork: 'Mainnet',
  },
  preprod: {
    blockfrostBaseUrl: 'https://cardano-preprod.blockfrost.io/api/v0',
    blockfrostProjectId: 'mainnetoxChT32SOnqWIHAwiLXT0uXQoD8UXyMH', // TODO: replace with preprod API key
    muesliApiBaseUrl: 'https://api.muesliswap.com', // TODO: replace with preprod API URL if different
    hookBaseUrl: 'https://hooks.did.muesliswap.com', // TODO: replace with preprod hook URL if different
    mintingPolicyId: '74e785b8150ad5a3c43df33675695c58fde33f472f9d4bf97ceb9e73', // TODO: replace with preprod policy ID
    delegationPolicyId: '3c84b8302198a7fe0beaafb9bbefd53010b047413d8832f3a76b9241', // TODO: replace with preprod policy ID
    requiredSignerKeyHash: '36a95f079e147692ff9abe712c1393a59b161752541291972a763074', // TODO: replace with preprod key hash
    slotNetwork: 'Preprod',
  },
}

const LS_KEY = 'did-network'

let currentNetwork = window.localStorage.getItem(LS_KEY) || 'mainnet'

export function getCurrentNetwork() {
  return currentNetwork
}

export function setCurrentNetwork(network) {
  currentNetwork = network
  window.localStorage.setItem(LS_KEY, network)
}

export function getNetworkConfig() {
  return CONFIGS[currentNetwork]
}
