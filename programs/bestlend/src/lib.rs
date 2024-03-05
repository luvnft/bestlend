use anchor_lang::prelude::*;

declare_id!("hackF7pNZ7dGZCGXaiPNnzxkSoyrBkyEyDTpywK9KJs");

#[program]
pub mod bestlend {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
