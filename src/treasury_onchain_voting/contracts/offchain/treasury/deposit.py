import fire

from contracts.onchain.treasury import (
    treasurer_nft,
    treasurer,
    value_store,
)
from contracts.utils.network import show_tx, context
from opshin.ledger.api_v2 import (
    POSIXTime,
)
from opshin.prelude import Token
from pycardano import (
    OgmiosChainContext,
    TransactionBuilder,
    Redeemer,
    AuxiliaryData,
    AlonzoMetadata,
    Metadata,
    TransactionOutput,
    Value,
)

from ..util import (
    token_from_string,
    asset_from_token,
    with_min_lovelace,
    TREASURER_STATE_NFT_TK_NAME,
)
from contracts.onchain.staking import (
    staking_vote_nft,
    staking,
    vault_ft,
)
from contracts.onchain.tally import tally_auth_nft, tally
from contracts.onchain.gov_state import gov_state_nft, gov_state
from ...utils import get_signing_info, ogmios_url, network, kupo_url
from ...utils.contracts import get_contract, get_ref_utxo, module_name
from ...utils.to_script_context import to_address, to_tx_out_ref


def main(
    wallet: str = "creator",
    treasurer_nft_token_name: str = TREASURER_STATE_NFT_TK_NAME,
    amount: int = 2_000_000,
    number_of_outputs: int = 50,
    governance_token: str = "bd976e131cfc3956b806967b06530e48c20ed5498b46a5eb836b61c2.744d494c4b",
):
    governance_token = token_from_string(governance_token)
    # Load script info
    (
        treasurer_nft_script,
        treasurer_nft_policy_id,
        _,
    ) = get_contract(module_name(treasurer_nft), True)
    treasurer_nft_ref_utxo = get_ref_utxo(treasurer_nft_script, context)
    (
        _,
        _,
        treasurer_address,
    ) = get_contract(module_name(treasurer), True)
    (_, _, value_store_address) = get_contract(module_name(value_store), True)

    # Get payment address
    payment_vkey, payment_skey, payment_address = get_signing_info(
        wallet, network=network
    )

    # Select UTxO to define the governance thread ID
    utxos = context.utxos(payment_address)
    unique_utxo = utxos[0]

    # generate treasurer_state_nft
    treasurer_nft_token = Token(
        policy_id=treasurer_nft_policy_id.payload,
        token_name=bytes.fromhex(treasurer_nft_token_name),
    )

    # Make the datum of the ValueStore
    value_store_datum = value_store.ValueStoreState(
        treasurer_nft=treasurer_nft_token,
    )

    # Build the transaction
    builder = TransactionBuilder(context)
    builder.auxiliary_data = AuxiliaryData(
        data=AlonzoMetadata(
            metadata=Metadata({674: {"msg": ["Deposit Funds to Treasury"]}})
        )
    )
    builder.add_input(unique_utxo)
    builder.add_input_address(payment_address)
    for _ in range(number_of_outputs):
        output = TransactionOutput(
            address=value_store_address,
            amount=Value(
                coin=amount,
                multi_asset=asset_from_token(governance_token, amount=1),
            ),
            datum=value_store_datum,
        )
        builder.add_output(output)

    # Sign the transaction
    signed_tx = builder.build_and_sign(
        signing_keys=[payment_skey],
        change_address=payment_address,
    )

    # Submit the transaction
    context.submit_tx(signed_tx)

    show_tx(signed_tx)


if __name__ == "__main__":
    fire.Fire(main)
