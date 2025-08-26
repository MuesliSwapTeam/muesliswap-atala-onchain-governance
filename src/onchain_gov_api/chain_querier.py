"""
The main file containing the logic for starting the querier.
The querier syncs with the blockchain, listening for new blocks and updating the database accordingly.
"""
import logging

import fire
from muesliswap_onchain_governance.api.tx_processor import process_tx

from ..utils.network import ogmios_url
from . import ogmios
from .db_models import Block


def main(rollback_to_slot: int = None, debug_sql: bool = False):
    """
    Start the querier.
    """
    if debug_sql:
        logger = logging.getLogger("peewee")
        logger.addHandler(logging.StreamHandler())
        logger.setLevel(logging.DEBUG)

    print("Starting the querier")
    sync_blocks = (
        [
            Block.select().order_by(Block.slot.desc()).first(),
            Block.select().order_by(Block.slot.desc()).offset(1).first(),
            Block.select().order_by(Block.slot.desc()).offset(5).first(),
            Block.select().order_by(Block.slot.desc()).offset(50).first(),
            Block.select().order_by(Block.slot.desc()).offset(1000).first(),
        ]
        if rollback_to_slot is None
        else [
            Block.select()
            .where(Block.slot <= rollback_to_slot)
            .order_by(Block.slot.desc())
            .first()
        ]
    )

    for operation in ogmios.OgmiosIterator(ogmios_url).iterate_blocks(
        [
            ogmios.Point(slot=block.slot, id=block.hash)
            for block in sync_blocks
            if block is not None
        ]
    ):
        if isinstance(operation, ogmios.Rollback):
            if isinstance(operation.tip, ogmios.Origin):
                print("Rollback to origin")
                Block.delete().execute()
                continue
            else:
                print("Rollback to tip", operation.tip)
                Block.delete().where(Block.slot > operation.tip.slot).execute()
                continue
        else:
            block = ogmios.tip_from_block(operation.block)
            db_block = Block(hash=block.id, slot=block.slot, height=block.height)
            db_block.save()
            try:
                for tx in ogmios.txs_from_block(operation.block):
                    process_tx(tx, db_block)
            except Exception as e:
                print(f"Error processing block {block.id}: {e}")
                db_block.delete_instance()
                raise


if __name__ == "__main__":
    fire.Fire(main)
