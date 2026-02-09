from opshin.prelude import *

def validator(d, r, ctx: ScriptContext):
    assert (
        bytes.fromhex("36a95f079e147692ff9abe712c1393a59b161752541291972a763074")
        in ctx.tx_info.signatories
    ), "Signer did not sign transaction"
    purpose = ctx.purpose
    assert isinstance(purpose, Minting), "Invalid purpose"