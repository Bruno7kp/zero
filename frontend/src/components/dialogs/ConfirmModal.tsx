import React from 'react';
import { Modal, Button, Group, Text } from '@mantine/core';

interface ConfirmModalProps {
  opened: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ opened, onClose, title, message, confirmLabel = 'OK', cancelLabel = 'Cancel', onConfirm }) => {
  return (
    <Modal opened={opened} onClose={onClose} title={title}>
      {message && <Text mb="md">{message}</Text>}
      <Group justify="flex-end">
        <Button variant="default" onClick={onClose}>{cancelLabel}</Button>
        <Button color="red" onClick={() => { onConfirm?.(); onClose(); }}>{confirmLabel}</Button>
      </Group>
    </Modal>
  );
};

export default ConfirmModal;
