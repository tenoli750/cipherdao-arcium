use arcis::*;

#[encrypted]
mod private_vote {
    use arcis::*;

    #[derive(Copy, Clone)]
    pub struct VoteInput {
        pub voter_hash: u128,
        pub choice: u8,
    }

    #[derive(Copy, Clone)]
    pub struct BallotState {
        pub proposal_id: u64,
        pub yes: u16,
        pub no: u16,
        pub abstain: u16,
        pub total: u16,
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
        let state = BallotState {
            proposal_id,
            yes: 0,
            no: 0,
            abstain: 0,
            total: 0,
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
        let _voter_hash = vote.voter_hash;
        let valid_choice = vote.choice <= 2;
        let can_vote = proposal_open && valid_choice;

        if can_vote && vote.choice == 0 {
            state.yes += 1;
        }
        if can_vote && vote.choice == 1 {
            state.no += 1;
        }
        if can_vote && vote.choice == 2 {
            state.abstain += 1;
        }
        if can_vote {
            state.total += 1;
        }

        state_ctxt.owner.from_arcis(state)
    }

    #[instruction]
    pub fn publish_private_tally(state_ctxt: Enc<Mxe, BallotState>) -> PublicTally {
        let state = state_ctxt.to_arcis();

        PublicTally {
            yes: state.yes.reveal(),
            no: state.no.reveal(),
            abstain: state.abstain.reveal(),
            total: state.total.reveal(),
        }
    }
}
