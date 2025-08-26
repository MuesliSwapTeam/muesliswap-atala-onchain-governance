import { FC, useEffect, useState } from "react"
import {
  Box,
  Heading,
  Table,
  TableContainer,
  Tbody,
  Text,
  Thead,
  Tr,
  Td,
  Th,
  Button,
  VStack,
  useColorModeValue,
  Tooltip,
  Flex,
  IconButton,
  Link,
  Spinner,
  useDisclosure,
} from "@chakra-ui/react"
import { InfoIcon } from "@chakra-ui/icons"
import LockTokensModal from "../components/LockTokensModal"
import UnlockTokensModal from "../components/UnlockTokensModal" // Import the new modal component

import { getGovernanceTokenBalance, getWalletAddress } from "../cardano/wallet"
import { formatNumber, fromNativeAmount } from "../utils/numericHelpers"
import {
  GOV_TOKEN_DECIMALS,
  GOV_TOKEN_NAME_HEX,
  GOV_TOKEN_POLICY_ID,
} from "../cardano/config"
import { Asset } from "../api/model/common"
import { skipToken } from "@reduxjs/toolkit/query/react" // Import skipToken if it's not already imported
import useWalletContext from "../context/wallet"
import { StakingPosition } from "../api/model/staking"
import { useGetStakingPositionsQuery } from "../api/stakingApi"

const Stake: FC = () => {
  const { isConnected } = useWalletContext()

  const [walletAddressHex, setWalletAddressHex] = useState<string | null>(null)
  const [selectedStakePosition, setSelectedStakePosition] =
    useState<StakingPosition | null>(null) // Track selected stake position for unlocking
  const { isOpen, onOpen, onClose } = useDisclosure()

  const [balance, setBalance] = useState(0)
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
        let address = await getWalletAddress()
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

  const {
    data: stakingPositions = [],
    isLoading,
    isUninitialized,
  } = useGetStakingPositionsQuery(
    walletAddressHex ? { wallet: walletAddressHex } : skipToken,
  )

  const getAmount = (funds: Asset[]) => {
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

  const handleLockTokens = async (amount: number) => {
    console.log("Locked amount:", amount)
    // Add your logic for locking tokens here
    return "asdf"
  }

  const getUnlockDate = (participations: any[]) => {
    if (participations.length === 0) {
      return "-"
    }
    const maxEndTime = Math.max(
      ...participations.map((p) => Number(p.end_time)),
    )
    const unlockDate = new Date(maxEndTime)
    const now = new Date()
    if (unlockDate <= now) {
      return "-"
    }
    return `${unlockDate.toLocaleDateString()} ${unlockDate.toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit",
      },
    )}`
  }

  const handleUnlockClick = (position: StakingPosition) => {
    setSelectedStakePosition(position)
  }

  const handleCloseUnlockModal = () => {
    setSelectedStakePosition(null)
  }

  const bgColor = useColorModeValue("background.light", "background.dark")
  const bgSecColor = useColorModeValue(
    "backgroundSecondary.light",
    "backgroundSecondary.dark",
  )
  const textColor = useColorModeValue("text.light", "text.dark")
  const textSubtleColor = useColorModeValue(
    "textSubtle.light",
    "textSubtle.dark",
  )
  const disabledColor = useColorModeValue("grays.200.light", "grays.800.dark")

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
          <Box
            bg={bgColor}
            p={4}
            borderRadius="md"
            boxShadow="md"
            borderWidth="1px"
            textAlign="left"
          >
            <Text fontSize="md">
              <b>MILK Balance:</b> {balance}
            </Text>
            <Button
              width="100%"
              onClick={onOpen}
              isDisabled={balance <= 0}
              mt={2}
              bg={balance <= 0 ? disabledColor : undefined}
              _disabled={{ cursor: "not-allowed" }}
            >
              Lock Milk
            </Button>
          </Box>
        </Flex>

        {/* LockTokensModal */}
        <LockTokensModal
          isOpen={isOpen}
          onClose={onClose}
          onLock={handleLockTokens}
          balance={balance}
        />

        {/* Stake Positions Table */}
        {isLoading || isUninitialized ? (
          <Flex justify="center" align="center" w="100%" h="20vh">
            <Spinner size="xl" />
          </Flex>
        ) : stakingPositions.length > 0 ? (
          <TableContainer
            bg={bgColor}
            p={4}
            borderRadius="md"
            boxShadow="md"
            borderWidth="1px"
            width="100%"
            overflowX="auto"
          >
            <Table variant="simple">
              <Thead bg={bgSecColor}>
                <Tr _hover={{ bg: bgSecColor }}>
                  <Th>Name</Th>
                  <Th>
                    <Flex align="center">
                      Amount
                      <Tooltip
                        label="This is the amount of MILK tokens and sMILK tokens that are currently locked"
                        aria-label="Available info"
                      >
                        <IconButton
                          color={textSubtleColor}
                          aria-label="Info"
                          icon={<InfoIcon />}
                          size="sm"
                          mb="1px"
                          variant="ghost"
                        />
                      </Tooltip>
                    </Flex>
                  </Th>
                  <Th>
                    <Flex align="center">
                      Unlock date
                      <Tooltip
                        label="This shows the date at which the tokens can be unlocked. It depends on the last active vote you are participating in. To unlock earlier please deregister your active votes."
                        aria-label="Locked info"
                      >
                        <IconButton
                          color={textSubtleColor}
                          aria-label="Info"
                          icon={<InfoIcon />}
                          size="sm"
                          mb="1px"
                          variant="ghost"
                        />
                      </Tooltip>
                    </Flex>
                  </Th>
                  <Th>Transaction Hash</Th>
                  <Th>Action</Th>
                </Tr>
              </Thead>
              <Tbody>
                {stakingPositions.map(
                  (position: StakingPosition, index: number) => {
                    const unlockDate = getUnlockDate(position.participations)
                    const isUnlocked = unlockDate === "-"

                    return (
                      <Tr key={index} _hover={{ bg: bgSecColor }}>
                        <Td>
                          <Text color={textColor}>Position {index + 1}</Text>
                        </Td>
                        <Td>
                          <Text color={textColor}>
                            {getAmount(position.funds)}
                          </Text>
                        </Td>
                        <Td>
                          <Text color={textColor}>{unlockDate}</Text>
                        </Td>
                        <Td>
                          <Link
                            color="teal.500"
                            href={`https://preprod.cardanoscan.io/transaction/${position.transaction_hash}`}
                            isExternal
                          >
                            {position.transaction_hash.slice(0, 6)}...
                            {position.transaction_hash.slice(-6)}
                          </Link>
                        </Td>
                        <Td>
                          <Button
                            width="9em"
                            isDisabled={!isUnlocked}
                            bg={!isUnlocked ? disabledColor : undefined}
                            _disabled={{ cursor: "not-allowed" }}
                            onClick={() => handleUnlockClick(position)}
                          >
                            Unlock
                          </Button>
                        </Td>
                      </Tr>
                    )
                  },
                )}
              </Tbody>
            </Table>
          </TableContainer>
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
              <b>
                Currently no tokens locked. Lock MILK to participate in DAO
                governance.
              </b>
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
