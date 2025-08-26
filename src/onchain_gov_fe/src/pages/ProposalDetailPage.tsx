import { Link, useParams } from "react-router-dom"
import {
  Box,
  Heading,
  Text,
  Flex,
  useColorModeValue,
  Button,
  Tag,
  RadioGroup,
  Stack,
  Radio,
} from "@chakra-ui/react"
import React, { useState, useEffect } from "react"
import { useGetTallyDetailQuery } from "../api/tallyApi"
import { skipToken } from "@reduxjs/toolkit/query"
import { IoArrowBack } from "react-icons/io5"
import { TiDocument, TiKey, TiCog } from "react-icons/ti"
import { FaDollarSign, FaThumbsUp } from "react-icons/fa"
import { Proposal } from "../api/model/tally"
import VotesBarChart from "../components/VotesBarChart"
import { formatNumber } from "../utils/numericHelpers"
import ProposalBarChart from "../components/ProposalBarChart"
import { mintAddVotePermission } from "../cardano/staking/add_vote"
import { useGetStakingPositionsQuery } from "../api/stakingApi"
import useWalletContext from "../context/wallet"
import { getWalletAddress } from "../cardano/wallet"

const COLORS = [
  "#d62728",
  "#2ca02c",
  "#1f77b4",
  "#ff7f0e",
  "#9467bd",
  "#8c564b",
  "#e377c2",
  "#7f7f7f",
  "#bcbd22",
  "#17becf",
]

const getIconForType = (type: string) => {
  switch (type) {
    case "GovStateUpdate":
      return <TiDocument />
    case "LicenseRelease":
      return <TiKey />
    case "PoolUpgrade":
      return <TiCog />
    case "FundPayout":
      return <FaDollarSign />
    default:
      return <FaThumbsUp />
  }
}

