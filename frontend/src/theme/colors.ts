import type { MantineColorsTuple } from '@mantine/core';

export const forest: MantineColorsTuple = [
  '#eafbee',
  '#dcf0e1',
  '#bcdec3',
  '#98cca3', // texto no tema escuro
  '#7abc87',
  '#66b276',
  '#458957', // texto no tema branco // bg badge claro nos dois temas
  '#4a985b',
  '#56ab68',
  '#307541',
];

export const grass: MantineColorsTuple = [
  '#eafbee',
  '#dcf0e1',
  '#bcdec3',
  '#98cca3',
  '#7abc87',
  '#66b276',
  '#56ab68', // bg badge no tema claro
  '#4a985b',
  '#56ab68', // bg badge no tema escuro
  '#307541',
];

export const ruby: MantineColorsTuple = [
  '#ffe5e5',
  '#ffc2c2',
  '#ff9999',
  '#ff6464', // texto no tema escuro
  '#ff3333',
  '#e60000',
  '#cd493b', // texto no tema branco // bg badge claro nos dois temas
  '#b30000',
  '#990000',
  '#800000',
];

export const cherry: MantineColorsTuple = [
  '#ffe5e5',
  '#ffb3b3',
  '#ff8080',
  '#ff4d4d',
  '#ff1a1a',
  '#e60000',
  '#d65746', // bg badge no tema claro
  '#b30000',
  '#d65746', // bg badge no tema escuro
  '#800000',
];

export const cobalt: MantineColorsTuple = [
  '#e6f0ff',
  '#b3ccff',
  '#80aaff',
  '#4d94ff', // texto no tema escuro
  '#1a75ff',
  '#0066e6',
  '#3363d6', // texto no tema branco // bg badge claro nos dois temas
  '#0040b3',
  '#003399',
  '#001a80',
];

export const lazuli: MantineColorsTuple = [
  '#e6f0ff',
  '#b3ccff',
  '#80aaff',
  '#4d94ff',
  '#1a75ff',
  '#0066e6',
  '#4b83ee', // bg badge no tema claro
  '#0040b3',
  '#4b83ee', // bg badge no tema escuro
  '#001a80',
];

export const honey: MantineColorsTuple = [
  '#fff5e6',
  '#ffebc2',
  '#ffd39c',
  '#ffbc80', // texto no tema escuro
  '#ff9952',
  '#ff8a1a',
  '#e37700', // texto no tema branco // bg badge claro nos dois temas
  '#ff8600',
  '#cc7a00',
  '#ff7a00',
];

export const bee: MantineColorsTuple = [
  '#fff5e6',
  '#ffe6b3',
  '#ffd1a1',
  '#ffbc80',
  '#ffa65a',
  '#ff991f',
  '#e9a13b', // bg badge no tema claro
  '#ff8600',
  '#e9a13b', // bg badge no tema escuro
  '#ff7a00',
];

export const palettes = { forest, ruby, cobalt, honey, bee, cherry, lazuli, grass };

export type AppPaletteKeys = keyof typeof palettes;
