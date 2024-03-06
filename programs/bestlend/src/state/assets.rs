use anchor_lang::solana_program;
use num_enum::{IntoPrimitive, TryFromPrimitive};
use solana_program::{pubkey, pubkey::Pubkey};

#[derive(TryFromPrimitive, IntoPrimitive, PartialEq)]
#[repr(u8)]
pub enum AssetGroup {
    STABLE,
    LST,
}

#[derive(Clone, Copy)]
pub struct Asset {
    pub mint: Pubkey,
    pub asset_group: u8,
    pub ticker: &'static str,
    pub oracle: Pubkey,
    pub decimals: u8,
}

pub const STABLES: [Asset; 2] = [
    Asset {
        mint: pubkey!("HXgjmMGyuVgYwr2NByedRGbv3B5PaC35TVXZz9zC37SH"),
        asset_group: AssetGroup::STABLE as u8,
        ticker: "USDC",
        oracle: pubkey!("8VpyMotVBQbVXdRPiKgmvftqmLVNayM4ZamEN7YZ2SWi"),
        decimals: 6,
    },
    Asset {
        mint: pubkey!("7peGn1vW6ayNk3TiWPELBYah8knv8z2RYG7wNGQavXxF"),
        asset_group: AssetGroup::STABLE as u8,
        ticker: "USDT",
        oracle: pubkey!("DoYnB3k4dfDmh3tgZvUUCsd9548CWBhAJwzyKWiDDj5f"),
        decimals: 6,
    },
];

pub const LSTS: [Asset; 4] = [
    Asset {
        mint: pubkey!("G56qBhvVSMLXzsFqQ4KjBs72NtQsDwFeRu4pgQYNhnFL"),
        asset_group: AssetGroup::LST as u8,
        ticker: "SOL",
        oracle: pubkey!("B74LxjLTd4XDHe2YxC5roQvNmqnPQ5W45afhF2UMCSSU"),
        decimals: 9,
    },
    Asset {
        mint: pubkey!("9k8GwMpTaDf7HW4q34tjXTwwvcdrkWg4Fp9PFrzZzPYE"),
        asset_group: AssetGroup::LST as u8,
        ticker: "JitoSOL",
        oracle: pubkey!("9HhpJ6zCqKA82fUgPrNx4KoQv4WrJQ9UbS7uFSqAxZLt"),
        decimals: 9,
    },
    Asset {
        mint: pubkey!("5iaHdCKiChezmE3PfP6STbkXJ8mgXNnZzNny16oKBSi8"),
        asset_group: AssetGroup::LST as u8,
        ticker: "mSOL",
        oracle: pubkey!("5M6UFJbWrpAkddr3tdSaf9egSsEhwZAZRTyLdjcaxp4p"),
        decimals: 9,
    },
    Asset {
        mint: pubkey!("8jVkW4NZBs5HJdYwJdVsfSuvkMfWTGoTQqfm3m45g5Hh"),
        asset_group: AssetGroup::LST as u8,
        ticker: "bSOL",
        oracle: pubkey!("FBwd4ar6hQugVXjzX21SABSLXtzoJ5rnyb6bQBkFLyMp"),
        decimals: 9,
    },
];
