# Higher or Lower Crypto Challenge - Smart Contracts

This directory contains the Cairo smart contracts for the Higher or Lower Crypto Challenge, designed to run on Starknet.

## Contracts

- `GameStake.cairo`: Handles token deposits and withdrawals for games, as well as reward distribution to winners.

## Features

- Secure token staking for games
- Controlled reward distribution to winners
- Emergency withdrawal mechanism
- Role-based access control

## Setup

1. Install [Scarb](https://docs.swmansion.com/scarb/download.html), the Cairo package manager

2. Build the contracts:
```bash
scarb build
```

3. Test the contracts:
```bash
scarb test
```

## Deployment

To deploy the contracts to Starknet testnet:

1. Compile the contract:
```bash
scarb build
```

2. Deploy using starkli or similar tools:
```bash
starkli declare ./target/dev/crypto_higher_lower_GameStake.sierra.json
starkli deploy <CLASS_HASH> <ADMIN_ADDRESS>
```

## Contract Design

### GameStake

The main contract for handling stakes and rewards in the game. It has three main functions:

1. `submit_stake`: Allows players to submit tokens as stakes for a game
2. `distribute_reward`: Called by the game administrator to distribute rewards to winners
3. `emergency_withdraw`: Allows players to withdraw their stakes in case of emergency

The contract maintains a mapping of stakes by player address and game ID, and tracks the total amount staked. 