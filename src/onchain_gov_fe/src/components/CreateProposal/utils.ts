import { Vote } from "../../api/model/tally"

export const getShortDescriptionPlaceholder = (voteType?: string) => {
  switch (voteType) {
    case "Opinion":
      return "Enter a short opinion summary"
    case "GovStateUpdate":
      return "Enter a brief state update"
    case "FundPayout":
      return "Enter a short payout summary"
    case "PoolUpgrade":
      return "Enter a brief upgrade summary"
    default:
      return "Enter a short proposal description"
  }
}

export const getDescriptionPlaceholder = (voteType?: string) => {
  switch (voteType) {
    case "Opinion":
      return "Enter a detailed opinion"
    case "GovStateUpdate":
      return "Enter a detailed state update"
    case "FundPayout":
      return "Enter a detailed payout information"
    case "PoolUpgrade":
      return "Enter a detailed upgrade information"
    default:
      return "Enter a proposal description"
  }
}

export const handleChangeClbk = (
  charLimit: number | null,
  setContent: (v: string) => void,
) => {
  return (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    if (charLimit == null || e.target.value.length <= charLimit) {
      setContent(e.target.value)
    }
  }
}

const prepareMetadataStrings = (s: string) => {
  const blockSize = 64

  if (s.length < blockSize) return s

  const result = []
  for (let i = 0; i < s.length; i += blockSize) {
    result.push(s.slice(i, i + blockSize))
  }
  return result
}

type MetadataString = string | string[]
export type TallyMetadataValues = {
  title: MetadataString
  creator_name: MetadataString
  forum_link: MetadataString
  description: MetadataString
  short_description: MetadataString
  proposals: {
    title: MetadataString
    description: MetadataString
    proposal_type: MetadataString
  }[]
}
export function getCleanProposalValues(
  title: string,
  creator: string,
  forumLink: string,
  description: string,
  shortDescription: string,
  votes: Vote[],
): TallyMetadataValues {
  return {
    title: prepareMetadataStrings(title),
    creator_name: prepareMetadataStrings(creator),
    forum_link: prepareMetadataStrings(forumLink),
    description: prepareMetadataStrings(description),
    short_description: prepareMetadataStrings(shortDescription),
    proposals: votes.map((v) => ({
      title: prepareMetadataStrings(v.title),
      description: prepareMetadataStrings(v.description),
      proposal_type: prepareMetadataStrings(v.type),
    })),
  }
}
