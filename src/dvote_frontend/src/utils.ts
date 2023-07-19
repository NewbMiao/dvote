import { VoteError } from "../../declarations/dvote_backend/dvote_backend.did";

export const getErrorMessage = (err: VoteError) => {
  // just return error message
  return Object.values(err)?.[0] ?? "Unknown error";
};

export const numberToLetter = (index: number) => {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  if (index < 0 || index > 25) {
    return "";
  }

  return alphabet.charAt(index);
};
