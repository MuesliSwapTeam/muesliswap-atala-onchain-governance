import { ConstructionOutlined } from '@mui/icons-material'
import CoinSelection from '../helpers/coinSelection.js'
import { getProtocolParameters, getTXBuilderConfig } from '../helpers/config'
import Loader from '../helpers/loader.js'
import { assetsToValue, fromHex, toHex } from '../helpers/utils.js'

const TRANSACTION_MESSAGE = 674

// CBOR helper: skip over a CBOR value and return the position after it
function skipCborValue(bytes, pos) {
  const header = bytes[pos++]
  const major = header >> 5
  const info = header & 0x1f

  let length
  if (info < 24) length = info
  else if (info === 24) { length = bytes[pos++] }
  else if (info === 25) { length = (bytes[pos] << 8) | bytes[pos + 1]; pos += 2 }
  else if (info === 26) { length = ((bytes[pos] << 24) >>> 0) + (bytes[pos + 1] << 16) + (bytes[pos + 2] << 8) + bytes[pos + 3]; pos += 4 }
  else return pos

  switch (major) {
    case 0: case 1: return pos
    case 2: case 3: return pos + length
    case 4:
      for (let i = 0; i < length; i++) pos = skipCborValue(bytes, pos)
      return pos
    case 5:
      for (let i = 0; i < length * 2; i++) pos = skipCborValue(bytes, pos)
      return pos
    case 6: return skipCborValue(bytes, pos)
    default: return pos
  }
}

// Remove entries with empty collections from a CBOR-encoded map.
// Fixes CSL serialization issue where empty script lists (e.g. plutus_v1_scripts)
// are included in the witness set, which the Cardano node rejects.
function removeEmptyCollectionsFromMap(cborBytes) {
  const bytes = new Uint8Array(cborBytes)
  let pos = 0

  const header = bytes[pos++]
  if ((header >> 5) !== 5) return cborBytes

  let mapLen = header & 0x1f
  if (mapLen === 24) mapLen = bytes[pos++]
  else if (mapLen >= 24) return cborBytes

  const entries = []
  for (let i = 0; i < mapLen; i++) {
    const entryStart = pos
    pos = skipCborValue(bytes, pos)
    const valueStart = pos
    pos = skipCborValue(bytes, pos)

    const vLen = pos - valueStart
    const isEmpty = (vLen === 1 && bytes[valueStart] === 0x80) ||
                    (vLen === 4 && bytes[valueStart] === 0xd9 &&
                     bytes[valueStart + 1] === 0x01 && bytes[valueStart + 2] === 0x02 &&
                     bytes[valueStart + 3] === 0x80)

    if (!isEmpty) entries.push(bytes.slice(entryStart, pos))
  }

  if (entries.length === mapLen) return cborBytes

  const result = new Uint8Array(1 + entries.reduce((s, e) => s + e.length, 0))
  result[0] = 0xa0 | entries.length
  let offset = 1
  for (const entry of entries) {
    result.set(entry, offset)
    offset += entry.length
  }
  return result
}

// Fix the witness set inside a serialized transaction CBOR.
// Transaction is CBOR array: [body, witness_set, is_valid, auxiliary_data]
function fixTransactionWitnessSet(txBytes) {
  const bytes = new Uint8Array(txBytes)
  let pos = 0

  const arrayHeader = bytes[pos++]
  if ((arrayHeader >> 5) !== 4) return txBytes

  pos = skipCborValue(bytes, pos) // skip body
  const wsStart = pos
  pos = skipCborValue(bytes, pos) // skip witness set
  const wsEnd = pos

  const fixedWs = removeEmptyCollectionsFromMap(bytes.slice(wsStart, wsEnd))
  if (fixedWs.length === wsEnd - wsStart) return txBytes

  const result = new Uint8Array(wsStart + fixedWs.length + (bytes.length - wsEnd))
  result.set(bytes.slice(0, wsStart), 0)
  result.set(new Uint8Array(fixedWs), wsStart)
  result.set(bytes.slice(wsEnd), wsStart + fixedWs.length)
  return result
}

export const initTx = async (addDatumWitness) => {
  await Loader.load()

  const protocolParameters = await getProtocolParameters()
  const txBuilderConfig = await getTXBuilderConfig(protocolParameters, addDatumWitness)

  const txBuilder = Loader.Cardano.TransactionBuilder.new(txBuilderConfig)

  const datums = Loader.Cardano.PlutusList.new()
  const metadata = {
    [TRANSACTION_MESSAGE]: {},
  }
  const outputs = Loader.Cardano.TransactionOutputs.new()

  return { txBuilder, datums, metadata, outputs }
}

