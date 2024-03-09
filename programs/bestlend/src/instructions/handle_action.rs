use crate::utils::{action_introspection_checks, min_value_from_pre_action};
use crate::{state::BestLendUserAccount, BestLendError};
use anchor_lang::prelude::*;
use anchor_lang::solana_program::sysvar;
use kamino_lending::Obligation;
use rust_decimal::Decimal;
use rust_decimal_macros::dec;

pub fn pre_action(
    ctx: Context<PreAction>,
    min_account_value: i64,
    min_account_expo: u32,
) -> Result<()> {
    let min_value = Decimal::new(min_account_value, min_account_expo);

    let current_value = ctx.accounts.bestlend_user_account.account_value(
        ctx.accounts.klend_obligation.load()?,
        ctx.remaining_accounts,
    )?;

    // min account value cannot be below current value adjusted for max price impact
    let pi_mul = dec!(1)
        - Decimal::new(
            ctx.accounts.bestlend_user_account.price_impact_bps as i64,
            4,
        );
    let current_value_pi = current_value * pi_mul;

    msg!(
        "current value: {}, current price impact adjusted account value: {}, min account value: {}",
        current_value,
        current_value_pi,
        min_value,
    );

    // min value must be greater than current value with max pi
    require!(
        min_value.ge(&current_value_pi),
        BestLendError::AccountValueBelowMin
    );

    // make sure proceeding ixs are approved and followed by post_action ix
    action_introspection_checks(&ctx.accounts.instructions)?;

    Ok(())
}

pub fn post_action(ctx: Context<PostAction>) -> Result<()> {
    let current_value = ctx.accounts.bestlend_user_account.account_value(
        ctx.accounts.klend_obligation.load()?,
        ctx.remaining_accounts,
    )?;

    let min_value = min_value_from_pre_action(&ctx.accounts.instructions)?;

    // ensure current value is above min
    require!(
        current_value.ge(&min_value),
        BestLendError::AccountValueBelowMin
    );

    Ok(())
}

#[derive(Accounts)]
pub struct PreAction<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        seeds = [b"bestlend_user_account", bestlend_user_account.owner.key().as_ref()],
        bump,
    )]
    pub bestlend_user_account: Account<'info, BestLendUserAccount>,

    pub klend_obligation: AccountLoader<'info, Obligation>,

    /// CHECK: address on account checked
    #[account(address = sysvar::instructions::ID)]
    pub instructions: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct PostAction<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        seeds = [b"bestlend_user_account", bestlend_user_account.owner.key().as_ref()],
        bump,
    )]
    pub bestlend_user_account: Account<'info, BestLendUserAccount>,

    pub klend_obligation: AccountLoader<'info, Obligation>,

    /// CHECK: address on account checked
    #[account(address = sysvar::instructions::ID)]
    pub instructions: UncheckedAccount<'info>,
}
