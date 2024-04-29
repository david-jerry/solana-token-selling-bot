import 'dotenv/config';

const EXPECTED_PERCENTAGE_PROFIT = (Number(process.env.EXPECTED_PERCENTAGE_PROFIT) / 100) || 0.5;

const calculateProfit = async (currentMarketPrice: number, numberOfTokensToSell: number): Promise<number> => {
    const expectedTradingMarketPrice = currentMarketPrice + (EXPECTED_PERCENTAGE_PROFIT * currentMarketPrice);
    const finalValue = numberOfTokensToSell / expectedTradingMarketPrice
    return finalValue
}

export default calculateProfit

