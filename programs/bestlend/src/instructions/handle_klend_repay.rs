use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount};
use kamino_lending::{cpi::accounts::RepayObligationLiquidity, program::KaminoLending, Obligation};

use crate::{state::BestLendUserAccount, utils::consts::PERFORMER_PUBKEY};

pub fn process(ctx: Context<KlendRepay>, amount: u64) -> Result<()> {
    // transfer amount to the PDA which owns the obligation
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            anchor_spl::token::Transfer {
                from: ctx.accounts.user_source_liquidity.to_account_info(),
                to: ctx
                    .accounts
                    .bestlend_user_source_liquidity
                    .to_account_info(),
                authority: ctx.accounts.signer.to_account_info(),
            },
        ),
        amount,
    )?;

    let owner_key = ctx.accounts.bestlend_user_account.owner.key();
    let signer_seeds: &[&[u8]] = &[
        b"bestlend_user_account",
        owner_key.as_ref(),
        &[*ctx.bumps.get("bestlend_user_account").unwrap()],
    ];

    kamino_lending::cpi::repay_obligation_liquidity(
        CpiContext::new_with_signer(
            ctx.accounts.klend_program.to_account_info(),
            RepayObligationLiquidity {
                owner: ctx.accounts.bestlend_user_account.to_account_info(),
                obligation: ctx.accounts.obligation.to_account_info(),
                lending_market: ctx.accounts.lending_market.to_account_info(),
                repay_reserve: ctx.accounts.reserve.to_account_info(),
                token_program: ctx.accounts.token_program.to_account_info(),
                user_source_liquidity: ctx
                    .accounts
                    .bestlend_user_source_liquidity
                    .to_account_info(),
                reserve_destination_liquidity: ctx
                    .accounts
                    .reserve_destination_liquidity
                    .to_account_info(),
                instruction_sysvar_account: ctx
                    .accounts
                    .instruction_sysvar_account
                    .to_account_info(),
            },
            &[signer_seeds],
        ),
        amount,
    )?;

    let current_value = ctx
        .accounts
        .bestlend_user_account
        .account_value(ctx.accounts.obligation.load()?, ctx.remaining_accounts)?;

    msg!("current value: {}", current_value);

    Ok(())
}

#[derive(Accounts)]
pub struct KlendRepay<'info> {
    #[account(
        mut,
        constraint = bestlend_user_account.owner.eq(&signer.key()) || signer.key().eq(&PERFORMER_PUBKEY)
    )]
    pub signer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"bestlend_user_account", bestlend_user_account.owner.key().as_ref()],
        bump,
    )]
    pub bestlend_user_account: Account<'info, BestLendUserAccount>,

    #[account(
        mut,
        token::mint = bestlend_user_source_liquidity.mint
    )]
    pub user_source_liquidity: Account<'info, TokenAccount>,

    #[account(
        mut,
        token::mint = user_source_liquidity.mint
    )]
    pub bestlend_user_source_liquidity: Account<'info, TokenAccount>,

    /*
     * klend accounts
     */
    pub klend_program: Program<'info, KaminoLending>,
    /// CHECK: devnet demo
    #[account(mut)]
    pub obligation: AccountLoader<'info, Obligation>,
    /// CHECK: devnet demo
    pub lending_market: AccountInfo<'info>,
    #[account(mut)]
    /// CHECK: devnet demo
    pub reserve: AccountInfo<'info>,
    #[account(mut)]
    /// CHECK: devnet demo
    pub reserve_destination_liquidity: AccountInfo<'info>,
    /// CHECK: devnet demo
    pub instruction_sysvar_account: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
}
