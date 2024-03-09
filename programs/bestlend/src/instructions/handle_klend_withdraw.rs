use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};
use kamino_lending::{
    cpi::accounts::WithdrawObligationCollateralAndRedeemReserveCollateral, program::KaminoLending,
};

use crate::{state::BestLendUserAccount, utils::consts::PERFORMER_PUBKEY};

pub fn process(ctx: Context<KlendWithdraw>, amount: u64) -> Result<()> {
    // make the sure appropriate pre and post ixs are present
    if ctx.accounts.signer.key().eq(&PERFORMER_PUBKEY) {}

    let owner_key = ctx.accounts.bestlend_user_account.owner.key();
    let signer_seeds: &[&[u8]] = &[
        b"bestlend_user_account",
        owner_key.as_ref(),
        &[*ctx.bumps.get("bestlend_user_account").unwrap()],
    ];

    kamino_lending::cpi::withdraw_obligation_collateral_and_redeem_reserve_collateral(
        CpiContext::new_with_signer(
            ctx.accounts.klend_program.to_account_info(),
            WithdrawObligationCollateralAndRedeemReserveCollateral {
                owner: ctx.accounts.bestlend_user_account.to_account_info(),
                obligation: ctx.accounts.obligation.to_account_info(),
                lending_market: ctx.accounts.lending_market.to_account_info(),
                lending_market_authority: ctx.accounts.lending_market_authority.to_account_info(),
                withdraw_reserve: ctx.accounts.reserve.to_account_info(),
                reserve_liquidity_supply: ctx.accounts.reserve_liquidity_supply.to_account_info(),
                reserve_collateral_mint: ctx.accounts.reserve_collateral_mint.to_account_info(),
                user_destination_collateral: ctx
                    .accounts
                    .user_destination_collateral
                    .to_account_info(),
                token_program: ctx.accounts.token_program.to_account_info(),
                instruction_sysvar_account: ctx
                    .accounts
                    .instruction_sysvar_account
                    .to_account_info(),
                user_destination_liquidity: ctx
                    .accounts
                    .user_destination_liquidity
                    .to_account_info(),
                reserve_source_collateral: ctx
                    .accounts
                    .reserve_source_deposit_collateral
                    .to_account_info(),
            },
            &[signer_seeds],
        ),
        amount,
    )?;

    Ok(())
}

#[derive(Accounts)]
pub struct KlendWithdraw<'info> {
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
    pub reserve_source_deposit_collateral: AccountInfo<'info>,
    /// CHECK: just authority
    pub lending_market_authority: AccountInfo<'info>,
    #[account(mut)]
    /// CHECK: devnet demo
    pub user_destination_collateral: AccountInfo<'info>,
    /// CHECK: devnet demo
    pub instruction_sysvar_account: AccountInfo<'info>,
}
