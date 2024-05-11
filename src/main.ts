import 'dotenv/config';

import { coloredInfo, coloredError, coloredWarn, coloredDebug } from "./utils/logger";
import SolanaConnector from './connectors/solanaConnector';
import JupiterConnector from './connectors/jupiterConnector';
import sleep from './utils/sleepTimout';
import DatabaseConnector from './connectors/sqlite3Connector';
import calculateProfit from './utils/calculateProfit';
import { extractSymbols } from './utils/extractTokenSymbols';
import { Wallet } from '@project-serum/anchor';

const AMOUNT_OF_TOKENS_TO_SWAP = (Number(process.env.AMOUNT_OF_TOKENS_TO_SWAP) / 100) || 1;
const EXPECTED_PERCENTAGE_PROFIT = (Number(process.env.EXPECTED_PERCENTAGE_PROFIT) / 100) || 0.5;

const checkAndProcessSymbol = async (symbol: string, sellingPrice: any, tokenData: any[], response: any, db: DatabaseConnector, jupiter: JupiterConnector, solana: SolanaConnector, wallet: Wallet | undefined) => {
    // Check if the symbol exists in sellingPrice!.data
    if (symbol in sellingPrice!.data) {
        // Save the data for that symbol
        tokenData.push(sellingPrice!.data[symbol]);
        coloredDebug(`Current Market Price for ${symbol} is ${sellingPrice!.data[symbol].price} ${sellingPrice!.data[symbol].vsTokenSymbol}`);
        coloredDebug("Fetching Pending Order Limits");
        await jupiter.getOpenOrder(wallet!).then(async (openOrderTokenAddresses) => {
            await processOpenOrders(symbol, openOrderTokenAddresses, response, sellingPrice, db, jupiter, solana, wallet);
        });
    }
}

const processOpenOrders = async (symbol: string, openOrderTokenAddresses: string[] | undefined, response: any, sellingPrice: any, db: DatabaseConnector, jupiter: JupiterConnector, solana: SolanaConnector, wallet: Wallet | undefined) => {
    const responseToken = response.tokensAddresses.find((token: { tokenSymbol: string; }) => token.tokenSymbol === symbol);
    if (responseToken) {
        if (openOrderTokenAddresses !== undefined && openOrderTokenAddresses.length < 1 || openOrderTokenAddresses !== undefined && !openOrderTokenAddresses.includes(sellingPrice!.data[symbol].id)) {
            const outputToken = await solana.getTokenMetaData(sellingPrice!.data[symbol].id);
            await db.storeNewData(
                "tradedTokens",
                sellingPrice!.data[symbol].mintSymbol,
                responseToken.tokenBalance,
                sellingPrice!.data[symbol].price,
                sellingPrice!.data[symbol].price + (sellingPrice!.data[symbol].price * EXPECTED_PERCENTAGE_PROFIT)
            ).then(async () => {
                coloredInfo("Data saved into the database. Use an sqlite viewer to view the data table.\n\n\n");
                await sleep(2500);
                await calculateProfit(sellingPrice!.data[symbol].price, responseToken.tokenBalance).then(async (profitInterface) => {
                    // Create order logic with proper price adjustments based on outputToken.decimals

                    if (outputToken !== null) await jupiter.createOrderLimit((responseToken.tokenBalance * sellingPrice!.data[symbol].price) * (10 ** outputToken.decimals!), (responseToken.tokenBalance * profitInterface.expectedTradingMarketPrice) * (10 ** outputToken.decimals!), wallet!, sellingPrice!.data[symbol].id, sellingPrice!.data[symbol].vsToken);
                    await sleep(2500);
                });
            });
        }
    }
}

