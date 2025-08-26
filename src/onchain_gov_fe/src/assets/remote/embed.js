export async function initMuesliswapIframeBridge(e) {
  let t = document.getElementById("muesliswap_integrated_swap_container")
  while (!t) {
    console.log("sleeping")
    await new Promise((r) => setTimeout(r, 100))
    t = document.getElementById("muesliswap_integrated_swap_container")
  }

  const s = [
    "typhon",
    "ccvault",
    "enable",
    "isEnabled",
    "getBalance",
    "signData",
    "signTx",
    "submitTx",
    "getUtxos",
    "getCollateral",
    "getUsedAddresses",
    "getUnusedAddresses",
    "getChangeAddress",
    "getChangeAddresses",
    "getRewardAddress",
    "getRewardAddresses",
    "getNetworkId",
    "onAccountChange",
    "onNetworkChange",
    "off",
    "_events",
    "experimental",
  ]
  let n
  async function a() {
    return {
      wallets: Object.keys(window.cardano ?? {}).filter((e) => !s.includes(e)),
      walletConfigs: Object.keys(window.cardano ?? {})
        .filter((e) => !s.includes(e))
        .map((e) => ({
          title: window.cardano[e].name,
          icon: window.cardano[e].icon,
          connectorId: e,
          experimental: !0,
          detected: !0,
        })),
      connectTo: e,
      parentIdent: window.location.hostname,
    }
  }
  async function r(e) {
    switch (e.type) {
      case 1e3:
        return a()
      case 1001:
        return (async function (e) {
          const { wallets: t } = await a()
          return !!t.includes(e) && ((n = await window.cardano[e].enable()), !0)
        })(e.args)
      case 1002:
        return n.isEnabled()
      case 1003:
        return n.getNetworkId()
      case 1005:
        return n.getBalance()
      case 1006:
        return n.getUsedAddresses()
      case 1008:
        return n.getChangeAddresses()
      case 1009:
        return n.getRewardAddress()
      case 1013:
        return n.getCollateral()
      case 1004:
        return n.getUtxos(e.args.amount, e.args.paginate)
      case 1007:
        return n.getUnusedAddresses(e.args.paginate)
      case 1010:
        return n.signTx(e.args.tx, e.args.partialSign)
      case 1011:
        return n.signData(e.args.addr, e.args.sigStructure)
      case 1012:
        return n.submitTx(e.args.tx)
      default: {
        const t = new Error(`Unknown message type: ${e.type}`)
        return Promise.reject(t)
      }
    }
  }
  const o = (e) => {
    if (
      "@MuesliswapIFrameCommunicator#" !== e.data.source ||
      ("https://embedded.muesliswap.com" !== e.origin &&
        "https://embedded.staging.muesliswap.com" !== e.origin &&
        "http://localhost" !== e.origin &&
        !e.origin.startsWith("http://localhost:"))
    )
      return
    const s = async (s) => {
      const n = {
        source: "@MuesliswapIFrameCommunicator#",
        m_id: e.data.m_id,
        result: s,
      }
      t.contentWindow.postMessage(n, e.origin)
    }
    r(e.data).then(s, s).catch(s)
  }
  return (
    window.addEventListener("message", o, !1),
    () => {
      window.removeEventListener("message", o, !1)
    }
  )
}
