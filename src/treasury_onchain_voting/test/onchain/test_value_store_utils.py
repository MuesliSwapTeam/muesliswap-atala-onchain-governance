from hypothesis import given, strategies as st

from opshin.ledger.api_v2 import TxOut, NoOutputDatum, NoScriptHash
from opshin.prelude import Token
from contracts.onchain.util import *
from contracts.onchain.treasury.value_store import *

from test.onchain.test_value import (
    MOCK_POLICY_ID,
    MOCK_TOKEN_NAMES,
)
from test.onchain.test_staking import MOCK_ADDRESS


@given(
    t=st.integers(min_value=0, max_value=2),
    a1=st.integers(min_value=0, max_value=100),
    a2=st.integers(min_value=0, max_value=100),
    a3=st.integers(min_value=0, max_value=100),
)
def test_token_present_in_output(
    t: int,
    a1: int,
    a2: int,
    a3: int,
) -> None:
    token = Token(MOCK_POLICY_ID, MOCK_TOKEN_NAMES[t])
    output = TxOut(
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
    token_present = t == 0 and a1 > 0 or t == 1 and a2 > 0 or t == 2 and a3 > 0
    try:
        token_present_in_output(token, output)
        assert token_present
    except AssertionError:
        assert not token_present
