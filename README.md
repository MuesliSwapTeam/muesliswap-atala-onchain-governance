# DAO Governance: MuesliSwap x Atala PRISM

This repository contains the documentation and code for the implementation
of the project DAO Governance x Atala PRISM, proposed by the MuesliSwap team
in Fund 10 of Project Catalyst [1].

## Structure

### Report

The directory `report` contains a detailed report of our research results, design sketch,
and implementation strategy as promised for Milestone 1 of the project.

### Atala PRISM Authenticanion NFT Minting Tool (Milestone 1)

The directory `src/auth_nft_minting_tool` contains the source code for
 - `frontend`: a Atala PRISM authentication NFT minting tool that uses ProofSpace authentication
 - `hook`: a server that hosts an endpoint to be called by ProofSpace for receiving credentials and storing them in a DB
 - `server`: serving the backend used by `frontend` for connecting with the user DID DB populated by `hook`
 - `onchain`: the [OpShin](https://github.com/OpShin) contract used as a minting script for the DID authentication NFT
 - `test`: contains unit and interaction tests for the `hook` and `server` components (and their interaction)

### Treasury & On-Chain Governance Smart Contracts (Milestone 2)

The directory `src/treasury-onchain-voting/contracts` contains the source code for
 - `onchain`: the OpShin smart contracts for the on-chain treasury and governance system, and
 - `offchain`: the off-chain scripts for deploying and interacting with the contracts in `onchain`.


## Run Instructions

### Running Tests for the Atala PRISM Authentication NFT Minting Tool

To setup the environment and running the tests provided in `test`, please first start the `server` via:
```bash
cd src/auth_nft_minting_tool/server
npm install
node server.js test
```
Then, in a separate terminal, run the hook server via:
```bash
cd src/auth_nft_minting_tool
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cd hook
python server.py
```
Then, in another separate terminal, run the tests via:
```bash
cd src/auth_nft_minting_tool
source .venv/bin/activate
python -m test.tests
```
Ideally, all three test runs should pass without errors (or warnings).


### Instructions for Interacting with the Treasury & On-Chain Governance Smart Contracts

The system can be initialized by deploying the smart contracts in the `onchain` directory using the scripts provided in the `offchain` directory.
For this, you need to have an Ogmios endpoint available and set the environment variables `OGMIOS_API_HOST`, `OGMIOS_API_PROTOCOL` and `OGMIOS_API_PORT` to the respective values (default `localhost`, `ws` and `1337`).
Further, install the current project.

```bash
cd treasury-onchain-voting
poetry install
```

Create and fund two wallets for the DAO administration and for voting.
You can use the [testnet faucet](https://docs.cardano.org/cardano-testnet/tools/faucet/) to fund them, make sure to select `preprod` network!.

```bash
python3 -m contracts.create_key_pair creator
python3 -m contracts.create_key_pair voter
```

Then, build the smart contracts. Note that this requires the [`plutonomy-cli`](https://github.com/OpShin/plutonomy-cli) executable present in the `PATH` environment variable.

```bash
python3 -m contracts.build
``` 

Create a governance thread using the `creator` wallet.

```bash
python3 -m contracts.offchain.gov_state.init --wallet creator --governance_token bd976e131cfc3956b806967b06530e48c20ed5498b46a5eb836b61c2.744d494c4b
```

This will create a new governance thread and print the thread id. You can use this thread id to interact with the governance system.
For convenience, you can update the `GOV_STATE_NFT_TK_NAME` in `contracts/offchain/util.py` to the thread id.
Next, you can create a tally using the `creator` wallet.

```bash
python3 -m contracts.offchain.gov_state.create_tally --wallet creator
```

The default for this tally is to open for 10 minutes and allow choosing between a treasury payout to `voter` and a license mint.
> Note: in a production environment you would never want a tally with expiry date for licenses, as this would allow for a license to be minted indefinitely.
Next, you can register the `voter` wallet as a voter by locking the governance tokens in the staking contract and using the stake to vote.

```bash
python3 -m contracts.offchain.staking.init --wallet voter
python3 -m contracts.offchain.tally.add_vote_tally --wallet voter --proposal_id 1 --proposal_index 1
```

This will lock the governance tokens in the staking contract and use the stake to vote for the second (index 1) proposal in the first tally.
This proposal empowers the DAO to a treasury payout to the `voter` wallet.
After the proposal ended (i.e. default 10 minutes), you can execute the tally using any wallet.
For this you need to first initialize the treasury (again for convenience update the `TREASURER_STATE_NFT_TK_NAME`), deposit funds and then execute the tally.

```bash
python3 -m contracts.offchain.treasury.init --wallet creator
python3 -m contracts.offchain.treasury.deposit --wallet creator
python3 -m contracts.offchain.treasury.payout --wallet voter
```


# Demos

## Atala PRISM Authentication NFT Minting Tool

A hosted version of this authentication NFT minting tool can be found at [demo.did.muesliswap.com](https://demo.did.muesliswap.com).
Here's a video of a live demo: [Catalyst Milestone: Atala Prism DID Authentication DEMO](https://www.youtube.com/watch?v=p4tGIZlP1pw).

## Treasury & On-Chain Governance Smart Contracts

We provide the following references to `preprod` testnet transactions showing relevant smart contracts interactions:

- [ ] TODO




[1]: [DAO Governance x Atala PRISM - By MuesliSwap](https://projectcatalyst.io/funds/10/f10-atala-prism-launch-ecosystem/dao-governance-x-atala-prism-by-muesliswap)