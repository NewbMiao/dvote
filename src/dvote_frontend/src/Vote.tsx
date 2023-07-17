import { Box, Typography, LinearProgress, Container } from "@mui/material";
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
}

interface VoteItemWithPercent extends VoteItem {
  percent: number;
}
function getRandomAlphabet() {
  const alphabets = "abcdefghijklmnopqrstuvwxyz";
  const randomIndex = Math.floor(Math.random() * alphabets.length);
  const randomAlphabet = alphabets[randomIndex].toUpperCase();
  return randomAlphabet;
}
const Vote = () => {
  const { hash } = useParams<{ hash: string }>();
  const [vote, setVote] = useState<VoteRecordWithPercent>();
  const [loading, setLoading] = useState(false);
  const [tips, setTips] = useState<TipsProps>();
  const { loggedIn, backendActor } = useContext(AuthContext);

  const updateVoteWithPercent = (voteRecord: VoteRecord) => {
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
    setVote({ ...voteRecord, items: tmp });
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
        updateVoteWithPercent(res.Ok);
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
      res.Ok && updateVoteWithPercent(res.Ok);
    } catch (error) {
      setLoading(false);
      console.log(error, "doVote error");
    }
  };
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
              variant="h6"
              key={item.index.toString()}
              onClick={async () => {
                await doVote(item.index);
              }}
            >
              {item.name} : {item.percent.toFixed(2)}% ({item.count.toString()})
              <LinearProgress
                sx={{ height: 20, width: 300, my: 1 }}
                variant="determinate"
                value={item.percent}
              />
            </Typography>
          );
        })}
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
