import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { Provider } from "react-redux"
import { Box } from "@chakra-ui/react"

import NavBar from "./components/NavBar"
/* import Footer from "./components/Footer" */

import "./App.css"
import WalletProvider from "./context/wallet/WalletProvider"
import { store } from "./store"

import HomePage from "./pages/HomePage"
import TreasuryPage from "./pages/Treasury"
import StakePage from "./pages/Stake"
import ProposalsListPage from "./pages/ProposalListPage"
import CreateProposalPage from "./pages/CreateProposal"
import ProposalDetailPage from "./pages/ProposalDetailPage"
import MatchmakerListPage from "./pages/MatchmakerListPage"
import MatchmakerDetailPage from "./pages/MatchmakerDetailPage"

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cardano: any
    BG_ANIMATE_WORKER_ID: number | null
  }
}

function App() {
  return (
    <Provider store={store}>
      <WalletProvider>
        <Router>
          <NavBar />
          <Box
            as="main" // uses App.css style for main
          >
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/matchmakers" element={<MatchmakerListPage />} />
              <Route
                path="/matchmakers/:authNft/:id"
                element={<MatchmakerDetailPage />}
              />
              <Route path="/stake" element={<StakePage />} />
              <Route path="/treasury" element={<TreasuryPage />} />
              <Route path="/proposals" element={<ProposalsListPage />} />
              <Route
                path="/proposals/create"
                element={<CreateProposalPage />}
              />
              <Route
                path="/proposals/:authNft/:id"
                element={<ProposalDetailPage />}
              />
            </Routes>
          </Box>
          {/*<Footer />*/}
        </Router>
      </WalletProvider>
    </Provider>
  )
}

export default App
