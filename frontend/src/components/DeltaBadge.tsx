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
    contextView?: 'table' | 'list' | 'grid'; // para regras visuais específicas por view
    fixedWidthOverride?: number; // largura fixa opcional (ex.: coluna dedicada)
}

function computeDefaultPercent(delta: number, currentValue: number): string | null {
    if (!currentValue || currentValue - delta <= 0) return null;
    const percent = (delta / (currentValue - delta)) * 100;
    return `${percent > 0 ? '+' : ''}${percent.toFixed(0)}%`;
}

function resolveDelta(delta: any, showPercent?: boolean, currentValue?: number, darker?: boolean, computePercentFn = computeDefaultPercent) {
    let color = 'gray';
    let label: string | number = delta;
    if (typeof delta === 'number') {
        if (delta > 0) {
            color = darker ? 'forest' : 'grass';
            if (showPercent && currentValue) {
                const p = computePercentFn(delta, currentValue);
                label = p || `+${delta}`;
            } else label = `+${delta}`;
        } else if (delta < 0) {
            color = darker ? 'ruby' : 'cherry';
            if (showPercent && currentValue) {
                const p = computePercentFn(delta, currentValue);
                label = p || `${delta}`;
            } else label = `${delta}`;
        } else { color = 'gray'; label = '='; }
    } else if (delta === 'NEW') { color = darker ? 'cobalt' : 'lazuli'; label = 'NEW'; }
    else if (delta === 'RE') { color = darker ? 'honey' : 'bee'; label = 'RE'; }
    else if (delta === '-' || delta == null) { color = 'gray'; label = '-'; }
    return { color, label };
}

