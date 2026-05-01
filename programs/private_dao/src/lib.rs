use anchor_lang::prelude::*;
use arcium_anchor::prelude::*;
use arcium_client::idl::arcium::types::{CircuitSource, OffChainCircuitSource};
use arcium_macros::circuit_hash;

declare_id!("BasNpiyU8fAv9zYjZxS59p47tSKLA2UbJCWJu6vGPqUV");

const COMP_DEF_OFFSET_CAST_PRIVATE_VOTE: u32 = comp_def_offset("cast_private_vote");
const COMP_DEF_OFFSET_INIT_PRIVATE_BALLOT: u32 = comp_def_offset("init_private_ballot");
const COMP_DEF_OFFSET_PUBLISH_PRIVATE_TALLY: u32 = comp_def_offset("publish_private_tally");

#[arcium_program]
pub mod private_dao {
    use super::*;

    pub fn initialize_dao(ctx: Context<InitializeDao>, authority: Pubkey) -> Result<()> {
        let dao = &mut ctx.accounts.dao;
        dao.authority = authority;
        dao.proposal_count = 0;
        Ok(())
    }

    pub fn create_proposal(
        ctx: Context<CreateProposal>,
        proposal_id: u64,
        title_hash: [u8; 32],
        closes_at: i64,
    ) -> Result<()> {
        require!(
            closes_at > Clock::get()?.unix_timestamp,
            ErrorCode::InvalidCloseTime
        );

        let dao = &mut ctx.accounts.dao;
        let proposal = &mut ctx.accounts.proposal;
        proposal.dao = dao.key();
        proposal.proposal_id = proposal_id;
        proposal.title_hash = title_hash;
        proposal.closes_at = closes_at;
        proposal.finalized = false;
        proposal.yes = 0;
        proposal.no = 0;
        proposal.abstain = 0;
        proposal.total = 0;
        proposal.encrypted_state_nonce = [0; 16];
        proposal.encrypted_state = Vec::new();
        dao.proposal_count = dao.proposal_count.saturating_add(1);
        Ok(())
    }

    pub fn init_cast_private_vote_comp_def(ctx: Context<InitCastPrivateVoteCompDef>) -> Result<()> {
        init_comp_def(
            ctx.accounts,
            Some(CircuitSource::OffChain(OffChainCircuitSource {
                source: "https://raw.githubusercontent.com/tenoli750/cipherdao-arcium/main/public-circuits/cast_private_vote.arcis".to_string(),
                hash: circuit_hash!("cast_private_vote"),
            })),
            None,
        )?;
        Ok(())
    }

    pub fn init_private_ballot_comp_def(ctx: Context<InitPrivateBallotCompDef>) -> Result<()> {
        init_comp_def(
            ctx.accounts,
            Some(CircuitSource::OffChain(OffChainCircuitSource {
                source: "https://raw.githubusercontent.com/tenoli750/cipherdao-arcium/main/public-circuits/init_private_ballot.arcis".to_string(),
                hash: circuit_hash!("init_private_ballot"),
            })),
            None,
        )?;
        Ok(())
    }

    pub fn init_publish_private_tally_comp_def(
        ctx: Context<InitPublishPrivateTallyCompDef>,
    ) -> Result<()> {
        init_comp_def(
            ctx.accounts,
            Some(CircuitSource::OffChain(OffChainCircuitSource {
                source: "https://raw.githubusercontent.com/tenoli750/cipherdao-arcium/main/public-circuits/publish_private_tally.arcis".to_string(),
                hash: circuit_hash!("publish_private_tally"),
            })),
            None,
        )?;
        Ok(())
    }

