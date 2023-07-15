import React, { useState } from "react";
import {
  TextField,
  Checkbox,
  Button,
  Box,
  Container,
  Typography,
  InputAdornment,
} from "@mui/material";
import TimePicker from "./components/TimePicker";
import RemoveIcon from "@mui/icons-material/Remove";
import dayjs, { Dayjs } from "dayjs";
import { dvote_backend } from "../../declarations/dvote_backend";
import Tips, { TipsProps } from "./components/Tips";
import { CreateVoteRecord } from "../../declarations/dvote_backend/dvote_backend.did";
import { getErrorMessage } from "./utils";
const Create = () => {
  const [title, setTitle] = useState("");
  const [maxSelection, setMaxSelection] = useState(1);
  const [publicVote, setPublicVote] = useState(true);
  const [expiredDate, setExpiredDate] = useState<Dayjs>(dayjs().add(7, "day"));
  const [items, setItems] = useState(["", ""]);
  const [tips, setTips] = useState<TipsProps>();

  const handleItemsChange = (index: number) => (event: any) => {
    const newItems = [...items];
    // @ts-ignore
    newItems[index] = event.target.value;
    setItems(newItems);
  };

  const handleSubmit = async (event: any) => {
    event.preventDefault();

    // Create the VoteRecord object with the collected data
    const voteRecord = {
      expired_at: BigInt(expiredDate ? expiredDate.unix() : 0), // Set the expired_at value based on your requirement
      title: title,
      max_selection: maxSelection,
      public: publicVote,
      names: items.filter((item) => item !== "").map((item) => item.trim()),
    } as CreateVoteRecord;
    const res = await dvote_backend.createVote(voteRecord);
    if ("Err" in res) {
      setTips({ message: getErrorMessage(res.Err) });
      return;
    }
    console.log(res, "createVote");
    setTips({ message: "Create vote succeed!", severity: "success" });

    // Perform any necessary actions with the voteRecord object
    console.log(voteRecord);

    // Reset the form fields
    setTitle("");
    setMaxSelection(2);
    setPublicVote(true);
    setExpiredDate(dayjs().add(7, "day"));
    setItems(["", ""]);
  };

  return (
    <Container maxWidth="md">
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          margin="normal"
          label="Title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
        />

        <Box
          sx={{
            my: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <label>
            Public vote:
            <Checkbox
              checked={publicVote}
              onChange={(event) => setPublicVote(event.target.checked)}
            />
          </label>

          <Box
            sx={{
              display: "inline-flex",
              justifyContent: "space-between",
            }}
          >
            <Button
              variant="text"
              size="medium"
              onClick={() => {
                if (maxSelection > 1) setMaxSelection(maxSelection - 1);
              }}
            >
              <Typography variant="h5">-</Typography>
            </Button>
            <TextField
              label="Max Selection"
              type="number"
              value={maxSelection}
              onChange={(event) =>
                setMaxSelection(parseInt(event.target.value))
              }
              inputProps={{ min: 0 }}
            />
            <Button
              variant="text"
              size="medium"
              onClick={() => {
                if (maxSelection < items.length)
                  setMaxSelection(maxSelection + 1);
              }}
            >
              <Typography variant="h5">+</Typography>
            </Button>
          </Box>
        </Box>

        <Box sx={{ my: 2 }}>
          <TimePicker
            label="Expired Date"
            value={expiredDate}
            required
            // @ts-ignore
            onChange={(newDate: any) => setExpiredDate(newDate)}
          />
        </Box>

        <Box sx={{ my: 2 }}>
          <label>
            Items:
            {Array.from(items, (_, index) => (
              <TextField
                key={index}
                fullWidth
                margin="normal"
                label={`item ${index + 1}`}
                name="items[]"
                value={items[index]}
                onChange={handleItemsChange(index)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <RemoveIcon
                        onClick={() => {
                          const updatedItems = [...items];
                          updatedItems.splice(index, 1);
                          setItems(updatedItems);
                        }}
                      />
                      {/* <Button
                        variant="contained"
                        endIcon={<RemoveIcon />}
                      ></Button> */}
                    </InputAdornment>
                  ),
                }}
              />
            ))}
          </label>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "space-around" }}>
          <Button variant="contained" type="submit">
            Create vote
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setItems([...items, ""]);
            }}
          >
            Add vote item
          </Button>
        </Box>
      </form>
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

export default Create;
