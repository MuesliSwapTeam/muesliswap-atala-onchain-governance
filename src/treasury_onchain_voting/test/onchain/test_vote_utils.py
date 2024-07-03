import time
from hypothesis import given, strategies as st

from contracts.onchain.util import *


MOCK_POLICY_ID = b"c881c20e49dbaca3ff6cef365969354150983230c39520b917f5cf7c"
MOCK_TOKEN_NAME = b"4d494c4b"
MOCK_PARTICIPATION = Participation(
    tally_auth_nft=Token(MOCK_POLICY_ID, MOCK_TOKEN_NAME),
    proposal_id=42,
    weight=1,
    proposal_index=0,
    end_time=FinitePOSIXTime(time.time() * 1000),
)


@given(
    list_len=st.integers(),
    rm_idx=st.integers(),
)
def test_remove_participation_at_index(
    list_len: int,
    rm_idx: int,
) -> None:
    participations = [MOCK_PARTICIPATION] * list_len
    try:
        shortened = remove_participation_at_index(participations, rm_idx)
        assert len(shortened) == list_len - 1
    except AssertionError:
        assert not (0 <= rm_idx < list_len)


@given(
    list_len=st.integers(min_value=0, max_value=100),
    rm_idx=st.integers(min_value=0, max_value=100),
)
def test_remove_participation_at_index(
    list_len: int,
    rm_idx: int,
) -> None:
    participations = [MOCK_PARTICIPATION] * list_len
    try:
        shortened = remove_participation_at_index(participations, rm_idx)
        assert len(shortened) == list_len - 1
    except AssertionError:
        assert not (0 <= rm_idx < list_len)


@given(
    vote_deadline=st.integers(),
    validity_start=st.integers(),
    validity_end=st.integers(),
)
def test_vote_has_ended(
    vote_deadline: int,
    validity_start: int,
    validity_end: int,
) -> None:
    assert vote_has_ended(
        FinitePOSIXTime(vote_deadline), make_range(validity_start, validity_end)
    ) == (vote_deadline < validity_start)