    pub fn init_private_ballot(
        ctx: Context<InitPrivateBallot>,
        computation_offset: u64,
    ) -> Result<()> {
        require!(
            ctx.accounts.proposal.encrypted_state.is_empty(),
            ErrorCode::BallotAlreadyInitialized
        );

        ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;
        let args = ArgBuilder::new()
            .plaintext_u64(ctx.accounts.proposal.proposal_id)
            .build();

        queue_computation(
            ctx.accounts,
            computation_offset,
            args,
            vec![InitPrivateBallotCallback::callback_ix(
                computation_offset,
                &ctx.accounts.mxe_account,
                &[],
            )?],
            1,
            0,
        )?;

        Ok(())
    }

    pub fn cast_private_vote(
        ctx: Context<CastPrivateVote>,
        computation_offset: u64,
        state_nonce: u128,
        vote_voter_hash: [u8; 32],
        vote_choice: [u8; 32],
        voter_pubkey: [u8; 32],
        voter_nonce: u128,
    ) -> Result<()> {
        let proposal_open = Clock::get()?.unix_timestamp < ctx.accounts.proposal.closes_at;
        require!(proposal_open, ErrorCode::ProposalClosed);
        require!(
            !ctx.accounts.proposal.encrypted_state.is_empty(),
            ErrorCode::BallotNotInitialized
        );

        let mut args = ArgBuilder::new().plaintext_u128(state_nonce);

        for chunk in ctx.accounts.proposal.encrypted_state.iter() {
            args = args.encrypted_u128(*chunk);
        }

        let args = args
            .x25519_pubkey(voter_pubkey)
            .plaintext_u128(voter_nonce)
            .encrypted_u128(vote_voter_hash)
            .encrypted_u8(vote_choice)
            .plaintext_bool(proposal_open)
            .build();

        ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;
        queue_computation(
            ctx.accounts,
            computation_offset,
            args,
            vec![CastPrivateVoteCallback::callback_ix(
                computation_offset,
                &ctx.accounts.mxe_account,
                &[],
            )?],
            1,
            0,
        )?;

        Ok(())
    }

    pub fn publish_private_tally(
        ctx: Context<PublishPrivateTally>,
        computation_offset: u64,
        state_nonce: u128,
    ) -> Result<()> {
        require!(
            Clock::get()?.unix_timestamp >= ctx.accounts.proposal.closes_at,
            ErrorCode::ProposalStillOpen
        );
        require!(
            !ctx.accounts.proposal.finalized,
            ErrorCode::AlreadyFinalized
        );
        require!(
            !ctx.accounts.proposal.encrypted_state.is_empty(),
            ErrorCode::BallotNotInitialized
        );

        let mut args = ArgBuilder::new().plaintext_u128(state_nonce);
        for chunk in ctx.accounts.proposal.encrypted_state.iter() {
            args = args.encrypted_u128(*chunk);
        }

        ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;
        queue_computation(
            ctx.accounts,
            computation_offset,
            args.build(),
            vec![PublishPrivateTallyCallback::callback_ix(
                computation_offset,
                &ctx.accounts.mxe_account,
                &[],
            )?],
            1,
            0,
        )?;

        Ok(())
    }

    #[arcium_callback(encrypted_ix = "cast_private_vote")]
    pub fn cast_private_vote_callback(
        ctx: Context<CastPrivateVoteCallback>,
        output: SignedComputationOutputs<CastPrivateVoteOutput>,
    ) -> Result<()> {
        let result = match output.verify_output(
            &ctx.accounts.cluster_account,
            &ctx.accounts.computation_account,
        ) {
            Ok(CastPrivateVoteOutput { field_0 }) => field_0,
            Err(_) => return Err(ErrorCode::AbortedComputation.into()),
        };

        let proposal = &mut ctx.accounts.proposal;
        proposal.encrypted_state_nonce = result.nonce.to_le_bytes();
        proposal.encrypted_state = result.ciphertexts.to_vec();

        emit!(EncryptedVoteCast {
            proposal: proposal.key(),
            ciphertext_count: proposal.encrypted_state.len() as u16,
        });

        Ok(())
    }

