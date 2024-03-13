use std::{cell::Ref, collections::HashMap};

use anchor_lang::prelude::*;
use anchor_spl::token::TokenAccount;
use kamino_lending::{utils::Fraction, Obligation};
use pyth_sdk_solana::{load_price_feed_from_account_info, Price as PythPrice};
use rust_decimal::prelude::*;
use rust_decimal_macros::dec;

use crate::utils::Price;
use crate::BestLendError;

use super::{LSTS, STABLES};

#[account]
pub struct BestLendUserAccount {
    pub owner: Pubkey,
    pub address: Pubkey,
    pub collateral_group: u8,
    pub debt_group: u8,
    pub black_listed_assets: [Pubkey; 5],
    pub price_impact_bps: u8,
    pub last_account_value: Price,
    pub lookup_table: Pubkey,
}

impl BestLendUserAccount {
    pub const LEN: usize = 280 + 8;
    pub const DEFAULT_PI_BPS: u8 = 10;
}

impl BestLendUserAccount {
    pub fn account_value(
        &mut self,
        klend_obligation: Ref<Obligation>,
        remaining_accounts: &[AccountInfo],
    ) -> Result<Decimal> {
        let mut accounts = HashMap::new();
        let mut token_accounts = HashMap::new();

        for account in remaining_accounts {
            if let Ok(token_account) = Account::<TokenAccount>::try_from(account) {
                require!(
                    self.address.eq(&token_account.owner),
                    BestLendError::InvalidTokenAccountOwner
                );

                token_accounts.insert(token_account.mint, token_account);
            }
            accounts.insert(account.key(), account);
        }

        let mut account_value = dec!(0);
        for asset in [STABLES.as_slice(), LSTS.as_slice()].concat() {
            let oracle: Option<&&AccountInfo<'_>> = accounts.get(&asset.oracle);
            if oracle.is_none() {
                msg!("Missing oracle account: {}", asset.oracle);
                return Err(error!(BestLendError::MissingAccount));
            }

            let token_act = token_accounts.get(&asset.mint);
            if token_act.is_none() {
                msg!("Missing token account: {}", asset.mint);
                return Err(error!(BestLendError::MissingAccount));
            }

            let price_feed = load_price_feed_from_account_info(oracle.unwrap()).map_err(|e| {
                msg!("Error loading price pyth feed: {:?}", e);
                error!(BestLendError::PriceNotValid)
            })?;

            let PythPrice {
                price: price_int,
                expo,
                ..
            } = price_feed.get_price_unchecked();

            if expo > 0 {
                msg!("Expected price exponent to be negative: {}", expo);
                return Err(error!(BestLendError::PriceNotValid));
            }

            let price = Decimal::new(price_int, expo.abs() as u32);
            let tokens = Decimal::new(token_act.unwrap().amount as i64, asset.decimals as u32);

            account_value += price * tokens
        }

        msg!("resting assets value: {}", account_value);

        // establish value of klend position
        {
            let sf_deposit_value = Fraction::from_bits(klend_obligation.deposited_value_sf);
            let sf_borrow_value =
                Fraction::from_bits(klend_obligation.borrowed_assets_market_value_sf);

            let deposit_value = Decimal::from_str_exact(&sf_deposit_value.to_string()).unwrap();
            let borrow_value = Decimal::from_str_exact(&sf_borrow_value.to_string()).unwrap();

            msg!("klend position value: {}", deposit_value - borrow_value);
            account_value = account_value + deposit_value - borrow_value;
        }

        let precision = 6;
        self.last_account_value = Price {
            value: (account_value * Decimal::new(i64::pow(10, precision), 0))
                .floor()
                .to_i64()
                .unwrap(),
            expo: precision as i64 * -1,
        };

        Ok(account_value)
    }
}
