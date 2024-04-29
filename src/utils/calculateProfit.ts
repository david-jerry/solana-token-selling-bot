import 'dotenv/config';

const EXPECTED_PERCENTAGE_PROFIT = (Number(process.env.EXPECTED_PERCENTAGE_PROFIT) / 100) || 0.5;

const calculateProfit = (currentMarketPrice: number, numberOfTokensToSell: number): number => {
    const expectedTradingMarketPrice = currentMarketPrice + (EXPECTED_PERCENTAGE_PROFIT * currentMarketPrice);
    const finalValue = numberOfTokensToSell / expectedTradingMarketPrice
    return finalValue 
}

export default calculateProfit