    #[arcium_callback(encrypted_ix = "init_private_ballot")]
    pub fn init_private_ballot_callback(
        ctx: Context<InitPrivateBallotCallback>,
        output: SignedComputationOutputs<InitPrivateBallotOutput>,
    ) -> Result<()> {
        let result = match output.verify_output(
            &ctx.accounts.cluster_account,
            &ctx.accounts.computation_account,
        ) {
            Ok(InitPrivateBallotOutput { field_0 }) => field_0,
            Err(_) => return Err(ErrorCode::AbortedComputation.into()),
        };

        let proposal = &mut ctx.accounts.proposal;
        proposal.encrypted_state_nonce = result.nonce.to_le_bytes();
        proposal.encrypted_state = result.ciphertexts.to_vec();

        emit!(PrivateBallotInitialized {
            proposal: proposal.key(),
            ciphertext_count: proposal.encrypted_state.len() as u16,
        });

        Ok(())
    }

    #[arcium_callback(encrypted_ix = "publish_private_tally")]
    pub fn publish_private_tally_callback(
        ctx: Context<PublishPrivateTallyCallback>,
        output: SignedComputationOutputs<PublishPrivateTallyOutput>,
    ) -> Result<()> {
        let result = match output.verify_output(
            &ctx.accounts.cluster_account,
            &ctx.accounts.computation_account,
        ) {
            Ok(PublishPrivateTallyOutput { field_0 }) => field_0,
            Err(_) => return Err(ErrorCode::AbortedComputation.into()),
        };

        let proposal = &mut ctx.accounts.proposal;
        proposal.yes = result.field_0;
        proposal.no = result.field_1;
        proposal.abstain = result.field_2;
        proposal.total = result.field_3;
        proposal.finalized = true;

        emit!(TallyPublished {
            proposal: proposal.key(),
            yes: proposal.yes,
            no: proposal.no,
            abstain: proposal.abstain,
            total: proposal.total,
        });

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeDao<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init,
        payer = payer,
        space = 8 + Dao::INIT_SPACE,
        seeds = [b"dao"],
        bump
    )]
    pub dao: Account<'info, Dao>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(proposal_id: u64)]
pub struct CreateProposal<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut, seeds = [b"dao"], bump)]
    pub dao: Account<'info, Dao>,
    #[account(
        init,
        payer = payer,
        space = 8 + Proposal::INIT_SPACE,
        seeds = [b"proposal", dao.key().as_ref(), &proposal_id.to_le_bytes()],
        bump
    )]
    pub proposal: Account<'info, Proposal>,
    pub system_program: Program<'info, System>,
}

#[init_computation_definition_accounts("cast_private_vote", payer)]
#[derive(Accounts)]
pub struct InitCastPrivateVoteCompDef<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(mut)]
    /// CHECK: comp_def_account, checked by arcium program.
    pub comp_def_account: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_mxe_lut_pda!(mxe_account.lut_offset_slot)
    )]
    /// CHECK: address_lookup_table, checked by arcium program.
    pub address_lookup_table: UncheckedAccount<'info>,
    #[account(address = LUT_PROGRAM_ID)]
    /// CHECK: lut_program is the Address Lookup Table program.
    pub lut_program: UncheckedAccount<'info>,
    pub arcium_program: Program<'info, Arcium>,
    pub system_program: Program<'info, System>,
}

#[init_computation_definition_accounts("init_private_ballot", payer)]
#[derive(Accounts)]
pub struct InitPrivateBallotCompDef<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(mut)]
    /// CHECK: comp_def_account, checked by arcium program.
    pub comp_def_account: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_mxe_lut_pda!(mxe_account.lut_offset_slot)
    )]
    /// CHECK: address_lookup_table, checked by arcium program.
    pub address_lookup_table: UncheckedAccount<'info>,
    #[account(address = LUT_PROGRAM_ID)]
    /// CHECK: lut_program is the Address Lookup Table program.
    pub lut_program: UncheckedAccount<'info>,
    pub arcium_program: Program<'info, Arcium>,
    pub system_program: Program<'info, System>,
}

