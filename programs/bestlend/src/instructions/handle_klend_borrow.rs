use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};
use kamino_lending::{cpi::accounts::BorrowObligationLiquidity, program::KaminoLending};

use crate::{state::BestLendUserAccount, utils::consts::PERFORMER_PUBKEY};

pub fn process(ctx: Context<KlendBorrow>, amount: u64) -> Result<()> {
    let owner_key = ctx.accounts.bestlend_user_account.owner.key();
    let signer_seeds: &[&[u8]] = &[
        b"bestlend_user_account",
        owner_key.as_ref(),
        &[*ctx.bumps.get("bestlend_user_account").unwrap()],
    ];

    kamino_lending::cpi::borrow_obligation_liquidity(
        CpiContext::new_with_signer(
            ctx.accounts.klend_program.to_account_info(),
            BorrowObligationLiquidity {
                owner: ctx.accounts.bestlend_user_account.to_account_info(),
                obligation: ctx.accounts.obligation.to_account_info(),
                lending_market: ctx.accounts.lending_market.to_account_info(),
                lending_market_authority: ctx.accounts.lending_market_authority.to_account_info(),
                borrow_reserve: ctx.accounts.reserve.to_account_info(),
                token_program: ctx.accounts.token_program.to_account_info(),
                reserve_source_liquidity: ctx.accounts.reserve_source_liquidity.to_account_info(),
                borrow_reserve_liquidity_fee_receiver: ctx
                    .accounts
                    .borrow_reserve_liquidity_fee_receiver
                    .to_account_info(),
                user_destination_liquidity: ctx
                    .accounts
                    .user_destination_liquidity
                    .to_account_info(),
                referrer_token_state: Option::None,
                instruction_sysvar_account: ctx
                    .accounts
                    .instruction_sysvar_account
                    .to_account_info(),
            },
            &[signer_seeds],
        ),
        amount,
    )?;

    Ok(())
}

#[derive(Accounts)]
pub struct KlendBorrow<'info> {
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

    #[account(mut)]
    pub user_destination_liquidity: Account<'info, TokenAccount>,

    /*
     * klend accounts
     */
    pub klend_program: Program<'info, KaminoLending>,
    /// CHECK: devnet demo
    #[account(mut)]
    pub obligation: AccountInfo<'info>,
    /// CHECK: devnet demo
    pub lending_market: AccountInfo<'info>,
    #[account(mut)]
    /// CHECK: devnet demo
    pub reserve: AccountInfo<'info>,
    /// CHECK: just authority
    pub lending_market_authority: AccountInfo<'info>,
    /// CHECK: devnet demo
    pub instruction_sysvar_account: AccountInfo<'info>,
    #[account(mut)]
    /// CHECK: devnet demo
    pub reserve_source_liquidity: AccountInfo<'info>,
    #[account(mut)]
    /// CHECK: devnet demo
    pub borrow_reserve_liquidity_fee_receiver: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
}