export const DeltaBadge: React.FC<DeltaBadgeProps> = ({ delta, cfg, kind, showPercent, currentValue, computePercent, textSize, columnContext, noSidePadding, contextView, fixedWidthOverride }) => {
    // Preserve last stable (defined) delta to avoid flashing '-' during quick transitions (without reading refs during render)
    const [stableDelta, setStableDelta] = React.useState<any>(delta);
    const isDefined = !(delta === undefined || delta === null);
    React.useEffect(() => {
        if (isDefined) setStableDelta(delta);
    }, [isDefined, delta]);
    const hasStable = !(stableDelta === undefined || stableDelta === null);
    const effectiveDelta = isDefined ? delta : (hasStable ? stableDelta : undefined);
    const darker = cfg.variant !== 'filled';
    const { color, label } = resolveDelta(effectiveDelta, showPercent, currentValue, darker, computePercent || computeDefaultPercent);
    let variant = cfg.variant;
    // Regra: se variante for sólida e a cor for gray, usar variante light para suavizar SOMENTE em tabela/lista (grid mantém filled)
    if (variant === 'filled' && color === 'gray' && (contextView === 'table' || contextView === 'list' || (!contextView))) variant = 'light';
        const isTransparent = cfg.variant === 'transparent';
        const applyGridFrosted = contextView === 'grid' && isTransparent;
            const frostedStyles = applyGridFrosted
                    ? {
                            background: 'rgba(0, 0, 0, 0.35)',
                            backgroundColor: 'rgba(0, 0, 0, 0.35)',
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                            color: '#fff',
                        }
                    : {
                            background: 'transparent',
                            backgroundColor: 'transparent',
                        };
    const radius = cfg.radius === 'pill' ? 'xl' : cfg.radius;
    const size = (cfg.size as any) || 'xs';
    // Padding base (may be overridden for fixed-width column context)
    const paddingStyle = noSidePadding ? { paddingInline: 0 } : (cfg.condensed ? { paddingInline: 4 } : {});
    const showIcon = cfg.iconPosition !== 'hidden';
    const icon = ((): React.ReactNode => {
        // Base icon size by badge size
        const baseIconSize = size === 'xs' ? 12 : size === 'sm' ? 14 : size === 'md' ? 16 : size === 'lg' ? 18 : 20;
        const isIconOnly = (cfg.hideLabel && cfg.iconPosition !== 'split' && label !== '=');
        if (effectiveDelta === 'NEW') {
            // Keep subtle boost only +2 when icon-only
            const eff = baseIconSize + (isIconOnly ? 2 : 0) - 2; // star a bit smaller
            return <IconStarFilled size={eff} />;
        }
        if (effectiveDelta === 'RE') {
            const eff = baseIconSize + (isIconOnly ? 2 : 0);
            return <IconArrowBackUp stroke={3} size={eff} style={{ transform: 'scaleX(-1)' }} />;
        }
        if (typeof effectiveDelta === 'number') {
            if (effectiveDelta > 0) {
                const eff = baseIconSize + (isIconOnly ? 4 : 0); // +4 boost for up arrow when icon-only
                return <IconCaretUpFilled size={eff} />;
            }
            if (effectiveDelta < 0) {
                const eff = baseIconSize + (isIconOnly ? 4 : 0); // +4 boost for down arrow when icon-only
                return <IconCaretDownFilled size={eff} />;
            }
            if (cfg.iconPosition === 'split') return <IconSquareFilled size={8} />;
            return null;
        }
        if (effectiveDelta === '=' && cfg.iconPosition === 'split') return <IconSquareFilled size={8} />;
        return null;
    })();
    // Em presets "apenas ícone" ocultamos label; no grid, ocultamos até o '=' para ficar 100% ícone
    let displayLabel = cfg.hideLabel
        ? (contextView === 'grid' ? (label === '=' ? label : '') : (label === '=' ? label : ''))
        : label;
    // Se o modo é texto + ícone (não split, ícone visível), remover textos 'NEW' e 'RE' e deixar só o ícone
    if (!cfg.hideLabel && cfg.iconPosition !== 'hidden' && cfg.iconPosition !== 'split') {
        if (effectiveDelta === 'NEW' || effectiveDelta === 'RE') {
            displayLabel = '';
        }
    }
    const fontSizeMap: Record<string, number> = { xs: 10, sm: 11, md: 12, lg: 14, xl: 16 };
    const effectiveFontSize = fontSizeMap[textSize || (cfg.size as any) || 'xs'];
    const isFilledVariant = cfg.splitIconVariant === 'filled';
    const splitVariant = resolveDelta(effectiveDelta, showPercent, currentValue, !isFilledVariant, computePercent || computeDefaultPercent);
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
                            ...(isTransparent ? frostedStyles : {})
                        }}
                    >
                        {displayLabel}
                    </Badge>
                    <Badge
                        color={splitVariant.color}
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
                            ...(isTransparent && (cfg.splitIconVariant === 'transparent' || cfg.splitIconVariant === 'filled') ? frostedStyles : {})
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
                <Badge variant={variant as any} color={color} radius={radius as any} size={size} style={{ fontWeight: 700, fontSize: effectiveFontSize, ...paddingStyle, ...(isTransparent ? frostedStyles : {}) }}>{displayLabel}</Badge>
                <Badge variant={cfg.splitIconVariant || 'filled'} color={color} radius={radius as any} size={size} style={{ fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingInline: 4, ...(isTransparent && (cfg.splitIconVariant === 'transparent') ? frostedStyles : {}) }}>
                    {icon}
                </Badge>
            </Flex>
        );
    }
    // Largura fixa apenas em contexto de coluna (rank/plays sob o número): com ícone 55px, sem ícone 40px
    const applyFixed = !!columnContext && cfg.iconPosition !== 'split';
    // Treat icon-only (hideLabel) same as text-only for width purposes
    const treatAsHiddenForWidth = cfg.hideLabel && cfg.iconPosition === 'before';
    const fixedWidthBase = applyFixed ? ((cfg.iconPosition === 'hidden' || treatAsHiddenForWidth) ? 40 : 55) : undefined;
    const fixedWidth = fixedWidthOverride ?? fixedWidthBase;
    // Altura fixa em contexto de coluna para normalizar posição vertical entre texto/ícone/text+ícone
    const heightMap: Record<string, number> = { xs: 14, sm: 18, md: 20, lg: 24, xl: 28 };
    const fixedHeight = applyFixed ? heightMap[(size as string) || 'xs'] : undefined;
    // When fixed width applies we remove horizontal padding entirely
    const finalPaddingStyle = applyFixed ? { paddingInline: 0 } : paddingStyle;
    // If we still don't have a stable value to show, render a transparent placeholder with fixed dimensions to avoid flicker
    if (!hasStable && !isDefined) {
        return (
            <Badge
                key={`${kind}-delta-placeholder`}
                variant="transparent"
                color={color as any}
                radius={radius as any}
                size={size}
                style={{
                    width: fixedWidth,
                    minWidth: fixedWidth,
                    height: fixedHeight,
                    minHeight: fixedHeight,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    ...finalPaddingStyle,
                    ...(isTransparent ? frostedStyles : {}),
                }}
                aria-busy
            >
                {/* empty placeholder to keep layout */}
            </Badge>
        );
    }
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
                height: fixedHeight,
                minHeight: fixedHeight,
                textAlign: 'center',
                justifyContent: 'center',
                display: 'flex',
                alignItems: 'center',
                ...finalPaddingStyle,
                ...(isTransparent ? frostedStyles : {}),
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