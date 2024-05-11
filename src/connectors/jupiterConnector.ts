import 'dotenv/config';

import { Keypair, Connection, PublicKey, LAMPORTS_PER_SOL, VersionedTransaction, sendAndConfirmTransaction, Transaction } from "@solana/web3.js";
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { LimitOrderProvider, ownerFilter } from "@jup-ag/limit-order-sdk";
import { BN, Wallet } from '@project-serum/anchor';
import { coloredDebug, coloredError, coloredInfo, coloredWarn } from '../utils/logger';
import axios from 'axios';
import sleep from '../utils/sleepTimout';

interface TokenData {
    id: string;
    mintSymbol: string;
    vsToken: string;
    vsTokenSymbol: string;
    price: number;
}

interface AccountInfo {
    publicKey: PublicKey;
    account: {
        maker: string;
        inputMint: string;
        outputMint: string;
        oriInAmount: number;
        oriOutAmount: number;
        inAmount: number;
        outAmount: number;
        expiredAt: number;
        base: string;
    };
}

interface ApiResponse {
    data: {
        [key: string]: TokenData;
    };
    timeTaken: number;
}

/**
 * Connector class for interacting with the Jupiter decentralized exchange.
 * This class provides methods to perform various operations related to trading and managing orders on the Jupiter DEX.
 */
class JupiterConnector {
    wallet: Wallet;
    limitOrder: LimitOrderProvider;
    connection: Connection;

    /**
     * Creates a new instance of the JupiterConnector class.
     * @param {Wallet} wallet - The wallet to use for trading and managing orders.
     * @param {Connection} solanaConnection - The connection to the Solana blockchain.
     */
    constructor(wallet: Wallet, solanaConnection: Connection) {
        this.connection = solanaConnection;
        this.wallet = wallet;
        this.limitOrder = new LimitOrderProvider(
            solanaConnection,
            // undefined,
            // undefined,
            // undefined
        )
    }

    /**
     * Determines the total amount of token's balance to trade based on a percentage.
     * @param {number} tokenBalance - The balance of the token.
     * @returns {Promise<number>} The amount of token's balance to trade.
     * @example
     * const connector = new JupiterConnector(wallet, solanaConnection);
     * const tradableAmount = await connector.howMuchToTrade(1000);
     * console.log(tradableAmount); // Output: <amountToTrade>
     */
    howMuchToTrade = async (tokenBalance: number): Promise<number> => {
        coloredInfo("Determining total amount of token's balance to trade", "jupiter")
        const tradableAmount = tokenBalance * (Number(process.env.AMOUNT_OF_TOKENS_TO_SWAP) / 100)
        coloredInfo(`${tradableAmount} Determined to trade from ${tokenBalance} initial balance`, "jupiter")
        return tradableAmount
    }

    /**
     * Retrieves the current selling prices of a token to a specified token (default: USDT).
     * @param {string} symbolsOrAddresses - The addresses/symbols of the tokens to get prices for.
     * @param {string} vsTokenSymbolOrAddress - The address/symbol of the token to compare against (default: USDT).
     * @returns {Promise<any>} The price data.
     * @example
     * const connector = new JupiterConnector(wallet, solanaConnection);
     * const priceData = await connector.getTokenSellingPrices('tokenAddresses');
     * console.log(priceData); // Output: <priceData>
     */
    getTokenSellingPrices = async (symbolsOrAddresses: string, vsTokenSymbolOrAddress: string = process.env.VSTOKENSYMBOL!): Promise<ApiResponse | undefined> => {
        coloredInfo("Getting current selling prices of token to USDT(default. you can change this in the .env file or replace the process.env.ANOTHER_PREDEFINED_TOKEN_ADDRESS_IN_DOTENV_FILE)", 'jupiter');

        try {
            const response = await axios.get(`https://price.jup.ag/v4/price?ids=${symbolsOrAddresses}&vsToken=${vsTokenSymbolOrAddress.toUpperCase()}`, {
                timeout: 5000,
            });

            if (response.status !== 200) {
                coloredError("Failed to fetch prices data", 'jupiter');
                return;
            }

            const priceData: ApiResponse = response.data;
            // coloredDebug(`Price Data fetched successfully: ${JSON.stringify(priceData, null, 4)}`, "jupiter");

            return priceData;
        } catch (error) {
            console.error('Error fetching token selling prices:', error);
            return;
        }
    }


