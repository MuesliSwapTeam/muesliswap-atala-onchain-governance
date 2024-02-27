DAO Governance: MuesliSwap x Atala PRISM
----------------------------------------

This repository contains the documentation and code for the implementation
of the project DAO Governance x Atala PRISM, proposed by the MuesliSwap team
in Fund 10 of Project Catalyst [1].

### Structure

The directory `report` contains a detailed report of our research results, design sketch,
and implementation strategy as promised for Milestone 1 of the project.

The directory `src` contains the source code for
 - `frontend`: a Atala PRISM authentication NFT minting tool that uses ProofSpace authentication
 - `hook`: a server that hosts an endpoint to be called by ProofSpace for receiving credentials and storing them in a DB
 - `server`: serving the backend used by `frontend` for connecting with the user DID DB populated by `hook`
 - `onchain`: the [OpShin](https://github.com/OpShin) contract used as a minting script for the DID authentication NFT

# Demo

A hosted version of this authentication NFT minting tool can be found at [demo.did.muesliswap.com](https://demo.did.muesliswap.com).
Here's a video of a live demo: [Catalyst Milestone: Atala Prism DID Authentication DEMO](https://www.youtube.com/watch?v=p4tGIZlP1pw).

[1]: [DAO Governance x Atala PRISM - By MuesliSwap](https://projectcatalyst.io/funds/10/f10-atala-prism-launch-ecosystem/dao-governance-x-atala-prism-by-muesliswap)