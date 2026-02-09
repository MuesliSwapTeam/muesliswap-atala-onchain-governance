import { FC, useState, useCallback, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, Stack, Typography, Button, FormControlLabel, Switch } from "@mui/material";
import { ConnectWalletButton } from '@cardano-foundation/cardano-connect-with-wallet';
import { NetworkType } from '@cardano-foundation/cardano-connect-with-wallet-core';
import {useAppSelector} from "../app/hooks";
import logoBig from "../../muesli_logo.png";
import { getCurrentNetwork, setCurrentNetwork } from '../cardano/networkConfig';

const PREV_WALLET_LS_ID = "did-preferred-wallet-connector"


interface ICardanoLib {
    cardanoInit: () => Promise<undefined>
    mintToken: (wallet: IWallet, s1: string, s2: string) => Promise<undefined>
}

interface IWallet {
    getUsedAddresses: () => Promise<string[]>
    getUnusedAddresses: () => Promise<string[]>
    getAddress: () => Promise<string>
    getNetworkId: () => Promise<number>
}

const MintingPage: FC<{}> = () => {
    const [cardanoLib, setCardanoLib] = useState<ICardanoLib>()
    const [wallet, setWallet] = useState<IWallet>()
    const [error, setError] = useState<Error>()
    const [network, setNetwork] = useState<string>(getCurrentNetwork())

    const isTestnet = network === 'preprod'

    const handleNetworkToggle = useCallback(() => {
        const newNetwork = isTestnet ? 'mainnet' : 'preprod'
        setCurrentNetwork(newNetwork)
        setNetwork(newNetwork)
        setWallet(undefined)
        setCardanoLib(undefined)
        window.localStorage.removeItem(PREV_WALLET_LS_ID)
    }, [isTestnet])

    const connectWallet = useCallback((connector: string) => {
        // remember wallet for page reloads
        window.localStorage.setItem(PREV_WALLET_LS_ID, connector)
        // Initialize cardano lib
        import('../cardano/muesliswap/governance').then(async (lib) => {
            await lib.cardanoInit()
            setCardanoLib(lib as any as ICardanoLib)
        });
        // Initialize wallet
        if (!(window as any).cardano || !(window as any).cardano[connector]) {
            return;
        }
        (window as any).cardano[connector].enable().then(async (oldWallet: any) => {
            // Verify wallet network matches selected network
            const walletNetworkId = await oldWallet.getNetworkId()
            const expectedNetworkId = isTestnet ? 0 : 1
            if (walletNetworkId !== expectedNetworkId) {
                setError(new Error(
                    `Network mismatch: wallet is on ${walletNetworkId === 1 ? 'mainnet' : 'testnet'} but app is set to ${isTestnet ? 'Preprod Testnet' : 'Mainnet'}. Please switch your wallet network or toggle the network setting.`
                ))
                return
            }

            const wallet: IWallet = ({
                ...oldWallet,
                getAddress: async () => {
                    const addr = await oldWallet.getUsedAddresses();
                    if (!addr.length) {
                        return (await oldWallet.getUnusedAddresses())[0]
                    }
                    return addr[0]
                }
            })
            setWallet(wallet)
            setError(undefined)
        })
    }, [isTestnet])

    const initialLoad = useRef(true)
    useEffect(() => {
        if (!initialLoad.current) return

        initialLoad.current = false
        const prevConnector = window.localStorage.getItem(PREV_WALLET_LS_ID)
        if (prevConnector != null) {
            connectWallet(prevConnector)
        }
    }, [connectWallet])

    const user = useAppSelector((state) => state.auth.user);
    const atala_did = user?.atala_did.split(":").slice(-1)[0] || 'unknown';
    const challenge = user?.challenge || 'null';

    return (
        <Stack direction={'row'}>
            <Card sx={{ width: '100%' }}>
                <CardHeader
                    style={{ backgroundColor: '#f7f2a1' }}
                    title={(
                        <Typography sx={{ fontSize: 26, fontWeight: 400 }} component="div">
                            Welcome!
                        </Typography>
                    )}
                />
                <CardContent sx={{ minHeight: '300px' }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={isTestnet}
                                onChange={handleNetworkToggle}
                            />
                        }
                        label={isTestnet ? 'Preprod Testnet' : 'Mainnet'}
                        sx={{ mb: 2, display: 'block' }}
                    />
                    <ConnectWalletButton
                        key={network}
                        message="Please sign Augusta Ada King, Countess of Lovelace"
                        limitNetwork={isTestnet ? NetworkType.TESTNET : NetworkType.MAINNET}
                        onConnect={connectWallet}
                        onDisconnect={() => setWallet(undefined)}
                    />
                    <div style={{ height: "50px" }} />
                    <Button disabled={!wallet || !cardanoLib} onClick={() => {
                        try {
                            cardanoLib!.mintToken(wallet!, atala_did, challenge)
                        } catch (e: any) {
                            console.error(e)
                            setError(e as Error)
                        }
                    }}>Mint</Button>
                    {error != null && <CardContent>
                        <p>An error occured: {error.message}</p>
                    </CardContent>}
                </CardContent>
            </Card>
        </Stack>
    )
};

export default MintingPage;
