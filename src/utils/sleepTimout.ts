import 'dotenv/config';

const milliSeconds = Number(process.env.WAIT_TIME_IN_MS) || 5000;

const sleep = (ms: number = milliSeconds) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export default sleep;