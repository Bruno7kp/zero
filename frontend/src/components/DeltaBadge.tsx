import React from 'react';
import { Badge, Flex } from '@mantine/core';
import { IconCaretUpFilled, IconCaretDownFilled, IconStarFilled, IconArrowBackUp, IconSquareFilled } from '@tabler/icons-react';
import type { BadgeStyleConfig } from '../store/badgeStylesSlice';

export interface DeltaBadgeProps {
  delta: any; // number | 'NEW' | 'RE' | '-' | '='
  cfg: BadgeStyleConfig;
  kind: 'rank' | 'plays';
  showPercent?: boolean;
  currentValue?: number;
  computePercent?: (delta: number, currentValue: number) => string | null;
  textSize?: 'xs' | 'sm' | 'md' | 'lg'; // override visual font-size independent from cfg.size
  columnContext?: boolean; // quando true (badge dentro da coluna rank/plays), aplica largura fixa
  noSidePadding?: boolean; // remove padding lateral (usado em coluna dedicada)
}

export function computeDefaultPercent(delta: number, currentValue: number): string | null {
  if (!currentValue || currentValue - delta <= 0) return null;
  const percent = (delta / (currentValue - delta)) * 100;
  return `${percent > 0 ? '+' : ''}${percent.toFixed(0)}%`;
}

export function resolveDelta(delta: any, showPercent?: boolean, currentValue?: number, computePercentFn = computeDefaultPercent) {
  let color = 'gray';
  let label: string | number = delta;
  if (typeof delta === 'number') {
    if (delta > 0) {
      color = 'green';
      if (showPercent && currentValue) {
        const p = computePercentFn(delta, currentValue);
        label = p || `+${delta}`;
      } else label = `+${delta}`;
    } else if (delta < 0) {
      color = 'red';
      if (showPercent && currentValue) {
        const p = computePercentFn(delta, currentValue);
        label = p || `${delta}`;
      } else label = `${delta}`;
    } else { color = 'gray'; label = '='; }
  } else if (delta === 'NEW') { color = 'blue'; label = 'NEW'; }
  else if (delta === 'RE') { color = 'yellow'; label = 'RE'; }
  else if (delta === '-' || delta == null) { color = 'gray'; label = '-'; }
  return { color, label };
}

export const DeltaBadge: React.FC<DeltaBadgeProps> = ({ delta, cfg, kind, showPercent, currentValue, computePercent, textSize, columnContext, noSidePadding }) => {
  const { color, label } = resolveDelta(delta, showPercent, currentValue, computePercent || computeDefaultPercent);
  let variant = cfg.variant === 'transparent' ? 'light' : cfg.variant;
  // Regra: se variante for sólida e a cor for gray, usar variante light para suavizar
  if (variant === 'filled' && color === 'gray') variant = 'light';
  const isTransparent = cfg.variant === 'transparent';
  const radius = cfg.radius === 'pill' ? 'xl' : cfg.radius;
  const size = (cfg.size as any) || 'xs';
  // Padding base (may be overridden for fixed-width column context)
  const paddingStyle = noSidePadding ? { paddingInline: 0 } : (cfg.condensed ? { paddingInline: 4 } : {});
  const showIcon = cfg.iconPosition !== 'hidden';
  const icon = ((): React.ReactNode => {
    if (delta === 'NEW') return <IconStarFilled size={10} />;
    if (delta === 'RE') return <IconArrowBackUp stroke={3} size={12} style={{ transform: 'scaleX(-1)' }} />;
    if (typeof delta === 'number') {
      if (delta > 0) return <IconCaretUpFilled size={size === 'xs' ? 12 : 14} />;
      if (delta < 0) return <IconCaretDownFilled size={size === 'xs' ? 12 : 14} />;
      // zero: só mostra square se for layout especial (split)
      if (cfg.iconPosition === 'split') return <IconSquareFilled size={8} />;
      return null;
    }
    if (delta === '=' && cfg.iconPosition === 'split') return <IconSquareFilled size={8} />; // fallback simbólico
    return null;
  })();
  const displayLabel = label; // não ocultar '=' nunca
  const fontSizeMap: Record<string, number> = { xs: 10, sm: 11, md: 12, lg: 14, xl: 16 };
  const effectiveFontSize = fontSizeMap[textSize || (cfg.size as any) || 'xs'];
  if (cfg.iconPosition === 'split' && icon) {
    if (cfg.splitTall) {
      return (
        <Flex direction="row" gap={4} align="center" style={{ height: 40 }}>
          <Badge
            color={color}
            variant={variant as any}
            size={size}
            style={{
              borderRadius: 0,
              width: 40,
              padding: 0,
              fontWeight: 700,
              fontSize: effectiveFontSize,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              ...(isTransparent ? { background: 'transparent', backgroundColor: 'transparent' } : {})
            }}
          >
            {displayLabel}
          </Badge>
          <Badge
            color={color}
            variant={(cfg.splitIconVariant || 'filled') as any}
            size={size}
            style={{
              borderRadius: 0,
              width: 15,
              height: '100%',
              minHeight: 32,
              padding: 0,
              display: 'flex',
              alignItems: 'stretch',
              ...(isTransparent && (cfg.splitIconVariant === 'transparent' || cfg.splitIconVariant === 'filled') ? { background: 'transparent', backgroundColor: 'transparent' } : {})
            }}
          >
            <Flex align="center" justify="center" style={{ height: '100%', width: '100%' }}>
              {icon}
            </Flex>
          </Badge>
        </Flex>
      );
    }
    return (
      <Flex direction="row" gap={2} align="center">
        <Badge variant={variant as any} color={color} radius={radius as any} size={size} style={{ fontWeight: 700, fontSize: effectiveFontSize, ...paddingStyle, ...(isTransparent ? { background: 'transparent', backgroundColor: 'transparent' } : {}) }}>{displayLabel}</Badge>
        <Badge variant={cfg.splitIconVariant || 'filled'} color={color} radius={radius as any} size={size} style={{ fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingInline: 4, ...(isTransparent && (cfg.splitIconVariant === 'transparent') ? { background: 'transparent', backgroundColor: 'transparent' } : {}) }}>
          {icon}
        </Badge>
      </Flex>
    );
  }
  // Largura fixa apenas em contexto de coluna (rank/plays sob o número): com ícone 55px, sem ícone 40px
  const applyFixed = !!columnContext && cfg.iconPosition !== 'split';
  const fixedWidth = applyFixed ? (cfg.iconPosition === 'hidden' ? 40 : 55) : undefined;
  // When fixed width applies we remove horizontal padding entirely
  const finalPaddingStyle = applyFixed ? { paddingInline: 0 } : paddingStyle;
  return (
    <Badge
      key={`${kind}-delta`}
      variant={variant as any}
      color={color}
      radius={radius as any}
      size={size}
      style={{
        fontWeight: 700,
        fontSize: effectiveFontSize,
        width: fixedWidth,
        minWidth: fixedWidth,
        textAlign: 'center',
        justifyContent: 'center',
        ...finalPaddingStyle,
        ...(isTransparent ? { background: 'transparent', backgroundColor: 'transparent' } : {})
      }}
    >
      <Flex align="center" gap={4} justify="center" style={{ lineHeight: 1, width: '100%', justifyContent: 'center', whiteSpace: 'nowrap', overflow: 'hidden' }}>
        {showIcon && cfg.iconPosition === 'before' && icon}
        {displayLabel && <span style={{ display: 'inline-block' }}>{displayLabel}</span>}
        {showIcon && cfg.iconPosition === 'after' && icon}
      </Flex>
    </Badge>
  );
};

export default DeltaBadge;