from .db import *
from .gov_state import GovState


class TreasurerParams(BaseModel):
    auth_nft = ForeignKeyField(Token, backref="treasurer_params")
    value_store = ForeignKeyField(Address, backref="treasurer_params")
    treasurer_nft = ForeignKeyField(Token, backref="treasurer_params")


class TreasurerState(OutputStateModel):
    """
    Mirrors the current status of the on-chain treasurer
    """

    last_applied_proposal_id = IntegerField()
    treasurer_params = ForeignKeyField(TreasurerParams, backref="treasurer_states")


class ValueStoreState(OutputStateModel):
    """
    Mirrors the current status of funds in the value store
    """

    treasurer_nft = ForeignKeyField(Token, backref="value_store_states")


class TreasuryDeposit(TransActionModel):
    """
    Model the deposit of funds into the value store
    """

    pass


class TreasuryDepositValue(BaseModel):
    """
    Model the value of a deposit
    """

    treasury_deposit = ForeignKeyField(
        TreasuryDeposit, backref="treasury_deposit_values"
    )
    token = ForeignKeyField(Token, backref="treasury_deposit_values")
    value = IntegerField()


class TreasuryPayout(TransActionModel):
    """
    Model the payout of funds from the value store
    """

    treasurer_state = ForeignKeyField(TreasurerState, backref="treasury_payouts")


class TreasuryPayoutValue(BaseModel):
    """
    Model the value of a payout
    """

    treasury_payout = ForeignKeyField(TreasuryPayout, backref="treasury_payout_values")
    token = ForeignKeyField(Token, backref="treasury_payout_values")
    value = IntegerField()