    /**
     * Creates a new limit order for trading tokens.
     * @param {number} amountToSell - The amount of tokens to sell.
     * @param {number} amountToExpect - The amount of tokens expected to receive.
     * @param {string} sellTokenAddress - The address of the token to sell.
     * @param {string} buyTokenAddress - The address of the token to buy.
     * @returns {Promise<PublicKey>} - The public key of the created limit order.
     * @example
     * const connector = new JupiterConnector(wallet, solanaConnection);
     * const orderPubKey = await connector.createOrderLimit(100, 200, wallet, 'sellTokenAddress', 'buyTokenAddress');
     * console.log(orderPubKey); // Output: <orderPubKey>
    */
    createOrderLimit = async (amountToSell: number, amountToExpect: number, wallet: Wallet, sellTokenAddress: string, buyTokenAddress: string): Promise<void> => {
        coloredInfo("Creating a new Limit Order");
        coloredInfo(`Amount to sell: ${new BN(amountToSell)}`)
        coloredInfo(`Amount to get: ${new BN(amountToExpect)}`)

        await sleep(3500);

        const base = Keypair.generate();
        try {
            await this.limitOrder.createOrder({
                owner: wallet.payer.publicKey,
                inAmount: new BN(amountToSell),
                outAmount: new BN(amountToExpect),
                inputMint: new PublicKey(sellTokenAddress),
                outputMint: new PublicKey(buyTokenAddress),
                expiredAt: null,
                base: base.publicKey,
            }).then(async ({ tx, orderPubKey }) => {
                console.log("Payer: ", wallet.payer.publicKey);
                console.log(tx);
                console.log("Order Public Key: ", orderPubKey);
                await sendAndConfirmTransaction(this.connection, tx, [wallet.payer, base]);
                coloredDebug("Limit Order has been submitted successfully", "jupiter");
                return orderPubKey;
            });
        } catch (err: any) {
            coloredError(err.message)
            coloredWarn("-----------------------------------------------------------\n\n\n")
        }

    }

    /**
     * Cancels an existing limit order.
     * @param {PublicKey} orderPublicKey - The public key of the order to cancel.
     * @returns {Promise<Transaction>} The transaction ID of the cancellation.
     * @example
     * const connector = new JupiterConnector(wallet, solanaConnection);
     * const txId = await connector.cancelOrderLimit(orderPubKey);
     * console.log(txId); // Output: <transactionId>
     */
    cancelOrderLimit = async (orderPublicKey: PublicKey): Promise<Transaction> => {
        const txId = await this.limitOrder.cancelOrder({
            owner: this.wallet.publicKey,
            orderPubKey: orderPublicKey,
        });
        return txId;
    }

    /**
     * Retrieves open orders associated with a wallet.
     * @param {Wallet} owner - The owner of the orders.
     * @returns {Promise<any>} The open orders.
     * @example
     * const connector = new JupiterConnector(wallet, solanaConnection);
     * const openOrders = await connector.getOpenOrder(wallet);
     * console.log(openOrders); // Output: <openOrders>
     */
    getOpenOrder = async (owner: Wallet): Promise<string[] | undefined> => {
        try {
            const openOrderTokenAddresses: string[] = [];
            const res = await this.limitOrder.getOrders([ownerFilter(owner.publicKey)])

            coloredDebug("Finding Open Order Token Addresses...");

            for (const order of res) {
                const tokenAddress = order.account.inputMint.toString();
                openOrderTokenAddresses.push(tokenAddress);
            }

            coloredDebug(`Open Order Found: ${openOrderTokenAddresses}`);
            return openOrderTokenAddresses;
        } catch (e: any) {
            console.log(e.message)
            return undefined
        }
    }
}

export default JupiterConnector;