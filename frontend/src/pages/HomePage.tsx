// src/pages/HomePage.tsx
import React from 'react';
import { Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';

const HomePage: React.FC = () => {
    const { t } = useTranslation();
    return <Title>{t('welcome')}</Title>;
};

export default HomePage;