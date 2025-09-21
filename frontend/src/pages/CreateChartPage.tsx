// src/pages/CreateChartPage.tsx
import { useState } from 'react';
import {
    Button,
    TextInput,
    Flex,
    Text,
    Title,
    Select,
    NumberInput,
    Grid,
    Container
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { useCharts } from '../contexts/ChartContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom'; // Importe o hook de navegação
import '@mantine/dates/styles.css';
import 'dayjs/locale/pt-br';

const CreateChartPage = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate(); // Inicialize o hook de navegação

    // Objeto de mapeamento para locais do dayjs
    const localeMapping = {
        'pt': 'pt-br',
    };

    // Obtém o código de idioma atual e o mapeia para o local do dayjs
    const locale = localeMapping[i18n.language as keyof typeof localeMapping] || i18n.language;

    const { fetchCharts } = useCharts();
    const { isAuthenticated } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
            formula_name: 'points',
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
                const dayOfWeek = values.start_date.getDay();
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

    const handleSubmit = async (values: typeof form.values) => {
        if (!form.validate()) {
            return;
        }

        const token = localStorage.getItem('user-token');
        if (!isAuthenticated || !token) {
            setError(t('errors.notAuthenticated'));
            return;
        }

        setIsSubmitting(true);
        setError(null);

        const chartData = {
            name: values.name,
            json: JSON.stringify({
                ...values,
                start_date: values.start_date?.toISOString().split('T')[0],
                day_of_week: parseInt(values.day_of_week),
            }),
        };

        try {
            const response = await fetch('/api/charts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(chartData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || t('errors.failedToCreateChart'));
            }

            await fetchCharts();
            // Redirecione o usuário de volta para a página de configurações após o sucesso
            navigate('/settings');
        } catch (e: any) {
            setError(e.message || t('errors.unknown'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Container size="xl" p="xs">
            <Flex direction="column">
                <Title order={2}>{t('forms.createChart.title')}</Title>
                <form onSubmit={form.onSubmit(handleSubmit)}>
                    <Grid mt="sm">
                        <Grid.Col span={{ base: 12 }}>
                            <Grid>
                                <Grid.Col span={{ base: 12 }}>
                                    <Title order={4}>{t('forms.createChart.sourceTitle')}</Title>
                                </Grid.Col>
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
                                    <NumberInput label={t('forms.createChart.musicCutoffLabel')} {...form.getInputProps('music_cutoff')} />
                                </Grid.Col>
                                <Grid.Col span={{ base: 12, md: 4 }}>
                                    <NumberInput label={t('forms.createChart.albumCutoffLabel')} {...form.getInputProps('album_cutoff')} />
                                </Grid.Col>
                                <Grid.Col span={{ base: 12, md: 4 }}>
                                    <NumberInput label={t('forms.createChart.artistCutoffLabel')} {...form.getInputProps('artist_cutoff')} />
                                </Grid.Col>
                            </Grid>
                        </Grid.Col>
                        <Grid.Col span={{ base: 12 }}>
                            <Grid>
                                <Grid.Col span={{ base: 12 }}>
                                    <Title order={4}>{t('forms.createChart.formulaTitle')}</Title>
                                </Grid.Col>
                                <Grid.Col span={{ base: 12, md: 4 }}>
                                    <TextInput label={t('forms.createChart.formulaNameLabel')} {...form.getInputProps('formula_name')} />
                                </Grid.Col>
                                <Grid.Col span={{ base: 12, md: 4 }}>
                                    <NumberInput label={t('forms.createChart.musicPointsWeightLabel')} {...form.getInputProps('music_points_weight')} />
                                </Grid.Col>
                                <Grid.Col span={{ base: 12, md: 4 }}>
                                    <NumberInput label={t('forms.createChart.musicPlaysWeightLabel')} {...form.getInputProps('music_plays_weight')} />
                                </Grid.Col>
                                <Grid.Col span={{ base: 12, md: 4 }}>
                                    <NumberInput label={t('forms.createChart.albumPointsWeightLabel')} {...form.getInputProps('album_points_weight')} />
                                </Grid.Col>
                                <Grid.Col span={{ base: 12, md: 4 }}>
                                    <NumberInput label={t('forms.createChart.albumPlaysWeightLabel')} {...form.getInputProps('album_plays_weight')} />
                                </Grid.Col>
                            </Grid>
                        </Grid.Col>
                        <Grid.Col span={{ base: 12 }}>
                            <Grid>
                                <Grid.Col span={{ base: 12 }}>
                                    <Title order={4}>{t('forms.createChart.certificationTitle')}</Title>
                                </Grid.Col>
                                <Grid.Col span={{ base: 12, md: 4 }}>
                                    <NumberInput label={t('forms.createChart.musicGoldLabel')} {...form.getInputProps('music_gold_value')} />
                                </Grid.Col>
                                <Grid.Col span={{ base: 12, md: 4 }}>
                                    <NumberInput label={t('forms.createChart.musicPlatinumLabel')} {...form.getInputProps('music_platinum_value')} />
                                </Grid.Col>
                                <Grid.Col span={{ base: 12, md: 4 }}>
                                    <NumberInput label={t('forms.createChart.musicDiamondLabel')} {...form.getInputProps('music_diamond_value')} />
                                </Grid.Col>
                                <Grid.Col span={{ base: 12, md: 4 }}>
                                    <NumberInput label={t('forms.createChart.albumGoldLabel')} {...form.getInputProps('album_gold_value')} />
                                </Grid.Col>
                                <Grid.Col span={{ base: 12, md: 4 }}>
                                    <NumberInput label={t('forms.createChart.albumPlatinumLabel')} {...form.getInputProps('album_platinum_value')} />
                                </Grid.Col>
                                <Grid.Col span={{ base: 12, md: 4 }}>
                                    <NumberInput label={t('forms.createChart.albumDiamondLabel')} {...form.getInputProps('album_diamond_value')} />
                                </Grid.Col>
                            </Grid>
                        </Grid.Col>





                        <Grid.Col span={12}>
                            {error && (
                                <Text c="red" size="sm">
                                    {error}
                                </Text>
                            )}
                            <Button type="submit" mt="md" fullWidth loading={isSubmitting}>
                                {t('forms.createChart.createButton')}
                            </Button>
                        </Grid.Col>
                    </Grid>
                </form>
            </Flex>
        </Container>
    );
};

export default CreateChartPage;