export const createOutput = (address, value, datum, datumHash) => {
  const v = value

  const output = Loader.Cardano.TransactionOutput.new(address, v)

  if (datum) {
    output.set_data_hash(datumHash)
  }

  //TODO: replace with correct parameter value
  const dataCost = Loader.Cardano.DataCost.new_coins_per_byte(Loader.Cardano.BigNum.from_str('4310'))
  const minAda = Loader.Cardano.min_ada_for_output(output, dataCost)

  if (minAda.compare(v.coin()) == 1) v.set_coin(minAda)

  const outputFinal = Loader.Cardano.TransactionOutput.new(address, v)

  if (datum) {
    outputFinal.set_data_hash(datumHash)
  }

  return outputFinal
}

export const createOutputInlineDatum = (address, value, datum) => {
  const v = value

  const output = Loader.Cardano.TransactionOutput.new(address, v)

  if (datum) {
    output.set_plutus_data(datum)
  }

  //TODO: replace with correct parameter value
  const dataCost = Loader.Cardano.DataCost.new_coins_per_byte(Loader.Cardano.BigNum.from_str('4310'))
  const minAda = Loader.Cardano.min_ada_for_output(output, dataCost)

  if (minAda.compare(v.coin()) == 1) v.set_coin(minAda)

  const outputFinal = Loader.Cardano.TransactionOutput.new(address, v)

  if (datum) {
    outputFinal.set_plutus_data(datum)
  }

  return outputFinal
}

export async function finalizeTX(
  wallet,
  txBuilder,
  changeAddress,
  utxos,
  outputs,
  datums,
  metadata,
  scriptUtxo,
  action,
  embedDatum,
  frontendFeeIncluded,
  setCollateral = false,
) {
  // add outputs
  for (let i = 0; i < outputs.len(); i++) {
    txBuilder.add_output(outputs.get(i))
  }

  let aux_data
  // add metadata
  if (metadata) {
    aux_data = Loader.Cardano.AuxiliaryData.new()
    const generalMetadata = Loader.Cardano.GeneralTransactionMetadata.new()
    Object.keys(metadata).forEach((label) => {
      generalMetadata.insert(
        Loader.Cardano.BigNum.from_str(label),
        Loader.Cardano.encode_json_str_to_metadatum(JSON.stringify(metadata[label]), 1),
      )
    })
    aux_data.set_metadata(generalMetadata)
    txBuilder.set_auxiliary_data(aux_data)
  }

  const protocolParameters = await getProtocolParameters()

  CoinSelection.setProtocolParameters(
    protocolParameters.minUtxo,
    protocolParameters.linearFee.minFeeA,
    protocolParameters.linearFee.minFeeB,
    protocolParameters.maxTxSize.toString(),
    protocolParameters.coinsPerUtxoByte.toString(),
  )

  let { input } = CoinSelection.randomImprove(utxos, outputs, 14, scriptUtxo ? [scriptUtxo] : [])

  if (scriptUtxo) {
    input.forEach((utxo) => {
      if (
        utxo.input().transaction_id().to_hex() !== scriptUtxo.input().transaction_id().to_hex() ||
        utxo.input().index() !== scriptUtxo.input().index()
      ) {
        txBuilder.add_input(utxo.output().address(), utxo.input(), utxo.output().amount())
      }
    })
  } else {
    input.forEach((utxo) => {
      txBuilder.add_input(utxo.output().address(), utxo.input(), utxo.output().amount())
    })
  }

  if (scriptUtxo || setCollateral) {
    const costmdls = Loader.Cardano.Costmdls.from_json(JSON.stringify(protocolParameters.costModels))
    // const costmdls = Loader.Cardano.TxBuilderConstants.plutus_vasil_cost_models()
    txBuilder.calc_script_data_hash(costmdls)

    var walletCollateral = await (wallet.getCollateral || wallet.experimental.getCollateral).call(wallet)
    if (!walletCollateral || !walletCollateral.length) throw new Error("Collateral missing - please set up collateral in your wallet")

    var collateralUtxos = walletCollateral.map((utxo) =>
      Loader.Cardano.TransactionUnspentOutput.from_bytes(fromHex(utxo)),
    )
    if (!collateralUtxos?.length || !collateralUtxos[0]) throw new Error("Issue with Collateral")

    var collateralUtxo = collateralUtxos[0]

    const txInputsBuilder = Loader.Cardano.TxInputsBuilder.new()
    txInputsBuilder.add_input(
      collateralUtxo.output().address(),
      collateralUtxo.input(),
      collateralUtxo.output().amount(),
    )

    txBuilder.set_collateral(txInputsBuilder)
  }

  if (embedDatum && datums && !action) {
    const costmdls = Loader.Cardano.Costmdls.new()
    const redeemers = Loader.Cardano.Redeemers.new()
    const datumsTmp = Loader.Cardano.PlutusList.from_bytes(datums.to_bytes())
    const scriptDataHash = Loader.Cardano.hash_script_data(redeemers, costmdls, datumsTmp)
    txBuilder.set_script_data_hash(scriptDataHash)
  }

  txBuilder.add_change_if_needed(changeAddress.to_address())

  const buildTransaction = txBuilder.build_tx()
  const witnessSetTmp = buildTransaction.witness_set()

  if (embedDatum && datums && !action) {
    witnessSetTmp.set_plutus_data(datums)
  }

  const tmpTransaction = Loader.Cardano.Transaction.new(
    buildTransaction.body(),
    witnessSetTmp,
    buildTransaction.auxiliary_data(),
  )

  const unsignedTxCBOR = toHex(tmpTransaction.to_bytes())
  let frontendVkeyWitness = undefined
  
  console.log("Unsigned tx CBOR", unsignedTxCBOR)
  var cancelURL = `https://hooks.did.muesliswap.com/signature?tx_cbor=${unsignedTxCBOR}`
  const feeError = Error("fee utxo can't be signed - please contact the MuesliSwap support")
  feeError.name = 'Fee'
  try {
    var response = await fetch(cancelURL)
    var responseJson = await response.json()
  } catch {
    throw feeError
  }

  if (responseJson['status'] !== 'success') {
    throw feeError
  }

  var signature = responseJson['signature']
  frontendVkeyWitness = Loader.Cardano.Vkeywitness.from_bytes(fromHex(signature))

  let txVkeyWitnesses = await wallet.signTx(unsignedTxCBOR, true)
  if (!txVkeyWitnesses) throw new Error("Signing failed")

  txVkeyWitnesses = Loader.Cardano.TransactionWitnessSet.from_bytes(fromHex(txVkeyWitnesses))

  var vKeyWitnesses = txVkeyWitnesses.vkeys()

  if (frontendVkeyWitness) vKeyWitnesses.add(frontendVkeyWitness)

  const witnessSet = tmpTransaction.witness_set()
  witnessSet.set_vkeys(vKeyWitnesses)

  const signedTx = Loader.Cardano.Transaction.new(tmpTransaction.body(), witnessSet, tmpTransaction.auxiliary_data())

  // Fix witness set CBOR: remove empty script lists that CSL may serialize,
  // which the Cardano node rejects ("Empty list of scripts is not allowed")
  const txCbor = fixTransactionWitnessSet(signedTx.to_bytes())

  return txCbor
}

