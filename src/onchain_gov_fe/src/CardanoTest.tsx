import { Buffer } from "buffer"
import { useState } from "react"
import { Address } from "@emurgo/cardano-serialization-lib-browser"

const fromHex = (hex: string) => Buffer.from(hex, "hex")
async function testCardano() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wallet = await (window as any).cardano.nami.enable()
    const addresses = await wallet.getUsedAddresses()

    const walletAddress = Address.from_bytes(fromHex(addresses[0]))
    const bechAddress = walletAddress.to_bech32()

    console.log(`Your address is ${bechAddress}`)
    return true
  } catch {
    return false
  }
}

export function useTestCardano() {
  const [r, setR] = useState<string>("Testing Cardano Integration...")
  const [c, setC] = useState<string>("grey")

  testCardano().then((b) => {
    if (b) {
      setR("Cardano Integration works!!")
      setC("green")
    } else {
      setR("Error during Cardano Integration Test")
      setC("red")
    }
  })

  return [r, c]
}