#[init_computation_definition_accounts("publish_private_tally", payer)]
#[derive(Accounts)]
pub struct InitPublishPrivateTallyCompDef<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(mut)]
    /// CHECK: comp_def_account, checked by arcium program.
    pub comp_def_account: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_mxe_lut_pda!(mxe_account.lut_offset_slot)
    )]
    /// CHECK: address_lookup_table, checked by arcium program.
    pub address_lookup_table: UncheckedAccount<'info>,
    #[account(address = LUT_PROGRAM_ID)]
    /// CHECK: lut_program is the Address Lookup Table program.
    pub lut_program: UncheckedAccount<'info>,
    pub arcium_program: Program<'info, Arcium>,
    pub system_program: Program<'info, System>,
}

#[queue_computation_accounts("cast_private_vote", payer)]
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct CastPrivateVote<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut)]
    pub proposal: Account<'info, Proposal>,
    #[account(
        init_if_needed,
        space = 9,
        payer = payer,
        seeds = [&SIGN_PDA_SEED],
        bump,
        address = derive_sign_pda!(),
    )]
    pub sign_pda_account: Account<'info, ArciumSignerAccount>,
    #[account(address = derive_mxe_pda!())]
    pub mxe_account: Account<'info, MXEAccount>,
    #[account(
        mut,
        address = derive_mempool_pda!(mxe_account, ErrorCode::ClusterNotSet)
    )]
    /// CHECK: mempool_account, checked by arcium program.
    pub mempool_account: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_execpool_pda!(mxe_account, ErrorCode::ClusterNotSet)
    )]
    /// CHECK: executing_pool, checked by arcium program.
    pub executing_pool: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_comp_pda!(computation_offset, mxe_account, ErrorCode::ClusterNotSet)
    )]
    /// CHECK: computation_account, checked by arcium program.
    pub computation_account: UncheckedAccount<'info>,
    #[account(address = derive_comp_def_pda!(COMP_DEF_OFFSET_CAST_PRIVATE_VOTE))]
    pub comp_def_account: Account<'info, ComputationDefinitionAccount>,
    #[account(
        mut,
        address = derive_cluster_pda!(mxe_account, ErrorCode::ClusterNotSet)
    )]
    pub cluster_account: Account<'info, Cluster>,
    #[account(
        mut,
        address = ARCIUM_FEE_POOL_ACCOUNT_ADDRESS,
    )]
    pub pool_account: Account<'info, FeePool>,
    #[account(
        mut,
        address = ARCIUM_CLOCK_ACCOUNT_ADDRESS
    )]
    pub clock_account: Account<'info, ClockAccount>,
    pub system_program: Program<'info, System>,
    pub arcium_program: Program<'info, Arcium>,
}

#[queue_computation_accounts("init_private_ballot", payer)]
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct InitPrivateBallot<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut)]
    pub proposal: Account<'info, Proposal>,
    #[account(
        init_if_needed,
        space = 9,
        payer = payer,
        seeds = [&SIGN_PDA_SEED],
        bump,
        address = derive_sign_pda!(),
    )]
    pub sign_pda_account: Account<'info, ArciumSignerAccount>,
    #[account(address = derive_mxe_pda!())]
    pub mxe_account: Account<'info, MXEAccount>,
    #[account(
        mut,
        address = derive_mempool_pda!(mxe_account, ErrorCode::ClusterNotSet)
    )]
    /// CHECK: mempool_account, checked by arcium program.
    pub mempool_account: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_execpool_pda!(mxe_account, ErrorCode::ClusterNotSet)
    )]
    /// CHECK: executing_pool, checked by arcium program.
    pub executing_pool: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_comp_pda!(computation_offset, mxe_account, ErrorCode::ClusterNotSet)
    )]
    /// CHECK: computation_account, checked by arcium program.
    pub computation_account: UncheckedAccount<'info>,
    #[account(address = derive_comp_def_pda!(COMP_DEF_OFFSET_INIT_PRIVATE_BALLOT))]
    pub comp_def_account: Account<'info, ComputationDefinitionAccount>,
    #[account(
        mut,
        address = derive_cluster_pda!(mxe_account, ErrorCode::ClusterNotSet)
    )]
    pub cluster_account: Account<'info, Cluster>,
    #[account(
        mut,
        address = ARCIUM_FEE_POOL_ACCOUNT_ADDRESS,
    )]
    pub pool_account: Account<'info, FeePool>,
    #[account(
        mut,
        address = ARCIUM_CLOCK_ACCOUNT_ADDRESS
    )]
    pub clock_account: Account<'info, ClockAccount>,
    pub system_program: Program<'info, System>,
    pub arcium_program: Program<'info, Arcium>,
}

