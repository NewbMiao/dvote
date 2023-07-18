import {
  Box,
  Typography,
  LinearProgress,
  Container,
  Divider,
} from "@mui/material";
import React, { useContext, useEffect, useState } from "react";
import {
  VoteItem,
  VoteRecord,
} from "../../declarations/dvote_backend/dvote_backend.did";
import { getErrorMessage } from "./utils";
import { useParams } from "react-router-dom";
import Processing from "./components/Processing";
import Tips, { TipsProps } from "./components/Tips";
import { AuthContext } from "./components/AuthProvider";
interface VoteRecordWithPercent extends VoteRecord {
  items: Array<VoteItemWithPercent>;
  selection: number[];
}

interface VoteItemWithPercent extends VoteItem {
  percent: number;
}

const Vote = () => {
  const { hash } = useParams<{ hash: string }>();
  const [vote, setVote] = useState<VoteRecordWithPercent>();
  const [loading, setLoading] = useState(false);
  const [tips, setTips] = useState<TipsProps>();
  const { loggedIn, backendActor } = useContext(AuthContext);

  const updateVoteWithPercent = (voteRecord: VoteRecord, selection = []) => {
    console.log(selection, "selection");
    const sum = voteRecord.items.reduce((acc, item) => {
      return acc + Number(item.count);
    }, 0);

    let tmp: VoteItemWithPercent[];
    tmp = voteRecord.items.map((item) => {
      return {
        ...item,
        percent:
          Number(item.count) === 0 ? 0 : (Number(item.count) / sum) * 100,
      };
    });
    setVote({ ...voteRecord, items: tmp, selection });
  };
  useEffect(() => {
    if (!hash || !backendActor) return;
    (async () => {
      const res = await backendActor.getVote(hash);
      console.log(res, "getVote", hash, await backendActor.whoami());
      if ("Err" in res) {
        setTips({ message: getErrorMessage(res.Err), severity: "error" });
        return;
      }

      if (res.Ok) {
        updateVoteWithPercent(
          res.Ok.info,
          // @ts-ignore
          res.Ok.selection.map((x) => Number(x))
        );
      }
    })();
  }, [backendActor]);

  const doVote = async (index: bigint) => {
    if (!hash) {
      return;
    }
    if (!loggedIn) {
      setTips({ message: "Please login first!", severity: "error" });
      return;
    }
    try {
      setLoading(true);
      const res = await backendActor.vote(hash, index);
      setLoading(false);

      if ("Err" in res) {
        setTips({ message: getErrorMessage(res.Err) });
        return;
      }
      setTips({ message: "vote succeed!", severity: "success" });

      console.log(res, "doVote");
      res.Ok &&
        updateVoteWithPercent(
          res.Ok.info,
          // @ts-ignore
          res.Ok.selection.map((x) => Number(x))
        );
    } catch (error) {
      setLoading(false);
      console.log(error, "doVote error");
    }
  };
  const showVoteResult = vote?.selection.length !== 0;
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography variant="h4" my={1}>
          {vote?.title}
        </Typography>

        {vote?.items.map((item) => {
          return (
            <Typography
              justifyContent={"start"}
              variant="h6"
              key={item.index.toString()}
              onClick={async () => {
                await doVote(item.index);
              }}
            >
              Option - {item.name} :
              {showVoteResult && (
                <>
                  {item.percent.toFixed(2)}% ({item.count.toString()}){" "}
                  {vote.selection.includes(Number(item.index)) ? "✅" : ""}
                </>
              )}
              <LinearProgress
                sx={{
                  height: 20,
                  width: 300,
                  my: 1,
                }}
                variant="determinate"
                value={showVoteResult ? item.percent : 0}
              />
            </Typography>
          );
        })}
        <Divider sx={{ width: "80%", my: 2 }} />
        <Typography>
          Tips: Click option to vote and max selection is {vote?.max_selection}.
        </Typography>
      </Box>

      <Processing open={loading} />
      {tips && (
        <Tips
          message={tips.message}
          severity={tips.severity}
          onClose={() => setTips(undefined)}
        />
      )}
    </Container>
  );
};
export default Vote;
