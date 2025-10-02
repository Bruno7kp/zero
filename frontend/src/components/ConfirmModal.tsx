import React from 'react';
import { Modal, Text, Group, Button } from '@mantine/core';
import { useTranslation } from 'react-i18next';

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
  title,
  message,
  confirmLabel,
  cancelLabel,
}) => {
  const { t } = useTranslation();
  const finalTitle = title || t('common.confirmationTitle');
  const finalMessage = message || t('common.confirmationMessage');
  const finalConfirm = confirmLabel || t('common.confirm');
  const finalCancel = cancelLabel || t('common.cancel');
  return (
    <Modal opened={opened} onClose={onClose} title={finalTitle} centered>
      <Text mb="md">{finalMessage}</Text>
      <Group justify="flex-end">
        <Button variant="default" onClick={onClose}>{finalCancel}</Button>
        <Button color="red" onClick={() => { onConfirm(); onClose(); }}>{finalConfirm}</Button>
      </Group>
    </Modal>
  );
};