#[queue_computation_accounts("publish_private_tally", payer)]
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct PublishPrivateTally<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut)]
    pub proposal: Account<'info, Proposal>,
    #[account(
        init_if_needed,
        space = 9,
        payer = payer,
        seeds = [&SIGN_PDA_SEED],
        bump,
        address = derive_sign_pda!(),
    )]
    pub sign_pda_account: Account<'info, ArciumSignerAccount>,
    #[account(address = derive_mxe_pda!())]
    pub mxe_account: Account<'info, MXEAccount>,
    #[account(
        mut,
        address = derive_mempool_pda!(mxe_account, ErrorCode::ClusterNotSet)
    )]
    /// CHECK: mempool_account, checked by arcium program.
    pub mempool_account: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_execpool_pda!(mxe_account, ErrorCode::ClusterNotSet)
    )]
    /// CHECK: executing_pool, checked by arcium program.
    pub executing_pool: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_comp_pda!(computation_offset, mxe_account, ErrorCode::ClusterNotSet)
    )]
    /// CHECK: computation_account, checked by arcium program.
    pub computation_account: UncheckedAccount<'info>,
    #[account(address = derive_comp_def_pda!(COMP_DEF_OFFSET_PUBLISH_PRIVATE_TALLY))]
    pub comp_def_account: Account<'info, ComputationDefinitionAccount>,
    #[account(
        mut,
        address = derive_cluster_pda!(mxe_account, ErrorCode::ClusterNotSet)
    )]
    pub cluster_account: Account<'info, Cluster>,
    #[account(
        mut,
        address = ARCIUM_FEE_POOL_ACCOUNT_ADDRESS,
    )]
    pub pool_account: Account<'info, FeePool>,
    #[account(
        mut,
        address = ARCIUM_CLOCK_ACCOUNT_ADDRESS
    )]
    pub clock_account: Account<'info, ClockAccount>,
    pub system_program: Program<'info, System>,
    pub arcium_program: Program<'info, Arcium>,
}

#[callback_accounts("cast_private_vote")]
#[derive(Accounts)]
pub struct CastPrivateVoteCallback<'info> {
    #[account(mut)]
    pub proposal: Account<'info, Proposal>,
    pub arcium_program: Program<'info, Arcium>,
    #[account(address = derive_comp_def_pda!(COMP_DEF_OFFSET_CAST_PRIVATE_VOTE))]
    pub comp_def_account: Account<'info, ComputationDefinitionAccount>,
    #[account(address = derive_mxe_pda!())]
    pub mxe_account: Account<'info, MXEAccount>,
    /// CHECK: Checked by Arcium callback verification.
    pub computation_account: UncheckedAccount<'info>,
    #[account(address = derive_cluster_pda!(mxe_account, ErrorCode::ClusterNotSet))]
    pub cluster_account: Account<'info, Cluster>,
    #[account(address = ::anchor_lang::solana_program::sysvar::instructions::ID)]
    /// CHECK: instructions sysvar.
    pub instructions_sysvar: AccountInfo<'info>,
}

