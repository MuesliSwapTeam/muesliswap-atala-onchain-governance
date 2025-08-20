from hypothesis import given, strategies as st
import pycardano

from contracts.onchain.staking.staking import *
from contracts.utils.to_script_context import to_address
from test.onchain.test_value import (
    MOCK_POLICY_ID,
    MOCK_TOKEN_NAMES,
    check_equal_except_ada_increase_offchain,
    add_value_offchain,
)


MOCK_ADDRESS = to_address(
    pycardano.Address.from_primitive(
        "addr_test1qq2guufmhlnaaytu87q7m2h68rw6jwc3xgaq7u8jkzral59k20jz2zeacweq7ks5uqxlwd5uhj8deq342y59vrnzsltqcg0gml"
    )
)


def check_preserve_staking_position_value_offchain(
    previous_state_input: TxOut,
    next_state_output: TxOut,
    expected_value_change: Value,
) -> None:
    prev_value = previous_state_input.value
    next_value = next_state_output.value
    prev_value_plus_changed_value = add_value_offchain(
        prev_value,
        expected_value_change,
    )
    # note that it is fine to add in particular ada so that minutxo is preserved
    # however no unrelated tokens are to be added which would increase the output size
    check_equal_except_ada_increase_offchain(next_value, prev_value_plus_changed_value)


@given(
    a1=st.integers(min_value=0, max_value=100),
    a2=st.integers(min_value=0, max_value=100),
    a3=st.integers(min_value=0, max_value=100),
    b1=st.integers(min_value=0, max_value=100),
    b2=st.integers(min_value=0, max_value=100),
    b3=st.integers(min_value=0, max_value=100),
    c1=st.integers(min_value=0, max_value=100),
    c2=st.integers(min_value=0, max_value=100),
    c3=st.integers(min_value=0, max_value=100),
)
def test_check_preserve_staking_position_value(
    a1: int,
    a2: int,
    a3: int,
    b1: int,
    b2: int,
    b3: int,
    c1: int,
    c2: int,
    c3: int,
) -> None:
    previous_state_input = TxOut(
        address=MOCK_ADDRESS,
        value={
            b"": {b"": a1},
            MOCK_POLICY_ID: {MOCK_TOKEN_NAMES[0]: a2, MOCK_TOKEN_NAMES[1]: a3},
        },
        datum=NoOutputDatum(),
        reference_script=NoScriptHash(),
    )
    next_state_output = TxOut(
        address=MOCK_ADDRESS,
        value={
            b"": {b"": b1},
            MOCK_POLICY_ID: {MOCK_TOKEN_NAMES[0]: b2, MOCK_TOKEN_NAMES[1]: b3},
        },
        datum=NoOutputDatum(),
        reference_script=NoScriptHash(),
    )
    expected_value_change = {
        b"": {b"": c1},
        MOCK_POLICY_ID: {MOCK_TOKEN_NAMES[0]: c2, MOCK_TOKEN_NAMES[1]: c3},
    }
    res = b1 >= a1 + c1 and b2 == a2 + c2 and b3 == a3 + c3
    try:
        check_preserve_staking_position_value_offchain(
            previous_state_input, next_state_output, expected_value_change
        )
        assert res
    except AssertionError:
        assert not res
