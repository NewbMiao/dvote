import React from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";

export interface AlertDialogProps {
  title: string;
  content: string;
  open: boolean;
  onClose: () => void;
  onOk: () => void;
  onCancel?: () => void;
}
export default function AlertDialog({
  title,
  content = "",
  open,
  onClose = () => {},
  onOk = () => {},
  onCancel = () => {},
}: AlertDialogProps) {
  return (
    <div>
      <Dialog
        open={open}
        onClose={onClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{title}</DialogTitle>
        {content && (
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              {content}
            </DialogContentText>
          </DialogContent>
        )}
        <DialogActions>
          <Button
            onClick={() => {
              onCancel();
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              onOk();
              onClose();
            }}
          >
            Ok
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
