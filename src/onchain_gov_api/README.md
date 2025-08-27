# **DAO Governance Backend**

## **Installation & Setup**  

To run the querier and API on localhost, follow these steps:

1. **Clone the repository and change directory:**
   ```sh
   git clone https://github.com/MuesliSwapTeam/muesliswap-atala-onchain-governance.git
   cd muesliswap-atala-onchain-governance/src/onchain_gov_api
   ```

2. **Install dependencies:**  
   ```sh
   poetry install
   ```

3. **Run the chain querier:**
   Note that in order for the querier to build the database with actual onchain data, an ogmios instance must be running on `localhost` at port `1337` (or whatever else is configured in `utils/network.py`). Otherwise the querier will still run but the resulting database will be empty.

   ```sh
   poetry shell
   python3 -m api_backend.chain_querier
   ```

4. **Start the API server (in a separate shell):**
    ```sh
    poetry shell
    uvicorn api_backend.server:app --host localhost --port 8001
    ```

    To check out the available endpoints, have a look at [http://localhost:8001/docs](http://localhost:8001/docs).