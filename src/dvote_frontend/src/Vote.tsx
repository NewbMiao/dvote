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
import { getErrorMessage, numberToLetter } from "./utils";
import { useParams } from "react-router-dom";
import Processing from "./components/Processing";
import Tips, { TipsProps } from "./components/Tips";
import { AuthContext } from "./components/AuthProvider";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AlertDialog, { AlertDialogProps } from "./components/Dialog";
import Countdown from "./components/Countdown";
import dayjs from "dayjs";
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
  const [openConfirm, setOpenConfirm] = useState<AlertDialogProps>(
    {} as AlertDialogProps
  );
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
    if (voteRecord?.created_by.toString() === "2vxsx-fae" && !loggedIn) {
      // fix annoymous vote bug
      selection = [];
    }
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
  const couldVote = (index: bigint) => {
    if (isExpired) {
      console.log("isExpired");
      return false;
    }

    if (
      vote?.selection.includes(Number(index)) ||
      (vote?.max_selection && vote?.selection.length >= vote?.max_selection)
    ) {
      console.log(
        "vote?.selection.includes(Number(index))",
        vote?.selection.includes(Number(index)),
        vote?.max_selection,
        vote?.selection.length >= vote?.max_selection
      );
      return false;
    }
    return true;
  };
  const handleVote = async (index: bigint) => {
    if (!couldVote(index)) {
      return;
    }
    if (!loggedIn) {
      setTips({ message: "Please login first!", severity: "error" });
      return;
    }
    setOpenConfirm({
      title: "Confirm",
      content: "Are you sure to vote this option?",
      open: true,
      onOk: async () => {
        await doVote(index);
      },
      onClose: () => {
        setOpenConfirm({} as AlertDialogProps);
      },
    });
  };
  const remainingTime = Number(vote?.expired_at) - dayjs().unix();
  const isExpired = remainingTime < 0;
  const showVoteResult =
    isExpired || (loggedIn && vote?.selection.length !== 0);

  if (!vote?.title) return null;
  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography variant="h4" fontWeight={600} my={1} textAlign={"center"}>
          {vote?.title}
        </Typography>

        {vote?.items.map((item) => {
          return (
            <Box
              key={item.name}
              onClick={() => handleVote(item.index)}
              sx={{
                my: 0.5,
                width: { xs: "100%", sm: "500px" },
                wordBreak: "break-all",
                cursor: couldVote(item.index) ? "pointer" : "default",
                ...(couldVote(item.index)
                  ? {
                      "&:hover": {
                        scale: "1.05",
                        padding: 1,
                        border: "3px solid transparent",
                        borderImage: "linear-gradient(to right, #f06, #0cf)",
                        borderImageSlice: 1,
                        transition: "border-color 0.3s ease-in-out",
                      },
                    }
                  : {}),
              }}
            >
              <Typography
                justifyContent={"start"}
                maxWidth={"sm"}
                mb={1}
                variant="h6"
                key={item.index.toString()}
              >
                {numberToLetter(Number(item.index))} - {item.name}
                {showVoteResult && (
                  <>
                    {" : "}
                    {item.percent.toFixed(2)}% ({item.count.toString()}){" "}
                    {vote.selection.includes(Number(item.index)) ? (
                      <CheckCircleIcon
                        sx={{
                          ml: 2,
                          verticalAlign: "middle",
                        }}
                        color="success"
                      />
                    ) : (
                      ""
                    )}
                  </>
                )}
              </Typography>
              <LinearProgress
                sx={{
                  height: 20,
                  width: "100%",
                  mb: 1,
                }}
                variant="determinate"
                value={showVoteResult ? item.percent : 0}
                onClick={() => handleVote(item.index)}
              />
            </Box>
          );
        })}

        <Typography color={"GrayText"} my={0.5} textAlign={"center"}>
          Vote started on{" "}
          {dayjs(Number(vote?.created_at) * 1000)
            .locale("en")
            .format("LLL")
            .toLocaleString()}
        </Typography>
        {!isExpired && (
          <Typography color={"GrayText"} my={0.5}>
            Will end after
            <span
              style={{
                fontStyle: "oblique",
                color: "red",
              }}
            >
              <Countdown durationInSec={remainingTime} />
            </span>
          </Typography>
        )}
        {isExpired && (
          <Typography color={"GrayText"} my={0.5}>
            Has ended on{" "}
            {dayjs(Number(vote?.expired_at) * 1000)
              .locale("en")
              .format("LLL")
              .toLocaleString()}
          </Typography>
        )}
        <Typography color={"GrayText"} my={0.5}>
          Created by {vote?.created_by.toString()}
        </Typography>
        <Divider sx={{ width: "80%", my: 2 }} />
        <Typography>
          Tips: Click on an option to vote. You can select a maximum of{" "}
          {vote?.max_selection} option.
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
      {openConfirm.open && <AlertDialog {...openConfirm} />}
    </Container>
  );
};
export default Vote;
