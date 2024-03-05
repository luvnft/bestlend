use anchor_lang::prelude::*;

declare_id!("HACkDo9t8Ew3Qw7g2ruBNrdVYAJi81qfQWkKkhJtwwCA");

#[program]
pub mod bestlend {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
