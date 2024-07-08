from hypothesis import given, strategies as st

from opshin.ledger.api_v2 import TxOut, NoOutputDatum, NoScriptHash
from opshin.prelude import Token
from contracts.onchain.util import *
from contracts.onchain.treasury.treasurer import *

from test.onchain.test_value import (
    MOCK_POLICY_ID,
    MOCK_TOKEN_NAMES,
)
from test.onchain.test_staking import MOCK_ADDRESS


@given(
    a1=st.integers(min_value=0, max_value=100),
    a2=st.integers(min_value=0, max_value=100),
    a3=st.integers(min_value=0, max_value=100),
    b1=st.integers(min_value=0, max_value=100),
    b2=st.integers(min_value=0, max_value=100),
    b3=st.integers(min_value=0, max_value=100),
)
def test_check_preserves_value(
    a1: int,
    a2: int,
    a3: int,
    b1: int,
    b2: int,
    b3: int,
) -> None:
    value_a = {
        MOCK_POLICY_ID: {
            MOCK_TOKEN_NAMES[0]: a1,
            MOCK_TOKEN_NAMES[1]: a2,
            MOCK_TOKEN_NAMES[2]: a3,
        }
    }
    value_b = {
        MOCK_POLICY_ID: {
            MOCK_TOKEN_NAMES[0]: b1,
            MOCK_TOKEN_NAMES[1]: b2,
            MOCK_TOKEN_NAMES[2]: b3,
        }
    }
    next_tx_out = TxOut(
        address=MOCK_ADDRESS,
        value=value_a,
        datum=NoOutputDatum(),
        reference_script=NoScriptHash(),
    )
    previous_tx_out = TxOut(
        address=MOCK_ADDRESS,
        value=value_b,
        datum=NoOutputDatum(),
        reference_script=NoScriptHash(),
    )
    value_gr_or_equal = a1 >= b1 and a2 >= b2 and a3 >= b3
    try:
        check_preserves_value(previous_tx_out, next_tx_out)
        assert value_gr_or_equal
    except AssertionError:
        assert not value_gr_or_equal


@given(
    a1=st.integers(min_value=0, max_value=100),
    a2=st.integers(min_value=0, max_value=100),
    a3=st.integers(min_value=0, max_value=100),
    a4=st.integers(min_value=0, max_value=100),
    b1=st.integers(min_value=0, max_value=100),
    b2=st.integers(min_value=0, max_value=100),
    b3=st.integers(min_value=0, max_value=100),
    b4=st.integers(min_value=0, max_value=100),
)
def test_check_treasurer_state_updated_correctly(
    a1: int,
    a2: int,
    a3: int,
    a4: int,
    b1: int,
    b2: int,
    b3: int,
    b4: int,
) -> None:
    previous_treasurer_state = TreasurerState(
        params=TreasurerParams(
            auth_nft=Token(MOCK_POLICY_ID, MOCK_TOKEN_NAMES[0]),
            value_store=MOCK_ADDRESS,
            treasurer_nft=Token(MOCK_POLICY_ID, MOCK_TOKEN_NAMES[1]),
        ),
        last_applied_proposal_id=42,
    )
    new_proposal_id = a4
    next_treasurer_state = TreasurerState(
        params=TreasurerParams(
            auth_nft=Token(MOCK_POLICY_ID, MOCK_TOKEN_NAMES[0]),
            value_store=MOCK_ADDRESS,
            treasurer_nft=Token(MOCK_POLICY_ID, MOCK_TOKEN_NAMES[1]),
        ),
        last_applied_proposal_id=new_proposal_id,
    )
    previous_tx_out = TxOut(
        address=MOCK_ADDRESS,
        value={
            MOCK_POLICY_ID: {
                MOCK_TOKEN_NAMES[0]: b1,
                MOCK_TOKEN_NAMES[1]: b2,
                MOCK_TOKEN_NAMES[2]: b3,
            }
        },
        datum=NoOutputDatum(),
        reference_script=NoScriptHash(),
    )
    next_tx_out = TxOut(
        address=MOCK_ADDRESS,
        value={
            MOCK_POLICY_ID: {
                MOCK_TOKEN_NAMES[0]: a1,
                MOCK_TOKEN_NAMES[1]: a2,
                MOCK_TOKEN_NAMES[2]: a3,
            }
        },
        datum=NoOutputDatum(),
        reference_script=NoScriptHash(),
    )
    desired_next_state = TreasurerState(
        params=TreasurerParams(
            auth_nft=Token(MOCK_POLICY_ID, MOCK_TOKEN_NAMES[0]),
            value_store=MOCK_ADDRESS,
            treasurer_nft=Token(MOCK_POLICY_ID, MOCK_TOKEN_NAMES[1]),
        ),
        last_applied_proposal_id=b4,
    )
    condition = a4 == b4 and a1 >= b1 and a2 >= b2 and a3 >= b3
    try:
        check_treasurer_state_updated_correctly(
            previous_treasurer_state,
            new_proposal_id,
            next_treasurer_state,
            previous_tx_out,
            next_tx_out,
        )
        assert condition
    except AssertionError:
        assert not condition