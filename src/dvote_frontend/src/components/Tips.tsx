import React, { useState } from "react";
import { Alert, Box, Snackbar } from "@mui/material";
import { on } from "events";

export interface TipsProps {
  message: string;
  severity?: "error" | "success" | "warning" | "info";
  duration?: number;
  onClose?: () => void;
}
const Tips = ({
  message,
  severity = "error",
  duration = 2000,
  onClose = () => {},
}: {
  message: string;
  severity?: "error" | "success" | "warning" | "info";
  duration?: number;
  onClose?: () => void;
}) => {
  const [open, setOpen] = useState(true);

  const handleClose = () => {
    setOpen(false);
    onClose();
  };

  return (
    <Box sx={{ width: 500 }}>
      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        open={open}
        autoHideDuration={duration}
        onClose={handleClose}
      >
        <Alert severity={severity} onClose={handleClose}>
          {message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Tips;
