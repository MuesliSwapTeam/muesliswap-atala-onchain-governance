import React, { useCallback, useState } from "react"
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Input,
  useDisclosure,
  IconButton,
  HStack,
  VStack,
  Heading,
  Image,
  Text,
} from "@chakra-ui/react"

import { FaRegMinusSquare } from "react-icons/fa"
import { EditIcon, CheckIcon } from "@chakra-ui/icons"

import Img from "../assets/logo-light.svg"
import useWalletContext from "../context/wallet"
import { Pool } from "../cardano/staking/pools"
import Big from "big.js"
import { getTokenBalance } from "../cardano/wallet"
import { GOV_TOKEN_DECIMALS } from "../cardano/config"
import { fromNativeAmount } from "../utils/numericHelpers"

const presetPercentages = [25, 50, 75, 100]

interface Props {
  pool?: Pool
}

const WithdrawButton: React.FC<Props> = ({ pool }) => {
  const { isConnected } = useWalletContext()
  // NOTE pjordan: Again, people can withdraw and the balance is not updated correspondingly
  const balance = fromNativeAmount(
    pool?.myStake ?? "0",
    GOV_TOKEN_DECIMALS,
  ).toNumber()
  const { isOpen, onOpen, onClose } = useDisclosure()

  const [percentage, setPercentage] = useState(0)
  const [amount, setAmount] = useState(0)
  const [inputAmount, setInputAmount] = useState("")

  const [isEditingAmount, setIsEditingAmount] = useState(false)

  const handlePercent = useCallback(
    (percentage: number) => {
      setPercentage(percentage)
      setAmount((percentage * balance) / 100)
      setInputAmount(((percentage * balance) / 100).toString())
    },
    [balance],
  )

  const handleAmount = useCallback(
    (strValue: string) => {
      // Only match numbers
      if (strValue && !strValue.match(/^\d*\.?\d*$/)) return

      if (!strValue) setInputAmount("0")
      const value = Number(strValue ?? "0")
      if (value < balance) {
        setPercentage((100 * value) / balance)
        setAmount(value)
      } else {
        setPercentage(100)
        setAmount(balance)
        setInputAmount(balance.toString())
      }
    },
    [balance],
  )

  const handleWithdraw = useCallback(async () => {
    const share = Big(amount).div(Big(balance)).toNumber()
    const myLpBalance = await getTokenBalance(
      pool!.poolTokenPolicyId,
      pool!.poolTokenNameHex,
    )
    const lpTokensToWithdraw = Big(myLpBalance)
      .mul(share)
      .round(0, Big.roundUp)
      .toString()
    const sAmunt = Big(pool!.totalStake)
      .mul(share)
      .mul(myLpBalance)
      .div(pool!.totalLp)
      .round(0, Big.roundUp)
      .toString()
  }, [amount, balance, pool, onClose])

  return (
    <>
      <Button
        onClick={onOpen}
        isDisabled={!isConnected}
        leftIcon={<FaRegMinusSquare />}
      >
        Withdraw
      </Button>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Withdraw Stake</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack mb={8}>
              <Text fontSize="md">Staked Balance: {balance}</Text>
              {/*                             <Text fontSize="lg">Amount</Text> */}
              <HStack justify={"space-between"}>
                {isEditingAmount ? (
                  <>
                    <Input
                      disabled={!isEditingAmount}
                      value={inputAmount}
                      onChange={(e) => setInputAmount(e.target.value)}
                      onBlur={() => {
                        handleAmount(inputAmount)
                        setIsEditingAmount(false)
                      }}
                      fontSize="xl"
                      autoFocus
                    />
                    <IconButton
                      aria-label="Save amount"
                      icon={<CheckIcon />}
                      onClick={() => {
                        handleAmount(inputAmount)
                        setIsEditingAmount(false)
                      }}
                    />
                  </>
                ) : (
                  <>
                    <Heading size="lg" ml="40px">
                      {amount}
                    </Heading>
                    <IconButton
                      variant="ghost"
                      aria-label="Edit amount"
                      icon={<EditIcon />}
                      onClick={() => setIsEditingAmount(true)}
                    />
                  </>
                )}
              </HStack>
            </VStack>
            <Slider
              aria-label="slider-ex-1"
              value={percentage}
              onChange={handlePercent}
            >
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              {/*                             <SliderThumb /> */}
              <SliderThumb boxSize={8} bg="none">
                <Image src={Img} />
              </SliderThumb>
            </Slider>
            <HStack justify={"space-evenly"} mt={4}>
              {presetPercentages.map((percentage) => (
                <Button
                  key={percentage}
                  onClick={() => handlePercent(percentage)}
                  ml="2"
                >
                  {percentage}%
                </Button>
              ))}
            </HStack>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={onClose}>
              Close
            </Button>
            <Button variant="ghost" disabled={!pool} onClick={handleWithdraw}>
              Withdraw
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}

export default WithdrawButton