#[callback_accounts("init_private_ballot")]
#[derive(Accounts)]
pub struct InitPrivateBallotCallback<'info> {
    #[account(mut)]
    pub proposal: Account<'info, Proposal>,
    pub arcium_program: Program<'info, Arcium>,
    #[account(address = derive_comp_def_pda!(COMP_DEF_OFFSET_INIT_PRIVATE_BALLOT))]
    pub comp_def_account: Account<'info, ComputationDefinitionAccount>,
    #[account(address = derive_mxe_pda!())]
    pub mxe_account: Account<'info, MXEAccount>,
    /// CHECK: Checked by Arcium callback verification.
    pub computation_account: UncheckedAccount<'info>,
    #[account(address = derive_cluster_pda!(mxe_account, ErrorCode::ClusterNotSet))]
    pub cluster_account: Account<'info, Cluster>,
    #[account(address = ::anchor_lang::solana_program::sysvar::instructions::ID)]
    /// CHECK: instructions sysvar.
    pub instructions_sysvar: AccountInfo<'info>,
}

#[callback_accounts("publish_private_tally")]
#[derive(Accounts)]
pub struct PublishPrivateTallyCallback<'info> {
    #[account(mut)]
    pub proposal: Account<'info, Proposal>,
    pub arcium_program: Program<'info, Arcium>,
    #[account(address = derive_comp_def_pda!(COMP_DEF_OFFSET_PUBLISH_PRIVATE_TALLY))]
    pub comp_def_account: Account<'info, ComputationDefinitionAccount>,
    #[account(address = derive_mxe_pda!())]
    pub mxe_account: Account<'info, MXEAccount>,
    /// CHECK: Checked by Arcium callback verification.
    pub computation_account: UncheckedAccount<'info>,
    #[account(address = derive_cluster_pda!(mxe_account, ErrorCode::ClusterNotSet))]
    pub cluster_account: Account<'info, Cluster>,
    #[account(address = ::anchor_lang::solana_program::sysvar::instructions::ID)]
    /// CHECK: instructions sysvar.
    pub instructions_sysvar: AccountInfo<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct Dao {
    pub authority: Pubkey,
    pub proposal_count: u64,
}

#[account]
#[derive(InitSpace)]
pub struct Proposal {
    pub dao: Pubkey,
    pub proposal_id: u64,
    pub title_hash: [u8; 32],
    pub closes_at: i64,
    pub finalized: bool,
    pub yes: u16,
    pub no: u16,
    pub abstain: u16,
    pub total: u16,
    pub encrypted_state_nonce: [u8; 16],
    #[max_len(256)]
    pub encrypted_state: Vec<[u8; 32]>,
}

#[event]
pub struct EncryptedVoteCast {
    pub proposal: Pubkey,
    pub ciphertext_count: u16,
}

#[event]
pub struct PrivateBallotInitialized {
    pub proposal: Pubkey,
    pub ciphertext_count: u16,
}

#[event]
pub struct TallyPublished {
    pub proposal: Pubkey,
    pub yes: u16,
    pub no: u16,
    pub abstain: u16,
    pub total: u16,
}

#[error_code]
pub enum ErrorCode {
    #[msg("The proposal close time must be in the future.")]
    InvalidCloseTime,
    #[msg("The proposal is closed.")]
    ProposalClosed,
    #[msg("The proposal is still open.")]
    ProposalStillOpen,
    #[msg("The proposal was already finalized.")]
    AlreadyFinalized,
    #[msg("The confidential computation was aborted.")]
    AbortedComputation,
    #[msg("The Arcium cluster is not set.")]
    ClusterNotSet,
    #[msg("The private ballot state is not initialized.")]
    BallotNotInitialized,
    #[msg("The private ballot state is already initialized.")]
    BallotAlreadyInitialized,
}
