"""
The staking contract.

This contract holds governance tokens (i.e. MILK) and vault FT tokens that represent
locked governance tokens. It tracks participation in tallies and releases these tokens
only when they are not participating in a tally anymore.

This contract is intended to be have inputs from these contracts:
- staking/staking (1 at most, maintaining the state of participations)
- tally/tally: For tracking the retraction of participation in a tally

This contract is intended to have mints with these contracts:
- staking/staking_vote_nft: For tracking the addition of participation in a tally

Outputs of this contract may go to:
- staking/staking (1 at most, continuation of the above)
- the owner of the staking position (for withdrawing funds)
- tally/tally (1 at most, maintaining the tally state, no value transfer should happen to this address)

NFTs present at outputs of this contract:
- staking/staking_vote_nft (authenticates a valid participation in the tally towards the tally contract)
- staking/vault_ft (represents locked governance tokens)
- staking/vote_permission_nft (permits a third party to execute an addition or retraction of tally participation, i.e. votes)
- tally/tally_auth_nft (1 at the output that goes to the tally and has previously been at the tally)

It is not allowed to spend several staking states in a single transaction.
"""
from contracts.onchain.staking.staking_util import *


def resolve_linear_input_state(datum: StakingState) -> StakingState:
    """
    Resolve the datum of the input that is referenced by the redeemer.
    """
    # TODO could compare datum with previous_state_input.datum, but maybe not necessary
    return datum


def resolve_linear_output_state(
    next_state_output: TxOut, tx_info: TxInfo
) -> StakingState:
    """
    Resolve the continuing datum of the output that is referenced by the redeemer.
    """
    next_state: StakingState = resolve_datum_unsafe(next_state_output, tx_info)
    return next_state


def check_next_state_correct(
    next_state: StakingState, desired_next_state: StakingState
) -> None:
    assert desired_next_state == next_state, "New staking state is incorrect"


def transform_redeemer_to_delegated_redeemer(
    redeemer: Union[AddVote, RetractVote],
    previous_state: StakingState,
) -> DelegatableStakingRedeemer:
    if isinstance(redeemer, AddVote):
        return DelegatedAddVote(
            redeemer.participation,
        )
    elif isinstance(redeemer, RetractVote):
        return DelegatedRetractVote(
            previous_state.participations[redeemer.participation_index],
        )
    else:
        assert False, "Invalid redeemer type"
        return DelegatedAddVote(
            previous_state.participations[0],
        )


def check_owner_authorized_operation(
    previous_state: StakingState,
    redeemer: StakingRedeemer,
    previous_state_input: TxOut,
    vote_permission_nft_policy: PolicyId,
    tx_info: TxInfo,
) -> None:
    # The has to have authorized performing the operation by adding the correct NFT

    print("Owner did not sign tx, checking for permission NFT")
    assert isinstance(redeemer, AddVote) or isinstance(
        redeemer, RetractVote
    ), "Only adding or retracting votes is allowed without owner signature"
    spent_vote_permission_token = Token(
        vote_permission_nft_policy,
        vote_permission_nft_token_name(
            VotePermissionNFTParams(
                previous_state.params.owner,
                transform_redeemer_to_delegated_redeemer(redeemer, previous_state),
            )
        ),
    )
    assert token_present_in_output(
        spent_vote_permission_token,
        previous_state_input,
    ), "Permission NFT was not spent in specified tally index input"


def check_enough_governance_tokens_in_output(
    desired_next_state: StakingState,
    next_state_output: TxOut,
    tx_validity_range: POSIXTimeRange,
) -> None:
    latest_vote_time: ExtendedPOSIXTime = NegInfPOSIXTime()
    for p in desired_next_state.participations:
        end_time = p.end_time
        if ext_after_ext(end_time, latest_vote_time):
            latest_vote_time = end_time

    next_locked_governance_tokens = governance_weight_in_output(
        next_state_output,
        desired_next_state.params.governance_token,
        desired_next_state.params.vault_ft_policy,
        latest_vote_time,
    )
    minimum_required_governance_tokens = max(
        [0]
        + [
            p.weight
            for p in desired_next_state.participations
            if not vote_has_ended(p.end_time, tx_validity_range)
        ]
    )
    assert (
        minimum_required_governance_tokens <= next_locked_governance_tokens
    ), "Removed too many gov tokens"


def check_extract_max_2_ada(
    previous_state_input: TxOut, next_state_output: TxOut
) -> None:
    prev_value = previous_state_input.value
    next_value = next_state_output.value
    prev_value_minus_one_ada = subtract_value(prev_value, {b"": {b"": 2_000_000}})
    check_greater_or_equal_value(next_value, prev_value_minus_one_ada)


def check_preserve_staking_position_value(
    previous_state_input: TxOut,
    next_state_output: TxOut,
    expected_value_change: Value,
) -> None:
    prev_value = previous_state_input.value
    next_value = next_state_output.value
    prev_value_plus_changed_value = add_value(
        prev_value,
        expected_value_change,
    )
    # note that it is fine to add in particular ada so that minutxo is preserved
    # however no unrelated tokens are to be added which would increase the output size
    check_equal_except_ada_increase(next_value, prev_value_plus_changed_value)


def validator(
    vote_permission_nft_policy: PolicyId,
    state: StakingState,
    redeemer: StakingRedeemer,
    context: ScriptContext,
) -> None:
    """
    Staking Contract
    Locks user funds and tracks participation in the governance.
    Funds can only be withdrawn after the proposals that the fund participate in have ended.
    Until the end of participating proposals, the user can only withdraw so many tokens that all proposals are still backed (max of participating funds).
    The user may add or retract votes at any time, with weight up to the locked tokens or participating tokens respectively.

    Note that the staking contract is not aware of the existance of the governance state.
    This is why a vote participation is only valid when accompanied by the the correct stake authentication NFT.
    """
    purpose = get_spending_purpose(context)
    tx_info = context.tx_info

    previous_state_input = resolve_linear_input(
        tx_info, redeemer.state_input_index, purpose
    )
    previous_state = resolve_linear_input_state(state)
    next_state_output = resolve_linear_output(
        previous_state_input, tx_info, redeemer.state_output_index
    )
    next_state = resolve_linear_output_state(next_state_output, tx_info)

    desired_next_state = construct_desired_output_staking_state(
        previous_state, redeemer, tx_info
    )
    owner_controls_tx = user_signed_tx(previous_state.params.owner, tx_info)

    # check that the new state is correct
    check_next_state_correct(next_state, desired_next_state)
    # check that the amount of governance tokens in the output is correct
    check_enough_governance_tokens_in_output(
        desired_next_state, next_state_output, tx_info.valid_range
    )
    if not owner_controls_tx:
        # check that only the owner can perform operations
        check_owner_authorized_operation(
            previous_state,
            redeemer,
            previous_state_input,
            vote_permission_nft_policy,
            tx_info,
        )
    # check that the staking state is not made too large accidentally
    check_staking_output_reasonably_sized(next_state_output, next_state)