export function constructUTXO(
  utxoHash,
  utxoId,
  sellTokenPolicyId,
  sellTokenName,
  sellTokenAmount,
  lvlAttached,
  receivedAmount,
  buyTokenPolicyId,
  buyTokenName,
  address,
) {
  // use different value if we buy ADA
  let lovelaceTotal = lvlAttached

  if (buyTokenPolicyId === '') {
    lovelaceTotal = 1.7e6
  }

  let assetsObj = []

  if (buyTokenPolicyId !== '' && receivedAmount > 0) {
    var utxoAsset = {
      unit: buyTokenPolicyId + buyTokenName,
      quantity: receivedAmount.toString(),
    }
    assetsObj.push(utxoAsset)
  } else {
    // receivedAmount need to sutract 0.95 ada in mm fee -> todo: find better way to do that
    lovelaceTotal += receivedAmount
  }

  if (sellTokenPolicyId !== '') {
    assetsObj.push({
      unit: sellTokenPolicyId + sellTokenName,
      quantity: sellTokenAmount.toString(),
    })
  } else {
    lovelaceTotal += sellTokenAmount
  }

  assetsObj.push({
    unit: 'lovelace',
    quantity: lovelaceTotal.toString(),
  })

  const transactionInput = Loader.Cardano.TransactionInput.new(
    Loader.Cardano.TransactionHash.from_bytes(fromHex(utxoHash)),
    Number(utxoId.toString()),
  )
  const transactionOutput = Loader.Cardano.TransactionOutput.new(address, assetsToValue(assetsObj))

  const utxo = Loader.Cardano.TransactionUnspentOutput.new(transactionInput, transactionOutput)

  return utxo
}