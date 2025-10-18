import React, { useEffect } from 'react';
import {
    Container,
    Title,
    Text,
    Card,
    Group,
    Badge,
    Stack,
    Button,
    ActionIcon,
    Box,
    useMantineTheme,
    Divider,
    Flex,
    ThemeIcon,
    rem,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { markAsRead, markAllAsRead, removeNotification, type Notification } from '../store/notificationsSlice';
import { IconBell, IconTrash, IconCheck } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/en';
import 'dayjs/locale/pt';
import { getCardBackgroundByMode, type ThemeMode } from '../theme/modes';
import type { RootState } from '../store';

dayjs.extend(relativeTime);

const NotificationsPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const dispatch = useDispatch();
    const notifications = useSelector((s: RootState) => (s as any).notifications.notifications) as Notification[];
    const reduxLanguage = useSelector((state: any) => state.i18n.language);
    const theme = useMantineTheme();
    const themeMode = useSelector((s: any) => (s.theme?.value as ThemeMode) || 'dark');

    useEffect(() => {
        if (i18n.language !== reduxLanguage) {
            i18n.changeLanguage(reduxLanguage);
        }
        const safeLocale = (reduxLanguage || 'en').split('-')[0];
        dayjs.locale(safeLocale);
    }, [reduxLanguage, i18n]);

    const handleMarkAsRead = (id: string) => {
        dispatch(markAsRead(id));
    };

    const handleMarkAllAsRead = () => {
        dispatch(markAllAsRead());
    };

    const handleDelete = (id: string) => {
        dispatch(removeNotification(id));
    };

    const sortedNotifications = [...notifications].sort((a, b) => b.createdAt - a.createdAt);
    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <Container className="noPaddingMobile">
            <Flex direction="column" p="xs" gap="sm">
                <Flex justify="center" align="center" gap="sm">
                    <Title order={2} fw={600} style={{ display: 'flex', alignItems: 'center', gap: rem(8) }}>
                        <ThemeIcon variant="light" size="md">
                            <IconBell style={{ width: rem(20), height: rem(20) }} />
                        </ThemeIcon>
                        {t('notifications.title')}
                        {unreadCount > 0 && (
                            <Badge color="red" variant="filled">
                                {unreadCount}
                            </Badge>
                        )}
                    </Title>
                </Flex>
                <Divider variant="solid" size="sm" my="md" />
                {unreadCount > 0 && (
                    <Group justify="space-between" mb="lg">
                    
                        <Button
                            variant="light"
                            leftSection={<IconCheck size={16} />}
                            onClick={handleMarkAllAsRead}
                        >
                            {t('notifications.markAllAsRead')}
                        </Button>
                    </Group>
                )}

                {sortedNotifications.length === 0 ? (
                    <Card shadow="sm" padding="xl" radius="md" style={{ background: getCardBackgroundByMode(theme, themeMode) }}>
                        <Stack align="center" gap="md">
                            <IconBell size={48} style={{ opacity: 0.3 }} />
                            <Text size="lg" c="dimmed">
                                {t('notifications.empty')}
                            </Text>
                        </Stack>
                    </Card>
                ) : (
                    <Stack gap="md">
                        {sortedNotifications.map((notification) => (
                            <Card
                                key={notification.id}
                                shadow="sm"
                                padding="lg"
                                radius="md"
                                style={{
                                    background: getCardBackgroundByMode(theme, themeMode),
                                    opacity: notification.read ? 0.7 : 1,
                                }}
                            >
                                <Group justify="space-between" align="flex-start">
                                    <Box style={{ flex: 1 }}>
                                        <Group gap="xs" mb="xs">
                                            <Text fw={600} size="md">
                                                {t(notification.title)}
                                            </Text>
                                            {!notification.read && (
                                                <Badge variant="dot" size="sm">
                                                    {t('notifications.new')}
                                                </Badge>
                                            )}
                                        </Group>
                                        <Text size="sm" c="dimmed" mb="sm">
                                            {notification.chartName
                                                ? t(notification.message, { chartName: notification.chartName })
                                                : t(notification.message)}
                                        </Text>
                                        <Text size="xs" c="dimmed">
                                            {dayjs(notification.createdAt).fromNow()}
                                        </Text>
                                        {notification.type === 'chart_outdated' && notification.chartId && (
                                            <Button
                                                component={Link}
                                                to="/charts"
                                                variant="light"
                                                size="xs"
                                                mt="sm"
                                                onClick={() => handleMarkAsRead(notification.id)}
                                            >
                                                {t('notifications.goToCharts')}
                                            </Button>
                                        )}
                                    </Box>
                                    <Group gap="xs">
                                        {!notification.read && (
                                            <ActionIcon
                                                variant="subtle"
                                                onClick={() => handleMarkAsRead(notification.id)}
                                                title={t('notifications.markAsRead')}
                                            >
                                                <IconCheck size={18} />
                                            </ActionIcon>
                                        )}
                                        <ActionIcon
                                            variant="subtle"
                                            color="red"
                                            onClick={() => handleDelete(notification.id)}
                                            title={t('notifications.delete')}
                                        >
                                            <IconTrash size={18} />
                                        </ActionIcon>
                                    </Group>
                                </Group>
                            </Card>
                        ))}
                    </Stack>
                )}
            </Flex>
        </Container>
    );
};

export default NotificationsPage;
