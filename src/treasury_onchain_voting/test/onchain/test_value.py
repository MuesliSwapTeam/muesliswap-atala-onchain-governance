from hypothesis import given, strategies as st

from contracts.onchain.util import *


MOCK_POLICY_ID = b"c881c20e49dbaca3ff6cef365969354150983230c39520b917f5cf7c"
MOCK_TOKEN_NAMES = [b"4d494c4b", b"4d494c4b7632", b"4d5969656c64", b"4d566f7563686572"]


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
def test_greater_or_equal_value(
    a1: int,
    a2: int,
    a3: int,
    a4: int,
    b1: int,
    b2: int,
    b3: int,
    b4: int,
) -> None:
    a = {
        MOCK_POLICY_ID: {
            MOCK_TOKEN_NAMES[0]: a1,
            MOCK_TOKEN_NAMES[1]: a2,
            MOCK_TOKEN_NAMES[2]: a3,
            MOCK_TOKEN_NAMES[3]: a4,
        }
    }
    b = {
        MOCK_POLICY_ID: {
            MOCK_TOKEN_NAMES[0]: b1,
            MOCK_TOKEN_NAMES[1]: b2,
            MOCK_TOKEN_NAMES[2]: b3,
            MOCK_TOKEN_NAMES[3]: b4,
        }
    }
    gr_or_equal = a1 >= b1 and a2 >= b2 and a3 >= b3 and a4 >= b4
    try:
        check_greater_or_equal_value(a, b)
        assert gr_or_equal
    except AssertionError:
        assert not gr_or_equal


def _add_token_names_offchain(
    a: Dict[TokenName, int], b: Dict[TokenName, int]
) -> Dict[TokenName, int]:
    """
    Add b to a, return a + b
    """
    if not a:
        return b
    if not b:
        return a
    return {
        tn: a.get(tn, 0) + b.get(tn, 0)
        for tn in merge_without_duplicates(list(a.keys()), list(b.keys()))
    }


def add_value_offchain(a: Value, b: Value) -> Value:
    """
    Add b to a, return a + b
    """
    if not a:
        return b
    if not b:
        return a
    return {
        pid: _add_token_names_offchain(
            a.get(pid, EMTPY_TOKENNAME_DICT), b.get(pid, EMTPY_TOKENNAME_DICT)
        )
        for pid in merge_without_duplicates(list(a.keys()), list(b.keys()))
    }


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
def test_add_value(
    a1: int,
    a2: int,
    a3: int,
    a4: int,
    b1: int,
    b2: int,
    b3: int,
    b4: int,
) -> None:
    a = {
        MOCK_POLICY_ID: {
            MOCK_TOKEN_NAMES[0]: a1,
            MOCK_TOKEN_NAMES[1]: a2,
            MOCK_TOKEN_NAMES[2]: a3,
            MOCK_TOKEN_NAMES[3]: a4,
        }
    }
    b = {
        MOCK_POLICY_ID: {
            MOCK_TOKEN_NAMES[0]: b1,
            MOCK_TOKEN_NAMES[1]: b2,
            MOCK_TOKEN_NAMES[2]: b3,
            MOCK_TOKEN_NAMES[3]: b4,
        }
    }
    sum_value = {
        MOCK_POLICY_ID: {
            MOCK_TOKEN_NAMES[0]: a1 + b1,
            MOCK_TOKEN_NAMES[1]: a2 + b2,
            MOCK_TOKEN_NAMES[2]: a3 + b3,
            MOCK_TOKEN_NAMES[3]: a4 + b4,
        }
    }
    assert add_value_offchain(a, b) == sum_value


def _subtract_token_names_offchain(
    a: Dict[TokenName, int], b: Dict[TokenName, int]
) -> Dict[TokenName, int]:
    """
    Subtract b from a, return a - b
    """
    if not b:
        return a
    elif not a:
        return {tn_amount[0]: -tn_amount[1] for tn_amount in b.items()}
    return {
        tn: a.get(tn, 0) - b.get(tn, 0)
        for tn in merge_without_duplicates(list(a.keys()), list(b.keys()))
    }


def subtract_value_offchain(a: Value, b: Value) -> Value:
    """
    Subtract b from a, return a - b
    """
    if not b:
        return a
    elif not a:
        return {
            pid_tokens[0]: {
                tn_amount[0]: -tn_amount[1] for tn_amount in pid_tokens[1].items()
            }
            for pid_tokens in b.items()
        }
    return {
        pid: _subtract_token_names_offchain(
            a.get(pid, EMTPY_TOKENNAME_DICT), b.get(pid, EMTPY_TOKENNAME_DICT)
        )
        for pid in merge_without_duplicates(list(a.keys()), list(b.keys()))
    }


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
def test_subtract_value(
    a1: int,
    a2: int,
    a3: int,
    a4: int,
    b1: int,
    b2: int,
    b3: int,
    b4: int,
) -> None:
    a = {
        MOCK_POLICY_ID: {
            MOCK_TOKEN_NAMES[0]: a1,
            MOCK_TOKEN_NAMES[1]: a2,
            MOCK_TOKEN_NAMES[2]: a3,
            MOCK_TOKEN_NAMES[3]: a4,
        }
    }
    b = {
        MOCK_POLICY_ID: {
            MOCK_TOKEN_NAMES[0]: b1,
            MOCK_TOKEN_NAMES[1]: b2,
            MOCK_TOKEN_NAMES[2]: b3,
            MOCK_TOKEN_NAMES[3]: b4,
        }
    }
    res_value = {
        MOCK_POLICY_ID: {
            MOCK_TOKEN_NAMES[0]: a1 - b1,
            MOCK_TOKEN_NAMES[1]: a2 - b2,
            MOCK_TOKEN_NAMES[2]: a3 - b3,
            MOCK_TOKEN_NAMES[3]: a4 - b4,
        }
    }
    assert subtract_value_offchain(a, b) == res_value
