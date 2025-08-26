from .db import *


class LicenseMint(TransActionModel):
    """
    Mirrors the current status of the on-chain license
    """

    license_nft = ForeignKeyField(Token, backref="licenses")
    expiration_date = DateTimeField()


class LicenseOwner(BaseModel):
    """
    Tracks the ownership of a license
    Note that the ownership may not always be traced back unambiguously to a single mint
    This itself should however be quite shady and would be avoided by trust-depending batchers
    """

    output = ForeignKeyField(TransactionOutput, backref="license_owners")
    license_mint = ForeignKeyField(LicenseMint, backref="license_owners")
