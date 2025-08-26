# **DAO Governance Backend**

## **Installation & Setup**  

To run the querier and API on localhost, follow these steps:

1. **Clone the repository:**  

2. **Install dependencies:**  
   ```sh
   poetry install
   ```

3. **Run the chain querier:**
   ```sh
   poetry shell
   python3 -m api_backend.api.chain_querier
   ```

4. **Start the API server (in a separate shell):**
    ```sh
    poetry shell
    uvicorn api_backend.api.server:app --host localhost --port 8001
    ```

    To check out the available endpoints, have a look at [http://localhost:8001/docs](http://localhost:8001/docs).