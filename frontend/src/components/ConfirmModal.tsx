import React from 'react';
import { Modal, Text, Group, Button } from '@mantine/core';

interface ConfirmModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  opened,
  onClose,
  onConfirm,
  title = 'Confirmação',
  message = 'Tem certeza?',
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
}) => (
  <Modal opened={opened} onClose={onClose} title={title} centered>
    <Text mb="md">{message}</Text>
    <Group>
      <Button variant="default" onClick={onClose}>{cancelLabel}</Button>
      <Button color="red" onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Button>
    </Group>
  </Modal>
);
