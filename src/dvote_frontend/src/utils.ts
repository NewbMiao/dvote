import { VoteError } from "../../declarations/dvote_backend/dvote_backend.did";

export const getErrorMessage = (err: VoteError) => {
  // just return error message
  return Object.values(err)?.[0] ?? "Unknown error";
};