const main = async () => {
    try {
        coloredInfo("PROFITER BOT INITIALIZING");
        coloredDebug("Please ensure you have set the environment variables for this instance!!!")

        const solana = new SolanaConnector();
        const wallet = await solana.getWallet()
        const connection = await solana.getSolanaConnection();
        const jupiter = new JupiterConnector(wallet!, connection!);
        const db = new DatabaseConnector();

        await solana.getBalance().then(async (balance: number | undefined) => {
            coloredDebug(`Your Balance: ${balance} SOL`)
            coloredWarn("-----------------------------------------------------------\n\n")
            await solana.getUserTokens().then(async (response) => {
                if (response !== undefined) {
                    coloredWarn("------------------------------------------------------\n\n")
                    coloredDebug(`Fetching current market price for tokens`,)
                    const tkSymbols: string[] = await extractSymbols(response)
                    await jupiter.getTokenSellingPrices(response.tokenSymbols).then(async (sellingPrice) => {
                        // Initialize an object to store token data
                        const tokenData: any[] = [];

                        // Iterate over each token symbol
                        for (const symbol of tkSymbols) {
                            await checkAndProcessSymbol(symbol, sellingPrice, tokenData, response, db, jupiter, solana, wallet)
                        }
                    });
                    coloredInfo("Rerunning in 5 Seconds time.\n\n\n")
                    await sleep(2500);
                } else {
                    coloredWarn("There was an error getting the user tokens.\n\n\n")
                    coloredWarn("-----------------------------------------------------------\n\n\n")
                    await sleep(9000).then(async () => {
                        await main();
                    })
                }
            })
        });

        // await solana.getTokenMetaData();
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

























// const promise = tkSymbols.map(async (symbol) => {
//     // Check if the symbol exists in the responseData.data object
//     if (symbol in sellingPrice!.data) {
//         // If it exists, save the data for that symbol
//         tokenData.push(sellingPrice!.data[symbol]);
//         coloredDebug(`Current Market Price for ${symbol} is ${sellingPrice!.data[symbol].price} ${sellingPrice!.data[symbol].vsTokenSymbol}`)
//     }
//     coloredDebug("Fetching Pending Order Limits");
//     const openOrderTokenAddresses = await jupiter.getOpenOrder(wallet!);
//     await sleep(2500);

//     // console.log("Order Limits", openOrderTokenAddresses)

//     const subPromise = response.tokensAddresses.map(async (token) => {
//         if (symbol === token.tokenSymbol) {
//             if (openOrderTokenAddresses !== undefined && openOrderTokenAddresses.length < 1 || openOrderTokenAddresses !== undefined && !openOrderTokenAddresses.includes(sellingPrice!.data[symbol].id)) {
//                 const outputToken = await solana.getTokenMetaData(sellingPrice!.data[symbol].id);
//                 await db.storeNewData(
//                     "tradedTokens",
//                     sellingPrice!.data[symbol].mintSymbol,
//                     token.tokenBalance,
//                     sellingPrice!.data[symbol].price,
//                     sellingPrice!.data[symbol].price + (sellingPrice!.data[symbol].price * EXPECTED_PERCENTAGE_PROFIT)
//                 ).then(async () => {
//                     coloredInfo("Data saved into the database. Use an sqlite viewer to view the data table.")
//                     await calculateProfit(sellingPrice!.data[symbol].price, token.tokenBalance).then(async (ProfitInterface) => {
//                         await sleep(2500);
//                         // await jupiter.createOrderLimit(token.tokenBalance * Math.pow(10,token.decimals!), ProfitInterface.finalValue * Math.pow(10,outputToken.decimals!), wallet!, sellingPrice!.data[symbol].id, sellingPrice!.data[symbol].vsToken)
//                         await jupiter.createOrderLimit(sellingPrice!.data[symbol].price * Math.pow(10, outputToken.decimals!), ProfitInterface.expectedTradingMarketPrice * Math.pow(10, outputToken.decimals!), wallet!, sellingPrice!.data[symbol].id, sellingPrice!.data[symbol].vsToken)
//                         await sleep(2500);
//                     });
//                     // await jupiter.createOrderLimit(1000000, 1000000, wallet!, "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB")
//                 })
//             }
//         }
//     })

//     await Promise.all(subPromise);

// })
// await Promise.all(promise)
