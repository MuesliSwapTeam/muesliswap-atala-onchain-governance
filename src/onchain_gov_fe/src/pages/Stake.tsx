// Stake.tsx
import { FC, useEffect, useState } from "react"
import {
  Box,
  Heading,
  Text,
  VStack,
  Spinner,
  Flex,
  Button,
  useDisclosure,
  useColorModeValue,
} from "@chakra-ui/react"
import LockTokensModal from "../components/Staking/LockTokensModal"
import UnlockTokensModal from "../components/Staking/UnlockTokensModal"
import StakingTable from "../components/Staking/StakingTable"

import { getGovernanceTokenBalance, getWalletAddress } from "../cardano/wallet"
import { formatNumber, fromNativeAmount } from "../utils/numericHelpers"
import {
  GOV_TOKEN_DECIMALS,
  GOV_TOKEN_NAME_HEX,
  GOV_TOKEN_POLICY_ID,
  GOV_TOKEN_SYMBOL,
} from "../cardano/config"
import { Asset } from "../api/model/common"
import { skipToken } from "@reduxjs/toolkit/query/react"
import useWalletContext from "../context/wallet"
import { StakingPosition } from "../api/model/staking"
import { useGetStakingPositionsQuery } from "../api/stakingApi"

export const getStakedAmount = (funds: Asset[]) => {
  funds = funds.filter(
    (x) =>
      x.policy_id === GOV_TOKEN_POLICY_ID &&
      x.asset_name === GOV_TOKEN_NAME_HEX,
  )
  if (funds.length === 0) return "0"
  return formatNumber(
    fromNativeAmount(funds[0].amount, GOV_TOKEN_DECIMALS),
    GOV_TOKEN_DECIMALS,
  )
}

const displayLockDate = (
  unlockDate: Date,
  voteEndedMessage: boolean = false,
) => {
  const now = new Date()
  if (unlockDate <= now) {
    if (!voteEndedMessage) return "-"
    return "Voting Period Ended"
  }
  return `${unlockDate.toLocaleDateString()} ${unlockDate.toLocaleTimeString(
    [],
    {
      hour: "2-digit",
      minute: "2-digit",
    },
  )}`
}

const Stake: FC = () => {
  const { isConnected } = useWalletContext()
  const [walletAddressHex, setWalletAddressHex] = useState<string | null>(null)
  const [selectedStakePosition, setSelectedStakePosition] =
    useState<StakingPosition | null>(null)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [expandedPositionIndex, setExpandedPositionIndex] = useState<
    number | null
  >(null)
  const [balance, setBalance] = useState(0)

  // Effects
  useEffect(() => {
    if (!isConnected) return

    const updateBalance = () => {
      getGovernanceTokenBalance().then((b) => {
        setBalance(fromNativeAmount(b, GOV_TOKEN_DECIMALS).toNumber())
      })
    }

    updateBalance()
    const interval = setInterval(updateBalance, 1000)
    return () => clearInterval(interval)
  }, [isConnected])

  useEffect(() => {
    const fetchWalletAddress = async () => {
      try {
        const address = await getWalletAddress()
        setWalletAddressHex((prevAddress) =>
          prevAddress !== address ? address : prevAddress,
        )
      } catch (error) {
        console.error("Failed to fetch wallet address", error)
      }
    }
    if (isConnected) {
      fetchWalletAddress()
    }
  }, [isConnected])

  // Data fetching
  const {
    data: stakingPositions = [],
    isLoading,
    isUninitialized,
  } = useGetStakingPositionsQuery(
    walletAddressHex ? { wallet: walletAddressHex } : skipToken,
  )

  // Handlers
  const handleUnlockClick = (position: StakingPosition) => {
    setSelectedStakePosition(position)
  }

  const handleCloseUnlockModal = () => {
    setSelectedStakePosition(null)
  }

  // Styles
  const bgColor = useColorModeValue("background.light", "background.dark")
  const disabledColor = useColorModeValue("grays.300.dark", "grays.600.dark")

  return (
    <Box m="24px 16px" sx={{ textAlign: "start" }}>
      <VStack align="start" spacing={4} w="100%">
        <Flex justify="space-between" align="center" w="100%" gap={10}>
          {/* Description Box */}
          <Box>
            <Heading as="h2" size="lg">
              Tokens Locked for DAO Voting
            </Heading>
            <Text fontSize="md">
              Here you can see your locked token positions which you can use to
              participate in DAO votings.
            </Text>
          </Box>

          {/* Balance Box */}
          {isConnected && (
            <Box
              bg={bgColor}
              p={4}
              borderRadius="md"
              boxShadow="md"
              borderWidth="1px"
              textAlign="left"
            >
              <Text fontSize="md">
                <b>{GOV_TOKEN_SYMBOL} Balance:</b> {balance}
              </Text>
              <Button
                width="100%"
                onClick={onOpen}
                isDisabled={balance <= 0}
                mt={2}
                bg={balance <= 0 ? disabledColor : undefined}
                _disabled={{ cursor: "not-allowed" }}
              >
                Lock {GOV_TOKEN_SYMBOL}
              </Button>
            </Box>
          )}
        </Flex>

        {/* LockTokensModal */}
        <LockTokensModal isOpen={isOpen} onClose={onClose} balance={balance} />

        {/* Stake Positions Table */}
        {isLoading || (isUninitialized && isConnected) ? (
          <Flex justify="center" align="center" w="100%" h="20vh">
            <Spinner size="xl" />
          </Flex>
        ) : stakingPositions.length > 0 ? (
          <Box
            bg={bgColor}
            p={4}
            borderRadius="md"
            boxShadow="md"
            borderWidth="1px"
            width="100%"
            overflowX="auto"
          >
            <StakingTable
              stakingPositions={stakingPositions}
              expandedPositionIndex={expandedPositionIndex}
              setExpandedPositionIndex={setExpandedPositionIndex}
              handleUnlockClick={handleUnlockClick}
              displayLockDate={displayLockDate}
              getStakedAmount={getStakedAmount}
            />
          </Box>
        ) : (
          <Box
            bg={bgColor}
            p={4}
            borderRadius="md"
            boxShadow="md"
            borderWidth="1px"
            width="100%"
            textAlign="center"
          >
            <Text fontSize="md">
              {isConnected ? (
                <b>
                  Currently no tokens locked. Lock {GOV_TOKEN_SYMBOL} to
                  participate in DAO governance.
                </b>
              ) : (
                <b>
                  Connect your wallet to see your currently locked{" "}
                  {GOV_TOKEN_SYMBOL} and stake more.
                </b>
              )}
            </Text>
          </Box>
        )}
      </VStack>

      {/* UnlockTokensModal */}
      {selectedStakePosition && (
        <UnlockTokensModal
          isOpen={!!selectedStakePosition}
          onClose={handleCloseUnlockModal}
          position={selectedStakePosition}
        />
      )}
    </Box>
  )
}

export default Stake
