from .db import *
from .gov_state import GovState
from .staking import StakingState


class TallyParams(BaseModel):
    quorum = IntegerField()
    end_time = DateTimeField()
    proposal_id = IntegerField()
    tally_auth_nft = ForeignKeyField(Token, backref="tally_params")
    staking_vote_nft_policy = PolicyId()
    staking_address = ForeignKeyField(Address, backref="tally_params")
    governance_token = ForeignKeyField(Token, backref="tally_params")
    vault_ft_policy = PolicyId()


class TallyProposals(BaseModel):
    tally_params = ForeignKeyField(TallyParams, backref="tally_proposals")
    index = IntegerField()
    proposal = ForeignKeyField(Datum, backref="tally_proposals")


class TallyState(OutputStateModel):
    """
    Mirrors the current status of the on-chain tally state
    """

    tally_params = ForeignKeyField(TallyParams, backref="tally_states")


class TallyWeights(BaseModel):
    """
    Mirrors the current status of the on-chain governance state
    """

    tally_state = ForeignKeyField(TallyState, backref="tally_votes")
    index = IntegerField()
    weight = IntegerField()


class TallyVote(TransActionModel):
    """
    Model the vote of a staking state
    """

    staking_state = ForeignKeyField(GovState, backref="tally_votes")
    index = IntegerField()
    weight_delta = IntegerField()


class TallyCreation(TransActionModel):
    """
    Model the creation of a tally state
    """

    gov_state = ForeignKeyField(GovState, backref="tally_creations")
    next_tally_state = ForeignKeyField(TallyState, backref="tally_creations_next")


class TallyCreationParticipants(BaseModel):
    """
    Model the participation of an address in the creation of a tally state
    """

    tally_creation = ForeignKeyField(
        TallyCreation, backref="tally_creation_participants"
    )
    address = ForeignKeyField(Address, backref="tally_creation_participations")
