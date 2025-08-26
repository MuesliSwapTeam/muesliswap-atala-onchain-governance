import peewee
import pycardano
from ..db_models import Block, TransactionOutput

from .staking import process_tx as process_staking_tx


def process_tx(tx: pycardano.Transaction, block: Block):
    """
    Process a transaction and update the database accordingly.
    """

    # mark all inputs to the transaction as spent
    spent_inputs = [
        (_input.transaction_id.payload.hex(), _input.index)
        for i, _input in enumerate(tx.transaction_body.inputs)
    ]
    TransactionOutput.update(spent_in_block=block).where(
        peewee.Tuple(
            TransactionOutput.transaction_hash, TransactionOutput.output_index
        ).in_(spent_inputs)
    ).execute()

    # model specific processing
    process_staking_tx(tx, block)
    pass
