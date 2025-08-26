import pycardano
from pycardano import Network

from ..utils.contracts import module_name
from ..utils import network, contracts
from ..onchain.gov_state import gov_state_nft

_, gov_nft_policy_id, _ = contracts.get_contract(
    module_name(gov_state_nft), compressed=True
)
# TODO these actually follow from the definitions in the governance states
staking_address = pycardano.Address.from_primitive(
    "addr_test1wrhj8usqt7va509trnska54f20zu3kuys9sqexv0m2jh2gss45dw6"
)
vote_permission_nft_policy_id = pycardano.ScriptHash(
    bytes.fromhex("2b272d4b10be0c82863ba6be7d00fb0cb80cb02625dbb0b694edd8f1")
)

# default: start from a block around 10 feb 2024
start_block_slot = 51861111 if network == Network.TESTNET else 72316796
start_block_hash = (
    "68f44e02911cbb495ffc4e598630d048f7bca5ad005e08c22c064b5e9506e554"
    if network == Network.TESTNET
    else "c58a24ba8203e7629422a24d9dc68ce2ed495420bf40d9dab124373655161a20"
)
