# Solana Token Selling Bot

## Overview

The Solana Token Selling Bot is a project aimed at helping users automatically sell their tokens on the market when the selling price is twice the initial purchase price, thereby earning them a profit. This bot leverages the Jupiter API to access real-time token prices and automate the selling process.
Features

    1. Automatically monitors token prices on the market.
    2. Sells tokens when the selling price is twice the initial purchase price.
    3. Provides real-time updates and notifications.
    4. Configurable settings for token selection and selling strategy.
    5. Simple setup and deployment.

## Requirements

Before running the bot, ensure you have the following prerequisites installed:

    1. Node.js
    2. npm or yarn
    3. Solana wallet with sufficient funds
    4. Quicknode RPC Endpoint

## Installation

Clone the repository:

```bash
git clone https://github.com/david-jerry/solana-token-selling-bot.git
```

Navigate to the project directory:

```bash
cd solana-token-selling-bot
```

Install dependencies:

```bash
npm install
```

Configure environment variables:

Create a .env file in the project root and add the required environment variables, including your Solana wallet address, API key for the Jupiter API, etc.

Run the bot:

```bash
npm start
```

## Configuration

The bot can be configured using environment variables in the .env file. Make sure to set the following variables:

    VSTOKENSYMBOL=USDT
    VSTOKENADDRESS=$USDT_ADDRESS
    
    # orderlimt settings
    AMOUNT_OF_TOKENS_TO_SWAP=100 # 100% OF TOTAL TOKEN BALANCE
    EXPECTED_PERCENTAGE_PROFIT=50 # 50% POSITIVE PRICE CHANGE
    RERUN_EVERY=5000 # 5000 MILLISECONDS IS 5 SECONDS
    
    # rpc server settings
    RPC_ENDPOINT=https://soft-black-spring.solana-devnet.quiknode.pro/f3b013124ab80a7efe10d3eaff33c9fa9e447a0d/
    RPC_WS_ENDPOINT=wss://soft-black-spring.solana-devnet.quiknode.pro/f3b013124ab80a7efe10d3eaff33c9fa9e447a0d/
    
    # jupiter dex settings
    JUPITER_SWAP_ENDPOINT=https://quote-api.jup.ag/v6/
    JUPITER_PRICE_ENDPOINT='https://price.jup.ag/v4/price?ids='
    
    # wallet settings
    WALLET_PUBLIC_KEY=DH1QDveRcZHHAAyjPCiZkxRWsZ32WTyPUBenMMQe3bdq
    WALLET_PRIVATE_KEY=4jCcmnhGmZN7oZmp1AUJp7HS1XdaVHboxu5og3FV42T5benf8K7U9wHXhZ8isoPwXytrBvcmT8BgomfXAwW6NL4F

## Usage

Once the bot is running, it will automatically monitor the specified tokens' prices and initiate a sell order when the selling price meets the configured threshold.
Support

For any questions, issues, or feature requests, please open an issue on GitHub.
