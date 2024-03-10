use anchor_lang::prelude::*;
use anchor_spl::token;
use anchor_spl::token::{Token, TokenAccount};

declare_id!("FFCs7PxV93BsPUNQhspKkggWArSxo2Hhas4PU4xhBmh6");

#[program]
pub mod dummy_swap {
    use super::*;

    pub fn swap(ctx: Context<Swap>, input_amout: u64, output_amout: u64) -> Result<()> {
        let Swap {
            swapper,
            token_holder_pda,
            swapper_input_token,
            swapper_output_token,
            pda_input_token,
            pda_output_token,
            token_program,
            ..
        } = ctx.accounts;

        // transfer input token from swapper to pda
        token::transfer(
            CpiContext::new(
                token_program.to_account_info(),
                anchor_spl::token::Transfer {
                    from: swapper_input_token.to_account_info(),
                    to: pda_input_token.to_account_info(),
                    authority: swapper.to_account_info(),
                },
            ),
            input_amout,
        )?;

        // transfer output token from pda to swapper
        token::transfer(
            CpiContext::new_with_signer(
                token_program.to_account_info(),
                anchor_spl::token::Transfer {
                    from: pda_output_token.to_account_info(),
                    to: swapper_output_token.to_account_info(),
                    authority: token_holder_pda.to_account_info(),
                },
                &[&[
                    b"token_holder",
                    &[*ctx.bumps.get("token_holder_pda").unwrap()],
                ]],
            ),
            output_amout,
        )?;

        ctx.accounts.token_holder_pda.swap_count += 1;

        Ok(())
    }
}

#[account]
pub struct TokenHolder {
    swap_count: u64,
}

#[derive(Accounts)]
pub struct Swap<'info> {
    #[account(mut)]
    pub swapper: Signer<'info>,
    #[account(mut)]
    pub swapper_input_token: Account<'info, TokenAccount>,
    #[account(mut)]
    pub swapper_output_token: Account<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = swapper,
        seeds = [b"token_holder"],
        space = 8 + 8,
        bump,
    )]
    pub token_holder_pda: Account<'info, TokenHolder>,
    #[account(mut)]
    pub pda_input_token: Account<'info, TokenAccount>,
    #[account(mut)]
    pub pda_output_token: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
