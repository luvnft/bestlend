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
        lookup_table: Pubkey,
    ) -> Result<()> {
        handle_init_account::init_account(ctx, collateral_group, debt_group, lookup_table)
    }

    pub fn pre_action(
        ctx: Context<PreAction>,
        min_account_value: i64,
        min_account_expo: u32,
    ) -> Result<()> {
        handle_action::pre_action(ctx, min_account_value, min_account_expo)
    }

    pub fn post_action(ctx: Context<PostAction>) -> Result<()> {
        handle_action::post_action(ctx)
    }

    /*
     * Kamino Lend instructions
     */
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
    pub fn klend_repay(ctx: Context<KlendRepay>, amount: u64) -> Result<()> {
        handle_klend_repay::process(ctx, amount)
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
    #[msg("Account below expected value")]
    AccountValueBelowMin,
    #[msg("Invalid instruction or intructions in unexpected order")]
    InvalidInstruction,
    #[msg("Invalid program ID on instruction")]
    UnapprovedProgramID,
    #[msg("Missing obligation refresh")]
    MissingObligationRefresh,
}