const ProposalDetail: React.FC<{ proposal?: Proposal }> = ({ proposal }) => {
  const infoBgColor = useColorModeValue("gray.100", "gray.600")
  const detailBg = useColorModeValue(
    "backgroundSecondary.light",
    "backgroundSecondary.dark",
  )
  const textColor = useColorModeValue("text.light", "text.dark")
  const typeColor = useColorModeValue("gray.500", "gray.400")
  const borderColor = useColorModeValue("gray.200", "gray.600")
  const statusColor = useColorModeValue("textSubtle.light", "textSubtle.dark")
  const statusBaseColor =
    proposal?.status === "open" ? "greens.500" : "greys.500"
  const statusBgColor = useColorModeValue(
    `${statusBaseColor}.light`,
    `${statusBaseColor}.dark`,
  )

  const { isConnected } = useWalletContext()
  const [walletAddressHex, setWalletAddressHex] = useState<string | null>(null)

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
    isLoading: isStakingLoading,
    isUninitialized: isStakingUninitialized,
  } = useGetStakingPositionsQuery(
    walletAddressHex ? { wallet: walletAddressHex } : skipToken,
  )

  console.log("proposal", proposal)

  const handleOnClick = async () => {
    try {
      if (
        stakingPositions == undefined ||
        stakingPositions.length === 0 ||
        proposal === undefined
      )
        return

      console.log("funds", stakingPositions[0])

      // TODO: adjust vote and voting power
      const hash = await mintAddVotePermission(
        stakingPositions[0].funds.map((x) => {
          return {
            unit: x.policy_id === "" ? "lovelace" : x.policy_id + x.asset_name,
            quantity: Number(x.amount),
          }
        }),
        stakingPositions[0].transaction_hash,
        stakingPositions[0].output_index.toString(),
        "300000",
        proposal.id.toString(),
        proposal.endDatePosix.toString(),
        "0",
      )
    } catch (error) {
      console.error("Unlock transaction failed", error)
    } finally {
    }
  }

  const [selection, setSelection] = useState("")

  if (!proposal) {
    return <Text color={textColor}>Proposal not found</Text>
  }

  return (
    <Flex flexDir="row" gap="1em">
      <Box
        bg={detailBg}
        p={8}
        borderRadius="md"
        boxShadow="md"
        w="100%"
        maxW="70%"
      >
        <Flex mb={4} justify={"space-between"}>
          <Heading color={textColor}>{proposal.title}</Heading>
          <Tag
            my="auto"
            height={"min-content"}
            color={statusColor}
            bgColor={statusBgColor}
          >
            {proposal.status}
          </Tag>
        </Flex>
        <Text whiteSpace={"pre-line"} color={textColor}>
          {proposal.description}
        </Text>

        {proposal.votes.map((v, idx) => (
          <Box
            key={`${idx}-${v.title}`}
            borderWidth="1px"
            borderRadius="lg"
            borderColor={borderColor}
            p={4}
            mt="1em"
          >
            <Flex mb={4} justify={"space-between"}>
              <Heading size="md" color={textColor}>
                <span style={{ fontWeight: "100" }}>{idx + 1}.</span> {v.title}
              </Heading>
              <Tag my="auto" height="min-content" gap="8px">
                {getIconForType(v.type)}
                <Text color={typeColor}>{v.type ?? "Opinion"}</Text>
              </Tag>
            </Flex>
            <Text> {v.description} </Text>

            <VotesBarChart
              votes={[
                {
                  weight: v.weight,
                  color: COLORS[idx],
                  title: <Text>{formatNumber(v.weight, 0)} Votes</Text>,
                },
              ]}
              height="28px"
              quorum={proposal.quorum}
            />
          </Box>
        ))}
      </Box>

      <Flex flexDir="column" minW="20em" w="30%" rowGap="1em">
        <Flex
          flexDir="column"
          bg={detailBg}
          p={8}
          borderRadius="md"
          boxShadow="md"
          h="fit-content"
          rowGap={2}
        >
          <Heading color={textColor}>Information</Heading>
          <Text>{proposal.summary}</Text>
          <Flex justify="space-between">
            <Text color={statusColor}>Creator</Text>
            <Text>{proposal.creatorName}</Text>
          </Flex>
          <Flex justify="space-between">
            <Text color={statusColor}>End Date</Text>
            <Text>{new Date(proposal.endDate).toLocaleString()}</Text>
          </Flex>

          <Box>
            <Text color={statusColor} mb={2}>
              Vote Allocation
            </Text>
            <ProposalBarChart
              proposal={proposal}
              colors={COLORS}
              height="5px"
              hideQuorumText
            />
          </Box>
        </Flex>
        {proposal.status === "open" && (
          <Flex
            flexDir="column"
            bg={detailBg}
            p={8}
            borderRadius="md"
            boxShadow="md"
            h="fit-content"
            rowGap={2}
          >
            <Heading color={textColor}>Vote Now</Heading>

            <Box
              bg={infoBgColor}
              px={2}
              py={4}
              mx={-2}
              borderRadius="md"
              textAlign="left"
              mb={"1em"}
            >
              If you want to reject the proposal you need to actively
              participate in the vote{" "}
            </Box>

            <Text mb="5px">Voting Outcomes:</Text>

            <RadioGroup onChange={setSelection} value={selection} mb="10px">
              <Stack direction="column">
                {proposal.votes.map((v, i) => {
                  return (
                    <Radio key={v.title + i} value={v.title}>
                      {i + 1}. <b>{v.title}</b>
                    </Radio>
                  )
                })}
              </Stack>
            </RadioGroup>

            <Button
              onClick={handleOnClick}
              bg={selection === "Reject" ? "red" : "green"}
              isDisabled={
                selection === "" || isStakingUninitialized || isStakingLoading
              }
              _hover={{
                bg: selection === "Reject" ? "red" : "green", // Keep the same color on hover
              }}
              sx={{
                "&:disabled": {
                  _hover: {
                    bg: selection === "Reject" ? "red" : "green", // Ensure hover color remains the same even when disabled
                  },
                },
              }}
            >
              {selection === "Reject" ? "Reject Proposal" : "Accept Selection"}
            </Button>
          </Flex>
        )}
      </Flex>
    </Flex>
  )
}

const ProposalDetailPage: React.FC = () => {
  const { id, authNft } = useParams<{ id: string; authNft: string }>()
  const { data: proposal } = useGetTallyDetailQuery(
    id && authNft
      ? { tally_proposal_id: id, tally_auth_nft: authNft }
      : skipToken,
  )

  const buttonBg = useColorModeValue("accent.light", "accent.dark")
  const buttonHoverBg = useColorModeValue(
    "accentPressed.light",
    "accentPressed.dark",
  )

  return (
    <Flex
      flexDir="column"
      m="24px 16px"
      sx={{ textAlign: "start" }}
      rowGap={"1em"}
    >
      <Link to={`/proposals`}>
        <Button
          leftIcon={<IoArrowBack />}
          bg={buttonBg}
          _hover={{ bg: buttonHoverBg }}
          color="white"
        >
          Proposals
        </Button>
      </Link>
      <ProposalDetail proposal={proposal?.at(0)} />
    </Flex>
  )
}

export default ProposalDetailPage
