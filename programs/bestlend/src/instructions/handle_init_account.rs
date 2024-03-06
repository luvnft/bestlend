use crate::{
    state::{AssetGroup, BestLendUserAccount},
    BestLendError,
};
use anchor_lang::prelude::*;
use anchor_spl::token::Token;
use kamino_lending::{
    cpi::accounts::{InitObligation, InitUserMetadata},
    program::KaminoLending,
    InitObligationArgs,
};

pub fn init_account(ctx: Context<InitAccount>, collateral_group: u8, debt_group: u8) -> Result<()> {
    let collateral =
        AssetGroup::try_from(collateral_group).map_err(|_| ProgramError::InvalidInstructionData)?;
    let debt =
        AssetGroup::try_from(debt_group).map_err(|_| ProgramError::InvalidInstructionData)?;

    require!(collateral != debt, BestLendError::MatchingAssetGroups);

    ctx.accounts.bestlend_user_account.address = ctx.accounts.bestlend_user_account.key();
    ctx.accounts.bestlend_user_account.price_impact_bps = BestLendUserAccount::DEFAULT_PI_BPS;
    ctx.accounts.bestlend_user_account.collateral_group = collateral.into();
    ctx.accounts.bestlend_user_account.debt_group = debt.into();

    Ok(())
}

pub fn init_klend_account(ctx: Context<InitKlendAccount>) -> Result<()> {
    let owner_key = ctx.accounts.owner.key();
    let signer_seeds: &[&[u8]] = &[
        b"bestlend_user_account",
        owner_key.as_ref(),
        &[*ctx.bumps.get("bestlend_user_account").unwrap()],
    ];

    // init klend account and create obligation
    kamino_lending::cpi::init_user_metadata(
        CpiContext::new_with_signer(
            ctx.accounts.klend_program.to_account_info(),
            InitUserMetadata {
                owner: ctx.accounts.bestlend_user_account.to_account_info(),
                fee_payer: ctx.accounts.owner.to_account_info(),
                user_metadata: ctx.accounts.user_metadata.to_account_info(),
                referrer_user_metadata: Option::None,
                rent: ctx.accounts.rent.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
            },
            &[signer_seeds],
        ),
        Pubkey::default(), // user_lookup_table
    )?;

    kamino_lending::cpi::init_obligation(
        CpiContext::new_with_signer(
            ctx.accounts.klend_program.to_account_info(),
            InitObligation {
                obligation_owner: ctx.accounts.bestlend_user_account.to_account_info(),
                fee_payer: ctx.accounts.owner.to_account_info(),
                obligation: ctx.accounts.obligation.to_account_info(),
                lending_market: ctx.accounts.lending_market.to_account_info(),
                seed1_account: ctx.accounts.seed1_account.to_account_info(),
                seed2_account: ctx.accounts.seed2_account.to_account_info(),
                owner_user_metadata: ctx.accounts.user_metadata.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
                token_program: ctx.accounts.token_program.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
            },
            &[signer_seeds],
        ),
        InitObligationArgs { tag: 0, id: 0 },
    )?;

    Ok(())
}

#[derive(Accounts)]
pub struct InitAccount<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        init,
        seeds = [b"bestlend_user_account", owner.key().as_ref()],
        bump,
        payer = owner,
        space = BestLendUserAccount::LEN + 8,
    )]
    pub bestlend_user_account: Account<'info, BestLendUserAccount>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitKlendAccount<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [b"bestlend_user_account", owner.key().as_ref()],
        bump,
    )]
    pub bestlend_user_account: Account<'info, BestLendUserAccount>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    pub token_program: Program<'info, Token>,

    /*
     * klend accounts
     */
    pub klend_program: Program<'info, KaminoLending>,
    /// CHECK: devnet demo
    pub seed1_account: AccountInfo<'info>,
    /// CHECK: devnet demo
    pub seed2_account: AccountInfo<'info>,
    /// CHECK: devnet demo
    pub lending_market: AccountInfo<'info>,
    /// CHECK: devnet demo
    #[account(mut)]
    pub obligation: AccountInfo<'info>,
    /// CHECK: devnet demo
    #[account(mut)]
    pub user_metadata: AccountInfo<'info>,
}
