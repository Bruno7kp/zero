// src/hooks/useCustomColorScheme.ts
import { useState, useEffect } from 'react';
import { type MantineColorScheme } from '@mantine/core';

type CustomColorScheme = MantineColorScheme | 'darker';

export const useCustomColorScheme = () => {
    const [colorScheme, setColorScheme] = useState<CustomColorScheme>('dark');

    useEffect(() => {
        const storedScheme = localStorage.getItem('mantine-color-scheme') as CustomColorScheme;
        if (storedScheme) {
            setColorScheme(storedScheme);
        }
    }, []);

    const setTheme = (scheme: CustomColorScheme) => {
        setColorScheme(scheme);
        localStorage.setItem('mantine-color-scheme', scheme);
    };

    return { colorScheme, setTheme };
};