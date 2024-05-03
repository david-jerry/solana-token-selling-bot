import 'dotenv/config';

import { coloredInfo, coloredError, coloredWarn, coloredDebug } from "./utils/logger";
import SolanaConnector from './connectors/solanaConnector';
import JupiterConnector from './connectors/jupiterConnector';
import sleep from './utils/sleepTimout';
import DatabaseConnector from './connectors/sqlite3Connector';
import calculateProfit from './utils/calculateProfit';

const AMOUNT_OF_TOKENS_TO_SWAP = (Number(process.env.AMOUNT_OF_TOKENS_TO_SWAP) / 100) || 1;
const EXPECTED_PERCENTAGE_PROFIT = (Number(process.env.EXPECTED_PERCENTAGE_PROFIT) / 100) || 0.5;

const main = async () => {
    try {
        coloredInfo("PROFITER BOT INITIALIZING");
        coloredDebug("Please ensure you have set the environment variables for this instance!!!")

        const solana = new SolanaConnector();
        const wallet = await solana.getWallet()
        const connection = await solana.getSolanaConnection();
        const jupiter = new JupiterConnector(wallet!, connection!);
        const db = new DatabaseConnector();

        await solana.getBalance().then((balance: number | undefined) => {
            coloredDebug(`Your Balance: ${balance} SOL`)
            coloredWarn("-----------------------------------------------------------")
        });

        // await solana.getTokenMetaData();

        await solana.getUserTokens().then(async (response) => {
            if (response !== undefined) {
                coloredWarn("------------------------------------------------------")
                coloredDebug(`Fetching current price for ${response?.tokensAddresses[0].tokenSymbol}`)
                const tkSymbols: string[] = response.tokensAddresses.map(token => token.tokenSymbol)
                const sellingPrice = await jupiter.getTokenSellingPrices(response.tokenSymbols);
                await sleep(2500);
                // Initialize an object to store token data
                const tokenData = [];

                // Iterate over each token symbol
                const promise = tkSymbols.map(async (symbol) => {
                    // Check if the symbol exists in the responseData.data object
                    if (symbol in sellingPrice!.data) {
                        // If it exists, save the data for that symbol
                        tokenData.push(sellingPrice!.data[symbol]);
                        coloredDebug(`Current Market Price for ${symbol} is ${sellingPrice!.data[symbol].price} ${sellingPrice!.data[symbol].vsTokenSymbol}`)
                    }
                    coloredDebug("Fetching Pending Order Limits");
                    const openOrderTokenAddresses = await jupiter.getOpenOrder(wallet!);
                    await sleep(2500);

                    // console.log("Order Limits", openOrderTokenAddresses)

                    const subPromise = response.tokensAddresses.map(async (token) => {
                        if (symbol === token.tokenSymbol) {
                            if (openOrderTokenAddresses !== undefined && openOrderTokenAddresses.length < 1 || openOrderTokenAddresses !== undefined && !openOrderTokenAddresses.includes(sellingPrice!.data[symbol].id)) {
                                const outputToken = await solana.getTokenMetaData(sellingPrice!.data[symbol].id);
                                await db.storeNewData(
                                    "tradedTokens",
                                    sellingPrice!.data[symbol].mintSymbol,
                                    token.tokenBalance,
                                    sellingPrice!.data[symbol].price,
                                    sellingPrice!.data[symbol].price + (sellingPrice!.data[symbol].price * EXPECTED_PERCENTAGE_PROFIT)
                                ).then(async () => {
                                    coloredInfo("Data saved into the database. Use an sqlite viewer to view the data table.")
                                    await calculateProfit(sellingPrice!.data[symbol].price, token.tokenBalance).then(async (ProfitInterface) => {
                                        await sleep(2500);
                                        // await jupiter.createOrderLimit(token.tokenBalance * Math.pow(10,token.decimals!), ProfitInterface.finalValue * Math.pow(10,outputToken.decimals!), wallet!, sellingPrice!.data[symbol].id, sellingPrice!.data[symbol].vsToken)
                                        await jupiter.createOrderLimit(token.tokenBalance * Math.pow(10,token.decimals!), ProfitInterface.expectedTradingMarketPrice * Math.pow(10,token.decimals!), wallet!, sellingPrice!.data[symbol].id, sellingPrice!.data[symbol].vsToken)
                                        await sleep(2500);
                                    });
                                    // await jupiter.createOrderLimit(1000000, 1000000, wallet!, "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB")
                                })
                            }
                        }
                    })

                    await Promise.all(subPromise);

                })
                await Promise.all(promise)
                coloredInfo("Rerunning in 5 Seconds time.\n\n\n")
            } else {
                coloredWarn("Rerunning the bot again in 5 seconds.\n\n\n")
                coloredWarn("-----------------------------------------------------------\n\n\n")
                await sleep(9000).then(async () => {
                    await main();
                })
            }
        })
    } catch (error: any) {
        coloredError(`${error.message} \n\n\n`)
        await sleep(9000).then(async () => {
            await main();
        })
    } finally {
        await sleep(9000).then(async () => {
            await main()
        })
    }
}

export default main;