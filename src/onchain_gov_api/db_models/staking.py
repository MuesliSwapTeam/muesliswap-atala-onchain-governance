from .db import *


class StakingParams(BaseModel):
    owner = ForeignKeyField(Address, backref="staking_params")
    governance_token = ForeignKeyField(Token, backref="staking_params")
    vault_ft_policy = PolicyId()
    tally_auth_nft = ForeignKeyField(Token, backref="staking_params")


class StakingState(OutputStateModel):
    """
    Mirrors the current status of the on-chain staking state
    """

    staking_params = ForeignKeyField(StakingParams, backref="staking_states")
    pass


class StakingParticipation(BaseModel):
    """
    Tracks the participation of a staking state in proposals
    """

    tally_auth_nft = ForeignKeyField(Token, backref="staking_participations")
    proposal_id = IntegerField()
    weight = IntegerField()
    proposal_index = IntegerField()
    end_time = DateTimeField()


class StakingParticipationInStaking(BaseModel):
    """
    Tracks at which index a staking participation is stored in which staking state
    This design allows also to reconstruct past participations of a user and naturally avoids duplication
    of Participations in the DB
    """

    staking_state = ForeignKeyField(StakingState, backref="staking_participations")
    participation = ForeignKeyField(
        StakingParticipation, backref="staking_participations"
    )
    index = IntegerField()


class VotePermission(BaseModel):
    """
    Models tokens that express the right to perform a vote
    Find the vote permissions of a staking state by following the token backref
    """

    token = ForeignKeyField(Token, backref="vote_permissions")
    delegated_action = ForeignKeyField(Datum, backref="vote_permissions")


class VaultFt(BaseModel):
    """
    Models tokens that track the value of a vault position and represent it in staking
    """

    token = ForeignKeyField(Token, backref="vault_fts")
    release_time = DateTimeField()


class StakingDeposit(TransActionModel):
    """
    Models the deposit or withdrawal of funds into/from a staking state
    """

    prev_staking_state = ForeignKeyField(
        StakingState, backref="staking_deposits_prev", null=True
    )
    next_staking_state = ForeignKeyField(StakingState, backref="staking_deposits_next")


class VotePermissionMint(TransActionModel):
    """
    Models the minting of vote permissions
    Note these might not go to the staking state directly but to the owner of the staking state or someone else
    """

    vote_permission = ForeignKeyField(VotePermission, backref="vote_permission_mints")
    output = ForeignKeyField(TransactionOutput, backref="vote_permission_mints")
