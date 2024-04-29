import 'dotenv/config';
import { Keypair } from "@solana/web3.js";
import { coloredInfo } from "./logger";

/**
 * Generates a new Solana wallet.
 * This function generates a new Solana wallet, consisting of a public key and a secret key,
 * and logs the public key to the console using coloredInfo from the logger utility.
 * @returns {Keypair} The generated Solana wallet as a Keypair object containing a public key and a secret key.
 * @example
 * // Import the function
 * import generateWallet from 'path/to/generateWallet';
 *
 * // Generate a new wallet
 * const wallet = generateWallet();
 * // Output:
 * // WALLET (publicKey): <publicKey>
 * // WALLET (secretKey): <secretKey>
 */
const generateWallet = async (): Promise<Keypair> => {
    const keypair = Keypair.generate();

    coloredInfo(`WALLET (publicKey): ${keypair.publicKey.toString()}`);
    coloredInfo(`WALLET (secretKey): ${keypair.secretKey}`);
    return keypair
}

export default generateWallet;
