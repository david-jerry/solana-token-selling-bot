import 'dotenv/config';
import { coloredInfo } from './logger';

const EXPECTED_PERCENTAGE_PROFIT = (Number(process.env.EXPECTED_PERCENTAGE_PROFIT) / 100) || 0.5;

const calculateProfit = async (currentMarketPrice: number, numberOfTokensToSell: number): Promise<number> => {
    coloredInfo(`mrktPrice: ${currentMarketPrice}`)
    const expectedTradingMarketPrice = currentMarketPrice + (EXPECTED_PERCENTAGE_PROFIT * currentMarketPrice);
    coloredInfo(`ExpectedTradingMrktPrice: ${expectedTradingMarketPrice}`)
    const finalValue = numberOfTokensToSell * expectedTradingMarketPrice
    coloredInfo(`Value: ${finalValue}`)
    return finalValue
}

export default calculateProfit

