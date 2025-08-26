import pycardano
from ..db_models import Address


def from_address(address: Address) -> pycardano.Address:
    """
    Convert an address from the database to a pycardano address.
    """
    return pycardano.Address.from_primitive(bytes.fromhex(address.address_raw))
