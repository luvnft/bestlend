# Bestlend - Solana Renaissance Hackathon

Bestlend maximizes your lending and borrow rates to save you time and money. It will find the best rates from different lending apps on Solana and automatically move your funds for you. Bestlend will also swap between correlated assets so you can deposit any stablecoin or LST and know you're getting the best yield.

For example, you might deposit JitoSOL on Kamino Finance and at some point in the future the lending rate of SOL on Marginfi exceeds the lending and staking rate of JitoSOL so the Bestlend performer will swap and move your collateral on your behalf

## Directories

| Folder             | Desription                                      |
| ------------------ | ----------------------------------------------- |
| programs/bestlend  | bestlend program                                |
| programs/dumyswap  | swap program for testing on devnet              |
| programs/klend     | fork of https://github.com/Kamino-Finance/klend |
| programs/mock-pyth | writing oracle rates for testing on devnet      |
| api                | ts backend for app data and performer actions   |
| app                | react app front-end                             |
| clients            | solita generated sdks from idls                 |

## How does Bestlend work?

Debt obligations for each protocol are held by a PDA with strict permissions. A user can perform any action against their position but the Bestlend performer can only do specific actions against whitelisted programs. The value of the position must be established before any action and must be checked after every action to ensure the action results in a position of the same value.

### Sample performer transaction

Example devnet performer tx: [solana.fm](https://solana.fm/tx/4SqwsgiqyuPVVKYDke2kuxNMrENJR6njCKRoSbZ3Ua4SDpKTqW9J8Bj6wjHbvQcoTn4DCP95xFJUMcsJ1wEPnSBr?cluster=devnet-alpha)

All performer instructions are included in a single transaction.

For example (swapping SOL collateral to JitoSOL):  
[preaction](/programs/bestlend/src/instructions/handle_action.rs#L9) → [withdraw SOL](/programs/bestlend/src/instructions/handle_klend_withdraw.rs#14) → [swap SOL to JitoSOL](/programs/bestlend/src/utils/action.rs#L15) → [deposit JitoSOL](/programs/bestlend/src/instructions/handle_klend_deposit.rs#L10) → [postaction](/programs/bestlend/src/instructions/handle_action.rs#L48)
