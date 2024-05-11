import 'dotenv/config';
import { coloredInfo } from './logger';

const EXPECTED_PERCENTAGE_PROFIT = (Number(process.env.EXPECTED_PERCENTAGE_PROFIT) / 100) || 0.5;

interface ProfitInterface {
    finalValue: number;
    expectedTradingMarketPrice: number;
}

const calculateProfit = async (currentMarketPrice: number, numberOfTokensToSell: number): Promise<ProfitInterface> => {
    coloredInfo(`mrktPrice: ${currentMarketPrice}`)
    const expectedTradingMarketPrice = currentMarketPrice + (EXPECTED_PERCENTAGE_PROFIT * currentMarketPrice);
    coloredInfo(`ExpectedTradingMrktPrice: ${expectedTradingMarketPrice}`)
    const finalValue = numberOfTokensToSell * expectedTradingMarketPrice
    coloredInfo(`Value: ${finalValue}`)
    return { finalValue, expectedTradingMarketPrice }
}

export default calculateProfit

