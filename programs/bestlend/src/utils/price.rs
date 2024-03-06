use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Debug, Default)]
#[zero_copy]
#[repr(C)]
pub struct Price {
    pub value: i64,
    pub expo: i64,
}
