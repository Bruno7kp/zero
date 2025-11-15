import type { MantineColorsTuple } from '@mantine/core';

export const forest: MantineColorsTuple = [
  '#eafbee',
  '#dcf0e1',
  '#bcdec3',
  '#bceba7', // texto no tema escuro
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
  '#B3EBF2', // texto no tema escuro
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
  '#ffca64', // texto no tema escuro
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

export const mediumblue: MantineColorsTuple = [
  '#e6f7ff', // [0] muito claro
  '#cceeff', // [1]
  '#99ddff', // [2]
  '#66ccff', // [3]
  '#3abdfb', // [4]
  '#28bbf8', // [5] cor principal
  '#0fa3e1', // [6]
  '#0988be', // [7]
  '#066c99', // [8]
  '#044a66', // [9] mais escuro
];

export const palettes = { forest, ruby, cobalt, honey, bee, cherry, lazuli, grass, mediumblue };

export type AppPaletteKeys = keyof typeof palettes;

// Dark blue palette to override Mantine 'dark' when using blue mode (index 9 darkest)
export const darkblue: MantineColorsTuple = [
  '#e7edf2', // 0
  '#cdd8e3', // 1
  '#b0c8dc', // 2
  '#b0c8dc', // 3
  '#2b4861', // 4
  '#253e54', // 5
  '#1f3446', // 6 popovers/menus (slightly lighter than app)
  '#192a39', // 7 app shell background (requested)
  '#13202b', // 8 base surfaces (cards/papers/menus/modals)
  '#0d161d', // 9 darker hover/active
];

export const denim: MantineColorsTuple = [
  '#e8eef3', // 0
  '#d4e0ea', // 1
  '#b8c9d8', // 2
  '#9eb3c7', // 3
  '#7f9bb3', // 4
  '#6587a3', // 5
  '#4e6f8b', // 6 primary
  '#39576f', // 7
  '#263e52', // 8
  '#13202b', // 9
];

// Subtle borders for blue mode
export const BLUE_BORDER_06 = 'rgba(255,255,255,0.06)';
export const BLUE_BORDER_08 = 'rgba(255,255,255,0.08)';
export const BLUE_BORDER_12 = 'rgba(255,255,255,0.12)';
export const BLUE_BORDER_18 = 'rgba(255,255,255,0.18)';

// Ultra dark palette for "black" mode, with index 9 as pure black
export const blackdark: MantineColorsTuple = [
  '#bfbfbf', // 0 — cinza muito escuro
  '#999999', // 1
  '#7a7a7a', // 2
  '#5c5c5c', // 3
  '#404040', // 4
  '#191919', // 5
  '#1f1f1f', // 6
  '#141414', // 7
  '#0a0a0a', // 8
  '#000000', // 9
];
