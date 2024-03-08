use anchor_lang::prelude::*;

mod instructions;
mod state;
mod utils;

use crate::instructions::*;

declare_id!("hackF7pNZ7dGZCGXaiPNnzxkSoyrBkyEyDTpywK9KJs");

#[program]
pub mod bestlend {
    use super::*;

    pub fn init_account(
        ctx: Context<InitAccount>,
        collateral_group: u8,
        debt_group: u8,
    ) -> Result<()> {
        handle_init_account::init_account(ctx, collateral_group, debt_group)
    }

    pub fn init_klend_account(ctx: Context<InitKlendAccount>) -> Result<()> {
        handle_init_account::init_klend_account(ctx)
    }

    pub fn klend_deposit(ctx: Context<KlendDeposit>, amount: u64) -> Result<()> {
        handle_klend_deposit::process(ctx, amount)
    }

    pub fn klend_withdraw(ctx: Context<KlendWithdraw>, amount: u64) -> Result<()> {
        handle_klend_withdraw::process(ctx, amount)
    }

    pub fn klend_borrow(ctx: Context<KlendBorrow>, amount: u64) -> Result<()> {
        handle_klend_borrow::process(ctx, amount)
    }
}

#[error_code]
pub enum BestLendError {
    #[msg("Asset groups cannot be the same")]
    MatchingAssetGroups,
    #[msg("Invalid oracle price")]
    PriceNotValid,
    #[msg("Remaining account missing")]
    MissingAccount,
    #[msg("Unexpected token account owner")]
    InvalidTokenAccountOwner,
}
