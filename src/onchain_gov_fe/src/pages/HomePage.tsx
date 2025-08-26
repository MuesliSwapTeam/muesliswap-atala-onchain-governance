import React from "react"
import {
  Card,
  Flex,
  Heading,
  Image,
  SimpleGrid,
  Text,
  useColorMode,
  VStack,
} from "@chakra-ui/react"
import lightLogo from "../assets/logo-light.svg"
import darkLogo from "../assets/logo-dark.svg"

const HomePage: React.FC = () => {
  const { colorMode } = useColorMode()

  return (
    <VStack spacing={8} p={5}>
      {/* Logo and Whitepaper Button */}
      <Flex align="center" flexDir="column" rowGap={4}>
        <Image
          src={colorMode === "dark" ? darkLogo : lightLogo}
          alt="Logo"
          boxSize="200px"
          mb={4}
        />
        <Heading as="h1" size="xl">
          Muesliswap DAO
        </Heading>
        <Heading as="h2" size="lg">
          Onchain Governance on Cardano
        </Heading>
      </Flex>
      {/* Three Boxes */}
      <SimpleGrid columns={3} spacing={10} mt={4}>
        <Card p={5} shadow="lg" variant="outline">
          <Heading fontSize="xl">
            Decentralized and Transparent Governance
          </Heading>
          <Text mt={4}>
            Muesliswap DAO empowers the community with full control, ensuring
            decisions are made transparently and democratically through on-chain
            voting.
          </Text>
        </Card>
        <Card p={5} shadow="lg" variant="outline">
          <Heading fontSize="xl">Community-Driven Development</Heading>
          <Text mt={4}>
            Our platform prioritizes community input, allowing members to
            propose and vote on upgrades and new features, driving continuous
            improvement.
          </Text>
        </Card>
        <Card p={5} shadow="lg" variant="outline">
          <Heading fontSize="xl">Efficient and Scalable Ecosystem</Heading>
          <Text mt={4}>
            Built on the Cardano blockchain, Muesliswap DAO leverages advanced
            scalability and efficiency to support a wide range of decentralized
            applications and services.
          </Text>
        </Card>
      </SimpleGrid>
    </VStack>
  )
}

export default HomePage
