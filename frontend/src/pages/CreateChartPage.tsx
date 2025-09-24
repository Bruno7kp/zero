// src/pages/CreateChartPage.tsx
import { useState, useEffect } from 'react';
import {
    Button,
    TextInput,
    Flex,
    Text,
    Title,
    Select,
    NumberInput,
    Grid,
    Card,
    ThemeIcon,
    rem,
    Divider,
    Group,
    Code, Container
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { DatePickerInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { useCharts } from '../contexts/ChartContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, NavLink, useParams } from 'react-router-dom';
import '@mantine/dates/styles.css';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import {
    IconCalculator,
    IconCheck,
    IconDisc,
    IconListNumbers,
    IconSettings,
    IconUserCog,
    IconX
} from '@tabler/icons-react';

const CreateChartPage = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();

    const localeMapping = {
        'pt': 'pt-br',
    };
    const locale = localeMapping[i18n.language as keyof typeof localeMapping] || i18n.language;

    const { charts, fetchCharts, isLoading, createChart, updateChart } = useCharts();
    const { isAuthenticated } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isFormInitialized, setIsFormInitialized] = useState(false);

    const dayOfWeekOptions = [
        { value: '0', label: t('days.0') },
        { value: '1', label: t('days.1') },
        { value: '2', label: t('days.2') },
        { value: '3', label: t('days.3') },
        { value: '4', label: t('days.4') },
        { value: '5', label: t('days.5') },
        { value: '6', label: t('days.6') },
    ];

    const allTimezones = Intl.supportedValuesOf('timeZone').sort();

    const form = useForm({
        initialValues: {
            name: '',
            source: 'lastfm',
            lastfm_username: '',
            start_date: null as Date | null,
            day_of_week: '5',
            timezone: 'UTC',
            music_cutoff: 20,
            album_cutoff: 20,
            artist_cutoff: 20,
            formula_name: t('charts.sales'),
            music_points_weight: 0,
            music_plays_weight: 1,
            album_points_weight: 0,
            album_plays_weight: 1,
            music_gold_value: 0,
            music_platinum_value: 0,
            music_diamond_value: 0,
            album_gold_value: 0,
            album_platinum_value: 0,
            album_diamond_value: 0,
        },
        validate: (values) => {
            const errors: { [key: string]: string | null } = {};

            if (!values.name) errors.name = t('forms.createChart.nameRequired');
            if (values.source === 'lastfm' && !values.lastfm_username) {
                errors.lastfm_username = t('forms.createChart.lastfmUsernameRequired');
            }
            if (!values.start_date) {
                errors.start_date = t('forms.createChart.startDateRequired');
            } else {
                const dayOfWeek = dayjs(values.start_date).day();
                if (dayOfWeek.toString() !== values.day_of_week) {
                    const selectedDayName = dayOfWeekOptions.find(d => d.value === values.day_of_week)?.label;
                    errors.start_date = t('forms.createChart.startDateDayMismatch', { day: selectedDayName });
                }
            }

            if (values.music_cutoff < 5) errors.music_cutoff = t('forms.createChart.cutoffMin', { min: 5 });
            if (values.album_cutoff < 5) errors.album_cutoff = t('forms.createChart.cutoffMin', { min: 5 });
            if (values.artist_cutoff < 5) errors.artist_cutoff = t('forms.createChart.cutoffMin', { min: 5 });

            if (values.music_gold_value > 0) {
                if (values.music_platinum_value <= values.music_gold_value) {
                    errors.music_platinum_value = t('forms.createChart.valueOrderError', { prev: t('values.gold') });
                }
                if (values.music_diamond_value <= values.music_platinum_value) {
                    errors.music_diamond_value = t('forms.createChart.valueOrderError', { prev: t('values.platinum') });
                }
            }
            if (values.album_gold_value > 0) {
                if (values.album_platinum_value <= values.album_gold_value) {
                    errors.album_platinum_value = t('forms.createChart.valueOrderError', { prev: t('values.gold') });
                }
                if (values.album_diamond_value <= values.album_platinum_value) {
                    errors.album_diamond_value = t('forms.createChart.valueOrderError', { prev: t('values.platinum') });
                }
            }

            const finalErrors: { [key: string]: string } = {};
            for (const key in errors) {
                if (errors[key]) {
                    finalErrors[key] = errors[key] as string;
                }
            }
            return finalErrors;
        },
    });

    useEffect(() => {
        if (id && !isLoading && charts.length > 0 && !isFormInitialized) {
            const chartToEdit = charts.find(c => c.id === Number(id));
            if (chartToEdit) {
                form.setValues({
                    name: chartToEdit.name,
                    source: chartToEdit.source,
                    lastfm_username: chartToEdit.lastfm_username,
                    start_date: dayjs(chartToEdit.start_date).toDate(),
                    day_of_week: String(chartToEdit.day_of_week),
                    timezone: chartToEdit.timezone,
                    music_cutoff: chartToEdit.music_cutoff,
                    album_cutoff: chartToEdit.album_cutoff,
                    artist_cutoff: chartToEdit.artist_cutoff,
                    formula_name: chartToEdit.formula_name,
                    music_points_weight: chartToEdit.music_points_weight,
                    music_plays_weight: chartToEdit.music_plays_weight,
                    album_points_weight: chartToEdit.album_points_weight,
                    album_plays_weight: chartToEdit.album_plays_weight,
                    music_gold_value: chartToEdit.music_gold_value,
                    music_platinum_value: chartToEdit.music_platinum_value,
                    music_diamond_value: chartToEdit.music_diamond_value,
                    album_gold_value: chartToEdit.album_gold_value,
                    album_platinum_value: chartToEdit.album_platinum_value,
                    album_diamond_value: chartToEdit.album_diamond_value,
                });
                setIsFormInitialized(true);
            } else {
                notifications.show({
                    message: t('errors.chartNotFound'),
                    color: 'red',
                });
                navigate('/settings');
            }
        } else if (id && !isLoading && charts.length === 0) {
            fetchCharts();
        }
    }, [id, charts, form, navigate, t, fetchCharts, isLoading, isFormInitialized]);


    const handleSubmit = async (values: typeof form.values) => {
        if (!form.validate()) {
            return;
        }

        if (!isAuthenticated) {
            setError(t('errors.notAuthenticated'));
            return;
        }

        setIsSubmitting(true);
        setError(null);

        if (!values.start_date) {
            return;
        }

        const chartData = {
            ...values,
            start_date: dayjs(values.start_date).format('YYYY-MM-DD'),
            day_of_week: parseInt(values.day_of_week),
        };

        let success = false;
        if (id) {
            success = await updateChart(Number(id), chartData);
        } else {
            success = await createChart(chartData);
        }

        if (success) {
            notifications.show({
                message: t(`notifications.charts.${id ? 'update' : 'save'}.success`, { chart: chartData.name }),
                color: 'green',
                icon: <IconCheck />,
            });
            navigate('/settings');
        } else {
            notifications.show({
                message: t(`notifications.charts.${id ? 'update' : 'save'}.error`, { chart: chartData.name }),
                color: 'red',
                icon: <IconX />,
            });
        }

        setIsSubmitting(false);
    };

    const pageTitle = id ? t('forms.editChart.title') : t('forms.createChart.title');
    const buttonLabel = id ? t('forms.editChart.saveButton') : t('forms.createChart.createButton');

    return (
        <Container>
            <Flex direction="column" p="xs" gap="sm">
                <Flex justify="center" align="center" gap="sm">
                    <NavLink to="/settings" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <Title order={2} style={{ display: 'flex', alignItems: 'center', gap: rem(8) }}>
                            <ThemeIcon variant="light" color="blue" size="md">
                                <IconSettings style={{ width: rem(20), height: rem(20) }} />
                            </ThemeIcon>
                            {t('settings.title')}
                        </Title>
                    </NavLink>

                    <Divider size="sm" orientation="vertical" />

                    <Title order={2} style={{ display: 'flex', alignItems: 'center', gap: rem(8) }}>
                        <ThemeIcon variant="light" color="blue" size="md">
                            <IconListNumbers style={{ width: rem(20), height: rem(20) }} />
                        </ThemeIcon>
                        {pageTitle}
                    </Title>
                </Flex>
                <Divider variant="solid" size="sm" my="md"/>
                <form onSubmit={form.onSubmit(handleSubmit)}>
                    <Grid>
                        <Grid.Col span={{ base: 12 }}>
                            <Card shadow="md" p="md">
                                <Group>
                                    <ThemeIcon variant="light" size="md">
                                        <IconUserCog style={{ width: rem(20), height: rem(20) }} />
                                    </ThemeIcon>
                                    <Text fw={600} size="lg">{t('forms.createChart.sourceTitle')}</Text>
                                </Group>
                                <Divider variant="dashed" size="sm" my="xs"/>
                                <Grid>
                                    <Grid.Col span={{ base: 12, md: 4 }}>
                                        <TextInput
                                            label={t('forms.createChart.nameLabel')}
                                            placeholder={t('forms.createChart.namePlaceholder')}
                                            {...form.getInputProps('name')}
                                        />
                                    </Grid.Col>
                                    <Grid.Col span={{ base: 12, md: 4 }}>
                                        <Select
                                            label={t('forms.createChart.sourceLabel')}
                                            placeholder={t('forms.createChart.sourcePlaceholder')}
                                            data={[
                                                { value: 'lastfm', label: 'Last.fm' },
                                            ]}
                                            {...form.getInputProps('source')}
                                        />
                                    </Grid.Col>
                                    {form.values.source === 'lastfm' && (
                                        <Grid.Col span={{ base: 12, md: 4 }}>
                                            <TextInput
                                                label={t('forms.createChart.lastfmUsernameLabel')}
                                                placeholder={t('forms.createChart.lastfmUsernamePlaceholder')}
                                                {...form.getInputProps('lastfm_username')}
                                            />
                                        </Grid.Col>
                                    )}
                                    <Grid.Col span={{ base: 12, md: 4 }}>
                                        <Select
                                            label={t('forms.createChart.timezoneLabel')}
                                            placeholder={t('forms.createChart.timezonePlaceholder')}
                                            data={allTimezones}
                                            searchable
                                            {...form.getInputProps('timezone')}
                                        />
                                    </Grid.Col>
                                    <Grid.Col span={{ base: 12, md: 4 }}>
                                        <Select
                                            label={t('forms.createChart.dayOfWeekLabel')}
                                            data={dayOfWeekOptions.map(day => ({...day, label: t(`days.${day.value}`) }))}
                                            {...form.getInputProps('day_of_week')}
                                        />
                                    </Grid.Col>
                                    <Grid.Col span={{ base: 12, md: 4 }}>
                                        <DatePickerInput
                                            label={t('forms.createChart.startDateLabel')}
                                            placeholder={t('forms.createChart.startDatePlaceholder')}
                                            valueFormat="YYYY-MM-DD"
                                            locale={locale}
                                            {...form.getInputProps('start_date')}
                                        />
                                    </Grid.Col>
                                    <Grid.Col span={{ base: 12, md: 4 }}>
                                        <NumberInput min={5} max={100} label={t('forms.createChart.musicCutoffLabel')} {...form.getInputProps('music_cutoff')} />
                                    </Grid.Col>
                                    <Grid.Col span={{ base: 12, md: 4 }}>
                                        <NumberInput min={5} max={100} label={t('forms.createChart.albumCutoffLabel')} {...form.getInputProps('album_cutoff')} />
                                    </Grid.Col>
                                    <Grid.Col span={{ base: 12, md: 4 }}>
                                        <NumberInput min={5} max={100} label={t('forms.createChart.artistCutoffLabel')} {...form.getInputProps('artist_cutoff')} />
                                    </Grid.Col>
                                </Grid>
                            </Card>
                        </Grid.Col>
                        <Grid.Col span={{ base: 12 }}>
                            <Card shadow="md" p="md">
                                <Group>
                                    <ThemeIcon variant="light" size="md">
                                        <IconCalculator style={{ width: rem(20), height: rem(20) }} />
                                    </ThemeIcon>
                                    <Text fw={600} size="lg">{t('forms.createChart.formulaTitle')}</Text>
                                </Group>
                                <Divider variant="dashed" size="sm" my="xs"/>
                                <Group justify="space-between">
                                    <Text size="sm">{t('forms.createChart.formulaDescription')}</Text>
                                </Group>
                                <Divider variant="dashed" size="sm" my="xs"/>
                                <Grid>
                                    <Grid.Col span={{ base: 12, md: 4 }}>
                                        <Grid>
                                            <Grid.Col span={12}>
                                                <TextInput label={t('forms.createChart.formulaNameLabel')} {...form.getInputProps('formula_name')} />
                                            </Grid.Col>
                                            <Grid.Col span={12}>
                                                <Text size="xs">{t('charts.salesExample')}</Text>
                                            </Grid.Col>
                                        </Grid>
                                    </Grid.Col>
                                    <Grid.Col span={{ base: 12, md: 4 }}>
                                        <Grid>
                                            <Grid.Col span={12}>
                                                <NumberInput min={0} max={10000} decimalScale={2} label={t('forms.createChart.musicPlaysWeightLabel')} {...form.getInputProps('music_plays_weight')} />
                                            </Grid.Col>
                                            <Grid.Col span={12}>
                                                <NumberInput min={0} max={10000} decimalScale={2} label={t('forms.createChart.musicPointsWeightLabel')} {...form.getInputProps('music_points_weight')} />
                                            </Grid.Col>
                                            <Grid.Col span={12}>
                                                <Code color="var(--mantine-color-blue-light)">({t('charts.plays')}*{form.values.music_plays_weight}) + ({t('charts.stability')}*{form.values.music_points_weight})</Code>
                                            </Grid.Col>
                                        </Grid>
                                    </Grid.Col>
                                    <Grid.Col span={{ base: 12, md: 4 }}>
                                        <Grid>
                                            <Grid.Col span={12}>
                                                <NumberInput min={0} max={10000} decimalScale={2} label={t('forms.createChart.albumPlaysWeightLabel')} {...form.getInputProps('album_plays_weight')} />
                                            </Grid.Col>
                                            <Grid.Col span={12}>
                                                <NumberInput min={0} max={10000} decimalScale={2} label={t('forms.createChart.albumPointsWeightLabel')} {...form.getInputProps('album_points_weight')} />
                                            </Grid.Col>
                                            <Grid.Col span={12}>
                                                <Code color="var(--mantine-color-blue-light)">({t('charts.plays')}*{form.values.album_plays_weight}) + ({t('charts.stability')}*{form.values.album_points_weight})</Code>
                                            </Grid.Col>
                                        </Grid>
                                    </Grid.Col>
                                </Grid>
                            </Card>
                        </Grid.Col>
                        <Grid.Col span={{ base: 12 }}>
                            <Card shadow="md" p="md">
                                <Group>
                                    <ThemeIcon variant="light" size="md">
                                        <IconDisc style={{ width: rem(20), height: rem(20) }} />
                                    </ThemeIcon>
                                    <Text fw={600} size="lg">{t('forms.createChart.certificationTitle')}</Text>
                                </Group>
                                <Divider variant="dashed" size="sm" my="xs"/>
                                <Grid>
                                    <Grid.Col span={{ base: 12, md: 4 }}>
                                        <NumberInput min={0} allowDecimal={false} label={t('forms.createChart.musicGoldLabel')} {...form.getInputProps('music_gold_value')} />
                                    </Grid.Col>
                                    <Grid.Col span={{ base: 12, md: 4 }}>
                                        <NumberInput min={0} allowDecimal={false} label={t('forms.createChart.musicPlatinumLabel')} {...form.getInputProps('music_platinum_value')} />
                                    </Grid.Col>
                                    <Grid.Col span={{ base: 12, md: 4 }}>
                                        <NumberInput min={0} allowDecimal={false} label={t('forms.createChart.musicDiamondLabel')} {...form.getInputProps('music_diamond_value')} />
                                    </Grid.Col>
                                    <Grid.Col span={{ base: 12, md: 4 }}>
                                        <NumberInput min={0} allowDecimal={false} label={t('forms.createChart.albumGoldLabel')} {...form.getInputProps('album_gold_value')} />
                                    </Grid.Col>
                                    <Grid.Col span={{ base: 12, md: 4 }}>
                                        <NumberInput min={0} allowDecimal={false} label={t('forms.createChart.albumPlatinumLabel')} {...form.getInputProps('album_platinum_value')} />
                                    </Grid.Col>
                                    <Grid.Col span={{ base: 12, md: 4 }}>
                                        <NumberInput min={0} allowDecimal={false} label={t('forms.createChart.albumDiamondLabel')} {...form.getInputProps('album_diamond_value')} />
                                    </Grid.Col>
                                </Grid>
                            </Card>
                        </Grid.Col>

                        <Grid.Col span={12}>
                            {error && (
                                <Text c="red" size="sm">
                                    {error}
                                </Text>
                            )}
                            <Button type="submit" loading={isSubmitting}>
                                {buttonLabel}
                            </Button>
                        </Grid.Col>
                    </Grid>
                </form>
            </Flex>
        </Container>
    );
};

export default CreateChartPage;