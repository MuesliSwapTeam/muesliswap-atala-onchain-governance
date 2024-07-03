from hypothesis import given, strategies as st

from contracts.onchain.util import *


MOCK_POLICY_ID = b"c881c20e49dbaca3ff6cef365969354150983230c39520b917f5cf7c"
MOCK_TOKEN_NAME_1 = b"4d494c4b"
MOCK_TOKEN_NAME_2 = b"4d494c4b7632"


@given(
    no_minted_1=st.integers(),
    no_minted_2=st.integers(),
)
def test_check_mint_exactly_nothing(
    no_minted_1: int,
    no_minted_2: int,
) -> None:
    minted = {
        MOCK_POLICY_ID: (
            {}
            if no_minted_1 == 0 and no_minted_2 == 0
            else (
                {MOCK_TOKEN_NAME_1: no_minted_1}
                if no_minted_2 == 0
                else {MOCK_TOKEN_NAME_1: no_minted_1, MOCK_TOKEN_NAME_2: no_minted_2}
            )
        )
    }
    try:
        check_mint_exactly_nothing(minted, MOCK_POLICY_ID, MOCK_TOKEN_NAME_1)
        assert no_minted_2 == 0
        assert 0 == no_minted_1
    except AssertionError:
        assert 0 != no_minted_1 or no_minted_2 != 0


@given(
    no_minted_1=st.integers(),
    no_minted_2=st.integers(),
)
def test_check_mint_exactly_one_with_name(
    no_minted_1: int,
    no_minted_2: int,
) -> None:
    minted = {
        MOCK_POLICY_ID: (
            {MOCK_TOKEN_NAME_1: no_minted_1}
            if no_minted_2 == 0
            else {MOCK_TOKEN_NAME_1: no_minted_1, MOCK_TOKEN_NAME_2: no_minted_2}
        )
    }
    try:
        check_mint_exactly_one_with_name(minted, MOCK_POLICY_ID, MOCK_TOKEN_NAME_1)
        assert no_minted_2 == 0
        assert 1 == no_minted_1
    except AssertionError:
        assert 1 != no_minted_1 or no_minted_2 != 0


@given(
    no_minted_1=st.integers(),
    no_minted_2=st.integers(),
    n=st.integers(),
)
def test_check_mint_exactly_n_with_name(
    no_minted_1: int,
    no_minted_2: int,
    n: int,
) -> None:
    minted = {
        MOCK_POLICY_ID: (
            {MOCK_TOKEN_NAME_1: no_minted_1}
            if no_minted_2 == 0
            else {MOCK_TOKEN_NAME_1: no_minted_1, MOCK_TOKEN_NAME_2: no_minted_2}
        )
    }
    try:
        check_mint_exactly_n_with_name(minted, n, MOCK_POLICY_ID, MOCK_TOKEN_NAME_1)
        assert no_minted_2 == 0
        assert n == no_minted_1
    except AssertionError:
        assert n != no_minted_1 or no_minted_2 != 0
