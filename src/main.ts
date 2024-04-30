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

                    console.log("Order Limits", openOrderTokenAddresses)

                    response.tokensAddresses.map(async (token) => {
                        if (symbol === token.tokenSymbol) {
                            if (openOrderTokenAddresses !== undefined && openOrderTokenAddresses.length < 1 || openOrderTokenAddresses !== undefined && !openOrderTokenAddresses.includes(sellingPrice!.data[symbol].id)) {
                                const outputToken = await solana.getTokenMetaData(sellingPrice!.data[symbol].id);
                                await db.storeNewData(
                                    "tradedTokens",
                                    sellingPrice!.data[symbol].mintSymbol,
                                    token.tokenBalance,
                                    sellingPrice!.data[symbol].price,
                                    sellingPrice!.data[symbol].price + (sellingPrice!.data[symbol].price * EXPECTED_PERCENTAGE_PROFIT)
                                ).then(() => {
                                    coloredInfo("Data saved into the database. Use an sqlite viewer to view the data table.")
                                })
                                const amountToExpect = await calculateProfit(sellingPrice!.data[symbol].price, token.tokenBalance);
                                await jupiter.createOrderLimit(token.tokenBalance * Math.pow(10,token.decimals!), amountToExpect * Math.pow(10,outputToken.decimals!), wallet!, sellingPrice!.data[symbol].id, sellingPrice!.data[symbol].vsToken)
                            }
                        }
                    })

                })
                await Promise.all(promise)
                coloredWarn("------------------------------------------------------")
                coloredInfo("Rerunning in 5 Seconds time.\n\n\n")
            } else {
                coloredWarn("Rerunning the bot again in 5 seconds.")
                coloredWarn("-----------------------------------------------------------\n\n\n")
                await sleep(5000).then(async () => {
                    await main();
                })
            }
        })
    } catch (error: any) {
        coloredError(`${error.message} \n\n\n`)
        await sleep(5000).then(async () => {
            await main();
        })
    } finally {
        await sleep(5000).then(async () => {
            await main()
        })
    }
}

export default main;