use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount};
use kamino_lending::{
    cpi::accounts::DepositReserveLiquidityAndObligationCollateral, program::KaminoLending,
};

use crate::{state::BestLendUserAccount, utils::consts::PERFORMER_PUBKEY};

pub fn process(ctx: Context<KlendDeposit>, liquidity_amount: u64) -> Result<()> {
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
        liquidity_amount,
    )?;

    let owner_key = ctx.accounts.bestlend_user_account.owner.key();
    let signer_seeds: &[&[u8]] = &[
        b"bestlend_user_account",
        owner_key.as_ref(),
        &[*ctx.bumps.get("bestlend_user_account").unwrap()],
    ];

    kamino_lending::cpi::deposit_reserve_liquidity_and_obligation_collateral(
        CpiContext::new_with_signer(
            ctx.accounts.klend_program.to_account_info(),
            DepositReserveLiquidityAndObligationCollateral {
                owner: ctx.accounts.bestlend_user_account.to_account_info(),
                obligation: ctx.accounts.obligation.to_account_info(),
                lending_market: ctx.accounts.lending_market.to_account_info(),
                lending_market_authority: ctx.accounts.lending_market_authority.to_account_info(),
                reserve: ctx.accounts.reserve.to_account_info(),
                reserve_liquidity_supply: ctx.accounts.reserve_liquidity_supply.to_account_info(),
                reserve_collateral_mint: ctx.accounts.reserve_collateral_mint.to_account_info(),
                reserve_destination_deposit_collateral: ctx
                    .accounts
                    .reserve_destination_deposit_collateral
                    .to_account_info(),
                user_source_liquidity: ctx
                    .accounts
                    .bestlend_user_source_liquidity
                    .to_account_info(),
                user_destination_collateral: ctx
                    .accounts
                    .user_destination_collateral
                    .to_account_info(),
                token_program: ctx.accounts.token_program.to_account_info(),
                instruction_sysvar_account: ctx
                    .accounts
                    .instruction_sysvar_account
                    .to_account_info(),
            },
            &[signer_seeds],
        ),
        liquidity_amount,
    )?;

    Ok(())
}

#[derive(Accounts)]
pub struct KlendDeposit<'info> {
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

    pub token_program: Program<'info, Token>,

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
    #[account(mut)]
    /// CHECK: devnet demo
    pub reserve_liquidity_supply: AccountInfo<'info>,
    #[account(mut)]
    /// CHECK: devnet demo
    pub reserve_collateral_mint: AccountInfo<'info>,
    #[account(mut)]
    /// CHECK: devnet demo
    pub reserve_destination_deposit_collateral: AccountInfo<'info>,
    /// CHECK: just authority
    pub lending_market_authority: AccountInfo<'info>,
    #[account(mut)]
    /// CHECK: devnet demo
    pub user_destination_collateral: AccountInfo<'info>,
    /// CHECK: devnet demo
    pub instruction_sysvar_account: AccountInfo<'info>,
}
