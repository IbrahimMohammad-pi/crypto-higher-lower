#[starknet::contract]
mod GameStake {
    use starknet::ContractAddress;
    use starknet::{get_caller_address, get_contract_address};
    use starknet::class_hash::ClassHash;

    #[storage]
    struct Storage {
        admin: ContractAddress,
        stakes: LegacyMap<(ContractAddress, u256), u256>,
        total_staked: u256,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        StakeSubmitted: StakeSubmitted,
        RewardDistributed: RewardDistributed,
        EmergencyWithdrawal: EmergencyWithdrawal,
    }

    #[derive(Drop, starknet::Event)]
    struct StakeSubmitted {
        player: ContractAddress,
        game_id: u256,
        amount: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct RewardDistributed {
        winner: ContractAddress,
        game_id: u256,
        amount: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct EmergencyWithdrawal {
        player: ContractAddress,
        game_id: u256,
        amount: u256,
    }

    #[constructor]
    fn constructor(ref self: ContractState, admin_address: ContractAddress) {
        self.admin.write(admin_address);
        self.total_staked.write(0);
    }

    #[external(v0)]
    fn submit_stake(ref self: ContractState, game_id: u256, amount: u256) {
        // TODO: Implement stake submission logic
        // Validate inputs
        assert(amount > 0, 'Stake amount must be positive');

        // Get caller address
        let player = get_caller_address();

        // Record the stake
        self.stakes.write((player, game_id), amount);

        // Update total staked
        let current_total = self.total_staked.read();
        self.total_staked.write(current_total + amount);

        // Emit event
        self.emit(Event::StakeSubmitted(StakeSubmitted { player, game_id, amount }));
    }

    #[external(v0)]
    fn distribute_reward(
        ref self: ContractState, winner: ContractAddress, game_id: u256, amount: u256
    ) {
        // Ensure only admin can call this function
        let caller = get_caller_address();
        assert(caller == self.admin.read(), 'Only admin can distribute rewards');

        // TODO: Implement reward distribution logic
        // Validate inputs
        assert(amount > 0, 'Reward amount must be positive');

        // Update total staked
        let current_total = self.total_staked.read();
        assert(current_total >= amount, 'Insufficient funds');
        self.total_staked.write(current_total - amount);

        // Emit event
        self.emit(
            Event::RewardDistributed(RewardDistributed { winner, game_id, amount })
        );
    }

    #[external(v0)]
    fn emergency_withdraw(ref self: ContractState, game_id: u256) {
        // Get caller address
        let player = get_caller_address();

        // Get the stake amount
        let stake_amount = self.stakes.read((player, game_id));
        assert(stake_amount > 0, 'No stake found');

        // Remove the stake
        self.stakes.write((player, game_id), 0);

        // Update total staked
        let current_total = self.total_staked.read();
        self.total_staked.write(current_total - stake_amount);

        // Emit event
        self.emit(
            Event::EmergencyWithdrawal(EmergencyWithdrawal { player, game_id, amount: stake_amount })
        );
    }
} 