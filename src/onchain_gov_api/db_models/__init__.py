from .db import (
    Block,
    Address,
    Datum,
    Token,
    TransactionOutput,
    TransactionOutputValue,
    sqlite_db,
)
from .gov_state import GovState, GovParams
from .tally_state import TallyState, TallyProposals, TallyParams, TallyWeights
from .treasury import TreasurerParams, TreasurerState, ValueStoreState
from .staking import StakingState, StakingParams, StakingParticipation, VotePermission

sqlite_db.connect()
sqlite_db.create_tables(
    [
        Block,
        Address,
        Datum,
        Token,
        TransactionOutput,
        TransactionOutputValue,
        GovParams,
        GovState,
        TallyState,
        TallyParams,
        TallyProposals,
        TallyWeights,
        TreasurerParams,
        TreasurerState,
        ValueStoreState,
        StakingParams,
        StakingState,
        StakingParticipation,
        VotePermission,
    ]
)
