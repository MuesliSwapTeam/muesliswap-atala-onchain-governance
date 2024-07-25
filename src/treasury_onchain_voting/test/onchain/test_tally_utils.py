import time
from hypothesis import given, strategies as st
from typing import List

from contracts.onchain.tally.tally import *


@given(
    list=st.lists(
        elements=st.integers(min_value=0, max_value=1000),
        min_size=0,
        max_size=1000,
    ),
    index=st.integers(min_value=0, max_value=1000),
    weight=st.integers(min_value=0, max_value=1000),
)
def test_add_votes_to_index(
    list: List[int],
    index: int,
    weight: int,
) -> None:
    try:
        list_after = add_votes_to_index(list, index, weight)
        assert list_after == list[:index] + [list[index] + weight] + list[index + 1 :]
    except AssertionError:
        assert (not (0 <= index < len(list))) or (not (weight < 0))


@given(
    list=st.lists(
        elements=st.integers(min_value=0, max_value=1000),
        min_size=0,
        max_size=1000,
    ),
    index=st.integers(min_value=0, max_value=1000),
    weight=st.integers(min_value=0, max_value=1000),
)
def test_remove_votes_from_index(
    list: List[int],
    index: int,
    weight: int,
) -> None:
    try:
        list_after = remove_votes_from_index(list, index, weight)
        assert list_after == list[:index] + [list[index] - weight] + list[index + 1 :]
    except AssertionError:
        assert (not (0 <= index < len(list))) or (not (weight < 0))
