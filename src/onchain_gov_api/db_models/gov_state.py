from .db import *


class GovParams(BaseModel):
    tally_address = ForeignKeyField(Address, backref="gov_states")
    staking_address = ForeignKeyField(Address, backref="gov_states")
    governance_token = ForeignKeyField(Token, backref="gov_states")
    vault_ft_policy = PolicyId()
    min_quorum = IntegerField()
    min_proposal_duration = IntegerField()
    gov_state_nft = ForeignKeyField(Token, backref="gov_states")
    tally_auth_nft_policy = PolicyId()
    staking_vote_nft_policy = PolicyId()
    latest_applied_proposal_id = IntegerField()


class GovState(OutputStateModel):
    """
    Mirrors the current status of the on-chain governance state
    """

    last_proposal_id = IntegerField()
    gov_params = ForeignKeyField(GovParams, backref="gov_states")


class GovCreation(TransActionModel):
    """
    Model the creation of a governance state
    """

    next_gov_state = ForeignKeyField(GovState, backref="gov_creations_next")


class GovUpgrade(TransActionModel):
    """
    Model the upgrade of the governance state
    """

    prev_gov_state = ForeignKeyField(GovState, backref="gov_upgrades_prev")
    next_gov_state = ForeignKeyField(GovState, backref="gov_upgrades_next")
