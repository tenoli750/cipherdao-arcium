use arcis::*;

#[encrypted]
mod private_vote {
    use arcis::*;

    pub const MAX_VOTES: usize = 8;

    #[derive(Copy, Clone)]
    pub struct VoteInput {
        pub voter_hash: u128,
        pub choice: u8,
    }

    #[derive(Copy, Clone)]
    pub struct VoteSlot {
        pub occupied: bool,
        pub voter_hash: u128,
        pub choice: u8,
    }

    #[derive(Copy, Clone)]
    pub struct BallotState {
        pub proposal_id: u64,
        pub slots: [VoteSlot; MAX_VOTES],
    }

    #[derive(Copy, Clone)]
    pub struct PublicTally {
        pub yes: u16,
        pub no: u16,
        pub abstain: u16,
        pub total: u16,
    }

    #[instruction]
    pub fn init_private_ballot(proposal_id: u64) -> Enc<Mxe, BallotState> {
        let empty_slot = VoteSlot {
            occupied: false,
            voter_hash: 0,
            choice: 2,
        };
        let state = BallotState {
            proposal_id,
            slots: [empty_slot; MAX_VOTES],
        };

        Mxe::get().from_arcis(state)
    }

    #[instruction]
    pub fn cast_private_vote(
        state_ctxt: Enc<Mxe, BallotState>,
        vote_ctxt: Enc<Shared, VoteInput>,
        proposal_open: bool,
    ) -> Enc<Mxe, BallotState> {
        let mut state = state_ctxt.to_arcis();
        let vote = vote_ctxt.to_arcis();
        let valid_choice = vote.choice <= 2;
        let can_vote = proposal_open && valid_choice;

        let mut written = false;

        for i in 0..MAX_VOTES {
            let same_voter = state.slots[i].occupied && state.slots[i].voter_hash == vote.voter_hash;
            if can_vote && same_voter {
                state.slots[i].choice = vote.choice;
            }
            written = written || same_voter;
        }

        for i in 0..MAX_VOTES {
            let empty_slot = !state.slots[i].occupied;
            let should_insert = can_vote && !written && empty_slot;
            if should_insert {
                state.slots[i].occupied = true;
                state.slots[i].voter_hash = vote.voter_hash;
                state.slots[i].choice = vote.choice;
            }
            written = written || should_insert;
        }

        state_ctxt.owner.from_arcis(state)
    }

    #[instruction]
    pub fn publish_private_tally(state_ctxt: Enc<Mxe, BallotState>) -> PublicTally {
        let state = state_ctxt.to_arcis();
        let mut yes: u16 = 0;
        let mut no: u16 = 0;
        let mut abstain: u16 = 0;
        let mut total: u16 = 0;

        for i in 0..MAX_VOTES {
            let active = state.slots[i].occupied;
            if active {
                total += 1;
            }
            if active && state.slots[i].choice == 0 {
                yes += 1;
            }
            if active && state.slots[i].choice == 1 {
                no += 1;
            }
            if active && state.slots[i].choice == 2 {
                abstain += 1;
            }
        }

        PublicTally {
            yes: yes.reveal(),
            no: no.reveal(),
            abstain: abstain.reveal(),
            total: total.reveal(),
        }
    }
}
