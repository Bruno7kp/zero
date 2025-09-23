//import React from 'react';

import {Divider, Flex, rem, ThemeIcon, Title, Container, Grid, Alert, Text, Anchor} from "@mantine/core";
import { ChartSyncProgress } from '../components/ChartSyncProgress';
import {IconInfoCircle, IconListNumbers} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import {useCharts} from "../contexts/ChartContext.tsx";
import {Link} from "react-router-dom";

const ChartsPage = () => {
    const { t } = useTranslation();
    const { charts, activeChartId } = useCharts();
    const activeChart = charts.find((c) => c.id === activeChartId) || null;
    const renderError = () => {
        return (
            <Grid>
                <Grid.Col>
                    <Alert icon={<IconInfoCircle />} color="blue" title={t('errors.warning')}>
                        <Text>{t('errors.selectActiveChart')}</Text>
                        {activeChartId === null && (
                            <Text mt="sm">
                                <Anchor component={Link} to="/settings">
                                    {t('errors.noActiveChart')}
                                </Anchor>
                            </Text>
                        )}
                    </Alert>
                </Grid.Col>
            </Grid>
        );
    };
    return (
        <Container>
            <Flex direction="column" p="xs" gap="sm">
                <Flex justify="center" align="center" gap="sm">
                    <Title order={2} style={{ display: 'flex', alignItems: 'center', gap: rem(8) }}>
                        <ThemeIcon variant="light" color="blue" size="md">
                            <IconListNumbers style={{ width: rem(20), height: rem(20) }} />
                        </ThemeIcon>
                        {t('charts.title')}
                    </Title>
                </Flex>
                <Divider variant="solid" size="sm" my="md"/>
                { activeChartId === null ? (
                    renderError()
                ) : activeChart ? (
                    <ChartSyncProgress chart={activeChart} />
                ) : null }
            </Flex>
        </Container>
    );
};

export default ChartsPage;
