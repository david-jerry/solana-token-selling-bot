interface TokenInfo {
    tokenAddress: string; // Assuming mintAddress is of type string
    tokenBalance: number; // Assuming tokenBalance is of type number
    decimals: number | null;
    tokenSymbol: string;
}

const extractSymbols = async ( response: {
    tokensAddresses: TokenInfo[];
    tokenIds: string;
    tokenSymbols: string;
}) => {
    const tokenSymbols: string[] = response.tokensAddresses.map((token: { tokenSymbol: string }) => token.tokenSymbol)
    return tokenSymbols;
}

export {extractSymbols}