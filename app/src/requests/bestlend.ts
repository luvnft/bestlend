import { Connection, PublicKey } from "@solana/web3.js";
import { BestLendUserAccount, PROGRAM_ID } from "../../../clients/bestlend/src";

export const getBestLendAccount = async (
  connection: Connection,
  user: PublicKey | null
) => {
  if (!user) {
    throw new Error("invalid pubkey");
  }

  const [bestlendUserAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from("bestlend_user_account"), user.toBuffer()],
    PROGRAM_ID
  );

  return await BestLendUserAccount.fromAccountAddress(
    connection,
    bestlendUserAccount
  );
};
