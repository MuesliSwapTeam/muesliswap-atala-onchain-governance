import cbor2

import pycardano
from ..db_models import (
    TransactionOutputValue,
    TransactionOutput,
    Address,
    Datum,
    Token,
    Block,
)


def add_address(address: pycardano.Address) -> Address:
    """
    Store the address in the database.
    """
    return Address.get_or_create(address_raw=address.to_primitive().hex())[0]


def add_datum(datum: pycardano.Datum) -> Datum:
    """
    Store the datum in the database.
    """
    return Datum.get_or_create(
        hash=pycardano.datum_hash(datum).to_primitive().hex(),
        data=cbor2.dumps(datum, default=pycardano.default_encoder),
    )[0]


def add_token_raw(policy_id: bytes, asset_name: bytes) -> Token:
    """
    Store the token in the database.
    """
    return Token.get_or_create(
        policyId=policy_id.hex(),
        assetName=asset_name.hex(),
    )[0]


def add_token(
    policy_id: pycardano.ScriptHash, asset_name: pycardano.AssetName
) -> Token:
    """
    Store the token in the database.
    """
    return add_token_raw(policy_id.to_primitive(), asset_name.to_primitive())


def add_output(
    tx_output: pycardano.TransactionOutput,
    index: int,
    transaction_hash: str,
    block: Block,
) -> TransactionOutput:
    """
    Store the value of the output in the database.
    """
    if tx_output.datum is not None:
        datum_hash = add_datum(tx_output.datum).hash
    elif tx_output.datum_hash is not None:
        datum_hash = tx_output.datum_hash.to_primitive().hex()
    else:
        datum_hash = None
    output, existed = TransactionOutput.get_or_create(
        transaction_hash=transaction_hash,
        output_index=index,
        address=add_address(tx_output.address),
        datum_hash=datum_hash,
        block=block,
    )
    if existed:
        return output
    lovelace = tx_output.amount.coin
    TransactionOutputValue.create(
        transaction_output=output,
        token=add_token_raw(b"", b""),
        amount=lovelace,
    )
    for policy_id, d in tx_output.amount.multi_asset:
        for asset_name, amount in d.items():
            token = add_token(policy_id, asset_name)
            TransactionOutputValue.create(
                transaction_output=output, token=token, amount=amount
            )
    return output
