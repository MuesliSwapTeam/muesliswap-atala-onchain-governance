import pycardano
from .to_db import add_output, add_address, add_token_raw, add_datum
from ..config import staking_address, vote_permission_nft_policy_id
from ..db_models import Block, TransactionOutput
from ..db_models import StakingParams, StakingState, StakingParticipation

from ...onchain.staking import staking as onchain_staking

import logging

from ..db_models.staking import (
    StakingParticipationInStaking,
    StakingDeposit,
    VotePermissionMint,
    VotePermission,
)
from ...utils.from_script_context import from_address

_LOGGER = logging.getLogger(__name__)


def process_tx(tx: pycardano.Transaction, block: Block):
    """
    Process a transaction and update the database accordingly.
    """
    created_states = []
    for i, output in enumerate(tx.transaction_body.outputs):
        if output.address == staking_address:
            print("Staking transaction")
            staking_output = add_output(output, i, tx.id.payload.hex(), block)
            try:
                onchain_staking_state: onchain_staking.StakingState = (
                    onchain_staking.StakingState.from_primitive(output.datum.data)
                )
            except Exception as e:
                _LOGGER.info(f"Invalid staking parameters at {tx.id.payload.hex()}")
                continue
            onchain_staking_params = onchain_staking_state.staking_params
            db_staking_params = StakingParams.get_or_create(
                owner=add_address(from_address(onchain_staking_params.owner)),
                governance_token=add_token_raw(
                    onchain_staking_params.governance_token.policy_id,
                    onchain_staking_params.governance_token.token_name,
                ),
                vault_ft_policy_id=onchain_staking_params.vault_ft_policy_id,
                tally_auth_nft=add_token_raw(
                    onchain_staking_params.tally_auth_nft.policy_id,
                    onchain_staking_params.tally_auth_nft.token_name,
                ),
            )[0]
            db_staking_state = StakingState.create(
                output=staking_output,
                staking_params=db_staking_params,
            )
            for i, participation in enumerate(onchain_staking_state.participations):
                db_staking_participation = StakingParticipation.get_or_create(
                    tally_auth_nft=add_token_raw(
                        participation.tally_auth_nft.policy_id,
                        participation.tally_auth_nft.token_name,
                    ),
                    proposal_id=participation.proposal_id,
                    weight=participation.weight,
                    proposal_index=participation.proposal_index,
                    end_time=participation.end_time,
                )[0]
                StakingParticipationInStaking.create(
                    staking_state=db_staking_state,
                    participation=db_staking_participation,
                    index=i,
                )
            created_states.append(db_staking_state)
    spent_states = []
    # we don't need to bother checking the inputs if no output stake is created
    # there is no way to spend a stake without creating one
    if created_states:
        for input in tx.transaction_body.inputs:
            staking_state = (
                StakingState.select()
                .join(TransactionOutput)
                .where(
                    (
                        TransactionOutput.transaction_hash
                        == input.transaction_id.payload.hex()
                    )
                    & (TransactionOutput.output_index == input.index)
                )
                .first()
            )
            if staking_state is None:
                continue
            spent_states.append(staking_state)
    for created_state in created_states:
        StakingDeposit.create(
            block=block,
            transaction_hash=tx.id.payload.hex(),
            prev_staking_state=spent_states[0] if len(spent_states) > 0 else None,
            new_staking_state=created_state,
        )
    vote_permission_nft_mint = (
        tx.transaction_body.mint.get(vote_permission_nft_policy_id, {})
        if tx.transaction_body.mint
        else {}
    )
    if vote_permission_nft_mint:
        minted_vote_permissions = []
        for asset_name, amount in vote_permission_nft_mint.items():
            add_token_raw(vote_permission_nft_policy_id, asset_name.to_primitive())
            minted_vote_permissions.append(asset_name.to_primitive())
        # resolve the granted permission from the redeemer
        for redeemer in tx.transaction_witness_set.redeemer:
            if redeemer.tag != pycardano.RedeemerTag.MINT:
                continue
            redeemer_datum = redeemer.data
            datum_hash = pycardano.datum_hash(redeemer_datum)
            if datum_hash.payload not in minted_vote_permissions:
                continue
            output_indices = [
                i
                for i, out in tx.transaction_body.outputs
                if out.amount.get(vote_permission_nft_policy_id, {}).get(
                    pycardano.AssetName(datum_hash.payload), 0
                )
                > 0
            ]
            for output_index in output_indices:
                VotePermissionMint.create(
                    block=block,
                    transaction_hash=tx.id.payload.hex(),
                    vote_permission=VotePermission.create(
                        token=add_token_raw(
                            vote_permission_nft_policy_id, datum_hash.payload
                        ),
                        delegated_action=add_datum(redeemer_datum),
                    ),
                    next_output=add_output(
                        tx.transaction_body.outputs[output_index],
                        output_index,
                        tx.id.payload.hex(),
                        block,
                    ),
                )

    pass
