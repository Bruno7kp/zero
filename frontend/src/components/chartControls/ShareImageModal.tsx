import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Box, Grid, Center, Loader, Text, Textarea } from '@mantine/core';
import { useSelector, useDispatch } from 'react-redux';
import html2canvas from 'html2canvas';
import { generateGridHTML } from './templates/gridTemplate';
import { generateStoriesHTML } from './templates/storiesTemplate';
import { generateStories2HTML } from './templates/stories2Template';
import { generateCompletoHTML } from './templates/completoTemplate';
import { spotifyImagesDb } from '../../db/spotifyImagesDb';
import { db } from '../../db/indexedDb';
import { generatePlainTextChart } from './utils/shareUtils';
import { ShareOptions } from './ShareOptions';
import { fetchStatsMapIncremental } from '../../store/charts';
import { removeStatsCacheEntry } from '../../store/chartsSlice';

interface ShareImageModalProps {
  t: (k: any, options?: any) => string;
  chartData: any[];
  chartName: string;
  lastfmUsername?: string;
  week: string | undefined;
  weekNumber: number | null;
  chartType: 'artist' | 'album' | 'track';
  chart: any;
  opened: boolean;
  onClose: () => void;
}

export const ShareImageModal: React.FC<ShareImageModalProps> = ({
  t,
  chartData,
  chartName,
  lastfmUsername,
  week,
  weekNumber,
  chartType,
  chart,
  opened,
  onClose,
}) => {
  // Load saved settings from localStorage
  const loadSavedSettings = () => {
    try {
      const saved = localStorage.getItem(`shareSettings_${chart?.id}_${chartType}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  };

  const savedSettings = loadSavedSettings();

  const [selectedType, setSelectedType] = useState<'grid' | 'stories' | 'stories2' | 'completo' | 'text'>(savedSettings.selectedType || 'stories2');
  const [selectedGridSize, setSelectedGridSize] = useState<3 | 4 | 5 | 6 | 7 | 8 | 9 | 10>(savedSettings.selectedGridSize || 3);
  const [selectedGridShowText, setSelectedGridShowText] = useState<boolean>(savedSettings.selectedGridShowText ?? true);
  const [selectedGridShowVariationIcons, setSelectedGridShowVariationIcons] = useState<boolean>(savedSettings.selectedGridShowVariationIcons ?? true);
  const [selectedStoriesTop, setSelectedStoriesTop] = useState<5 | 10>(savedSettings.selectedStoriesTop || 10);
  const [selectedStories2Top, setSelectedStories2Top] = useState<5 | 10>(savedSettings.selectedStories2Top || 10);
  const [selectedStories2BackgroundType, setSelectedStories2BackgroundType] = useState<'blur' | 'solid'>(savedSettings.selectedStories2BackgroundType || 'blur');
  const [selectedStories2BackgroundColor, setSelectedStories2BackgroundColor] = useState<string>(savedSettings.selectedStories2BackgroundColor || '#1a1a1a');
  const [selectedStories2ShowPlays, setSelectedStories2ShowPlays] = useState<'last' | 'plays' | 'peak' | 'weeks'>(savedSettings.selectedStories2ShowPlays || 'last');
  const [selectedStories2ListWrapBackgroundType, setSelectedStories2ListWrapBackgroundType] = useState<'transparent' | 'solid'>(savedSettings.selectedStories2ListWrapBackgroundType || 'transparent');
  const [selectedStories2ListWrapBackgroundColor, setSelectedStories2ListWrapBackgroundColor] = useState<string>(savedSettings.selectedStories2ListWrapBackgroundColor || '#1a1a1a');
  const [selectedStories2ShowAlbumCovers, setSelectedStories2ShowAlbumCovers] = useState<boolean>(savedSettings.selectedStories2ShowAlbumCovers ?? true);
  const [selectedStories2ShowColoredIcons, setSelectedStories2ShowColoredIcons] = useState<boolean>(savedSettings.selectedStories2ShowColoredIcons ?? true);
  const [selectedStories2ShowIconBackground, setSelectedStories2ShowIconBackground] = useState<boolean>(savedSettings.selectedStories2ShowIconBackground ?? true);
  const [selectedCompletoBackgroundColor, setSelectedCompletoBackgroundColor] = useState<string>(savedSettings.selectedCompletoBackgroundColor || '#1a1a1a');
  const [selectedCompletoTop, setSelectedCompletoTop] = useState<string>(savedSettings.selectedCompletoTop || "full");
  const [selectedCompletoShowColoredIcons, setSelectedCompletoShowColoredIcons] = useState<boolean>(savedSettings.selectedCompletoShowColoredIcons ?? true);
  const [selectedCompletoColumns, setSelectedCompletoColumns] = useState<string[]>(savedSettings.selectedCompletoColumns || ['plays', 'last']);
  const [selectedCompletoCustomHeaderImage, setSelectedCompletoCustomHeaderImage] = useState<string>(savedSettings.selectedCompletoCustomHeaderImage || '');

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (chart?.id && chartType) {
      const settings = {
        selectedType,
        selectedGridSize,
        selectedGridShowText,
        selectedGridShowVariationIcons,
        selectedStoriesTop,
        selectedStories2Top,
        selectedStories2BackgroundType,
        selectedStories2BackgroundColor,
        selectedStories2ShowPlays,
        selectedStories2ListWrapBackgroundType,
        selectedStories2ListWrapBackgroundColor,
        selectedStories2ShowAlbumCovers,
        selectedStories2ShowColoredIcons,
        selectedStories2ShowIconBackground,
        selectedCompletoBackgroundColor,
        selectedCompletoTop,
        selectedCompletoShowColoredIcons,
        selectedCompletoColumns,
        selectedCompletoCustomHeaderImage,
      };
      localStorage.setItem(`shareSettings_${chart.id}_${chartType}`, JSON.stringify(settings));
    }
  }, [
    chart?.id,
    chartType,
    selectedType,
    selectedGridSize,
    selectedGridShowText,
    selectedGridShowVariationIcons,
    selectedStoriesTop,
    selectedStories2Top,
    selectedStories2BackgroundType,
    selectedStories2BackgroundColor,
    selectedStories2ShowPlays,
    selectedStories2ListWrapBackgroundType,
    selectedStories2ListWrapBackgroundColor,
    selectedStories2ShowAlbumCovers,
    selectedStories2ShowColoredIcons,
    selectedStories2ShowIconBackground,
    selectedCompletoBackgroundColor,
    selectedCompletoTop,
    selectedCompletoShowColoredIcons,
    selectedCompletoColumns,
    selectedCompletoCustomHeaderImage,
  ]);

  // Estados para a imagem de prévia e o carregamento
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentImageType, setCurrentImageType] = useState<string>('');
  
  // Cache dos dados enriquecidos para evitar reprocessamento
  const [enrichedDataCache, setEnrichedDataCache] = useState<any[] | null>(null);

  const statsMap = useSelector((state: any) => state.charts?.statsMap || {});
  const dispatch = useDispatch();

  // Lista de domínios permitidos para imagens (mesma lista do ImageEditModal)
  const ALLOWED_IMAGE_DOMAINS = [
    'i.scdn.co', 'open.spotify.com',
    'last.fm', 'lastfm-img2.akamaized.net', 'lastfm.freetls.fastly.net',
    'e-cdns-images.dzcdn.net',
    'is5-ssl.mzstatic.com', 'is4-ssl.mzstatic.com',
    'img.discogs.com', 'coverartarchive.org',
    'f4.bcbits.com', 'resources.tidal.com',
    'i1.sndcdn.com', 'images-na.ssl-images-amazon.com',
    'yt3.ggpht.com', 'i.ytimg.com',
    'i.imgur.com', 'imgur.com',
    'res.cloudinary.com', 'images.unsplash.com',
    'live.staticflickr.com', 'lh3.googleusercontent.com',
    'raw.githubusercontent.com', 'user-images.githubusercontent.com',
  ];

  const isAllowedImageDomain = useCallback((url: string): boolean => {
    if (!url) return true; // Empty URL is allowed (will use default)
    try {
      const u = new URL(url);
      return ALLOWED_IMAGE_DOMAINS.some(domain => u.hostname.endsWith(domain));
    } catch {
      return false;
    }
  }, []);

  // Load stats map if needed
  useEffect(() => {
    if (opened && chartData.length > 0 && week && chart?.id) {
      // Aguarda o modal renderizar antes de carregar os stats
      const timeoutId = setTimeout(() => {
        // Always clear cache and reload to ensure fresh data
        const cacheKey = `${chart.id}_${chartType}_${week}`;
        dispatch(removeStatsCacheEntry(cacheKey));
        dispatch(fetchStatsMapIncremental({ 
          chartId: String(chart.id), 
          chartType: String(chartType), 
          data: chartData, 
          week 
        }) as any);
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [opened, chartData, week, chart?.id, chartType, dispatch]);

  const getCurrentTypeKey = useCallback(() => {
    return selectedType; // Só o tipo, já que outras configs não disparam auto-update
  }, [selectedType]);

  // Função que gera a imagem em alta resolução em background
  const generatePreviewImage = useCallback(async () => {
    if (selectedType === 'text') {
      setPreviewImageUrl(null);
      setCurrentImageType(getCurrentTypeKey());
      setIsLoading(false);
      return;
    }

    // Usar cache se disponível, caso contrário enriquecer os dados
    let enrichedData: any[];
    
    if (enrichedDataCache) {
      // Usa o cache existente - muito mais rápido!
      enrichedData = enrichedDataCache;
    } else {
      // Enriquecer data com imagens e estatísticas (apenas na primeira vez)
      enrichedData = await Promise.all(chartData.map(async (row) => {
        const cached = await spotifyImagesDb.images.get(row.entityId);
        const imageUrl = cached?.imageUrl || null;
        const albumImage = imageUrl; // para compatibilidade
        
        // Calcular stats localmente se não estiver disponível no statsMap
        let peak = null;
        let weeks = null;
        
        const existingStats = statsMap?.[row.entityId];
        if (existingStats?.peak?.position && existingStats?.totals?.withinCutoff) {
          peak = existingStats.peak.position;
          weeks = existingStats.totals.withinCutoff;
        } else {
          // Calcular stats diretamente do banco
          try {
            const historicalData = await db.charts_data
              .where('[chartId+chartType+entityId+week]')
              .between([chart.id.toString(), chartType, row.entityId, '0000'], [chart.id.toString(), chartType, row.entityId, week])
              .toArray();
            
            if (historicalData.length > 0) {
              let minRank = Infinity;
              let weeksCount = 0;
              
              for (const hist of historicalData) {
                if (hist.rank != null) {
                  weeksCount++;
                  if (typeof hist.rank === 'number' && hist.rank < minRank) {
                    minRank = hist.rank;
                  }
                }
              }
              
              peak = minRank === Infinity ? null : minRank;
              weeks = weeksCount;
            }
          } catch (error) {
            console.error('Error calculating stats for', row.entityId, error);
          }
        }
        
        return { ...row, imageUrl, albumImage, peak, weeks };
      }));
      
      // Salva no cache para uso futuro
      setEnrichedDataCache(enrichedData);
    }

    let htmlForCanvas: string;
    let topCount: number = 20; // default
    if (selectedType === 'stories2') {
      let dateRange = '';
      if (week) {
        const endDate = new Date(week);
        const startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 6);
        const formatDate = (d: Date) => `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;
        dateRange = `${formatDate(startDate)} - ${formatDate(endDate)}`;
      }
      htmlForCanvas = await generateStories2HTML(enrichedData, selectedStories2Top, week, weekNumber, chartType, dateRange, selectedStories2BackgroundType, selectedStories2BackgroundColor, lastfmUsername, selectedStories2ShowPlays, selectedStories2ListWrapBackgroundType, selectedStories2ListWrapBackgroundColor, selectedStories2ShowAlbumCovers, selectedStories2ShowColoredIcons, selectedStories2ShowIconBackground);
    } else {
      topCount = selectedCompletoTop === "full" ? chartData.length : parseInt(selectedCompletoTop);
      // Validar a URL customizada antes de usar
      const validCustomHeaderImage = selectedCompletoCustomHeaderImage && isAllowedImageDomain(selectedCompletoCustomHeaderImage) 
        ? selectedCompletoCustomHeaderImage 
        : '';
      
      htmlForCanvas = selectedType === 'grid'
        ? generateGridHTML(enrichedData, selectedGridSize, selectedGridShowText, selectedGridShowVariationIcons)
        : selectedType === 'stories'
        ? generateStoriesHTML(enrichedData, selectedStoriesTop, week, weekNumber, chartType)
        : generateCompletoHTML(enrichedData, week, weekNumber, chartType, selectedCompletoBackgroundColor, topCount, selectedCompletoShowColoredIcons, selectedCompletoColumns, chart, validCustomHeaderImage);
    }
    
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.innerHTML = htmlForCanvas;
    document.body.appendChild(tempDiv);

    try {
      let options: any = { backgroundColor: '#ffffff', logging: false, allowTaint: true, useCORS: true };
      if (selectedType === 'stories' || selectedType === 'stories2') {
        options = { ...options, width: 1080, height: 1920 };
      } else if (selectedType === 'grid') {
        const sizePx = selectedGridSize * 300;
        options = { ...options, width: sizePx, height: sizePx };
      } else if (selectedType === 'completo') {
        options = { ...options, width: 950, backgroundColor: selectedCompletoBackgroundColor };
      }
      
      const selector = selectedType === 'stories2' ? '.story' : selectedType === 'completo' ? '.chart-container' : '.poster';
      const canvas = await html2canvas(tempDiv.querySelector(selector) as HTMLElement, options);
      setPreviewImageUrl(canvas.toDataURL('image/png'));
      setCurrentImageType(getCurrentTypeKey());
    } catch (error) {
      console.error('Error generating preview image:', error);
      setPreviewImageUrl(null);
    } finally {
      document.body.removeChild(tempDiv);
      setIsLoading(false);
    }
  }, [chartData, selectedType, selectedGridSize, selectedGridShowText, selectedGridShowVariationIcons, selectedStoriesTop, selectedStories2Top, week, weekNumber, chartType, getCurrentTypeKey, lastfmUsername, selectedStories2BackgroundColor, selectedStories2BackgroundType, selectedStories2ShowPlays, selectedStories2ListWrapBackgroundColor, selectedStories2ListWrapBackgroundType, selectedStories2ShowAlbumCovers, selectedStories2ShowColoredIcons, selectedStories2ShowIconBackground, statsMap, selectedCompletoBackgroundColor, selectedCompletoTop, selectedCompletoShowColoredIcons, selectedCompletoColumns, selectedCompletoCustomHeaderImage, chart, enrichedDataCache]);

  // Efeito que gera a imagem de prévia apenas quando o tipo muda ou modal abre
  useEffect(() => {
    if (opened) {
      // Limpa a prévia quando o tipo muda
      setPreviewImageUrl(null);
      setCurrentImageType('');
      setIsLoading(true);
      
      // Aguarda o modal estar completamente renderizado antes de gerar a imagem
      // Usa requestAnimationFrame para garantir que o navegador renderize primeiro
      const rafId = requestAnimationFrame(() => {
        const timeoutId = setTimeout(() => {
          generatePreviewImage();
        }, 200);
        
        // Cleanup do timeout
        return () => clearTimeout(timeoutId);
      });
      
      return () => {
        cancelAnimationFrame(rafId);
      };
    } else {
      // Limpa o cache quando o modal é fechado
      setEnrichedDataCache(null);
    }
  }, [opened, selectedType]); // eslint-disable-line react-hooks/exhaustive-deps

  // O download agora é instantâneo
  const handleDownload = () => {
    if (!previewImageUrl) return;
    const link = document.createElement('a');
    const suffix = selectedType === 'grid' ? `_${selectedGridSize}x${selectedGridSize}` : (selectedType === 'stories' || selectedType === 'stories2') ? `_${selectedType === 'stories' ? selectedStoriesTop : selectedStories2Top}` : '';
    const weekSuffix = weekNumber ? `_week${weekNumber}` : '';
    link.download = `${chartName}_${chartType}${weekSuffix}_${selectedType}${suffix}.png`;
    link.href = previewImageUrl;
    link.click();
  };

  return (
    <Modal opened={opened} onClose={onClose} title={t('charts.share.shareChartTitle', 'Compartilhar chart')} fullScreen centered>
      <Box>
        <Grid>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Text size="sm" c="dimmed" mb="md">{t('settings.title')}</Text>
            <ShareOptions
              t={t}
              selectedType={selectedType}
              setSelectedType={setSelectedType}
              selectedGridSize={selectedGridSize}
              setSelectedGridSize={setSelectedGridSize}
              selectedGridShowText={selectedGridShowText}
              setSelectedGridShowText={setSelectedGridShowText}
              selectedGridShowVariationIcons={selectedGridShowVariationIcons}
              setSelectedGridShowVariationIcons={setSelectedGridShowVariationIcons}
              selectedStoriesTop={selectedStoriesTop}
              setSelectedStoriesTop={setSelectedStoriesTop}
              selectedStories2Top={selectedStories2Top}
              setSelectedStories2Top={setSelectedStories2Top}
              selectedStories2BackgroundType={selectedStories2BackgroundType}
              setSelectedStories2BackgroundType={setSelectedStories2BackgroundType}
              selectedStories2BackgroundColor={selectedStories2BackgroundColor}
              setSelectedStories2BackgroundColor={setSelectedStories2BackgroundColor}
              selectedStories2ShowPlays={selectedStories2ShowPlays}
              setSelectedStories2ShowPlays={setSelectedStories2ShowPlays}
              selectedStories2ListWrapBackgroundType={selectedStories2ListWrapBackgroundType}
              setSelectedStories2ListWrapBackgroundType={setSelectedStories2ListWrapBackgroundType}
              selectedStories2ListWrapBackgroundColor={selectedStories2ListWrapBackgroundColor}
              setSelectedStories2ListWrapBackgroundColor={setSelectedStories2ListWrapBackgroundColor}
              selectedStories2ShowAlbumCovers={selectedStories2ShowAlbumCovers}
              setSelectedStories2ShowAlbumCovers={setSelectedStories2ShowAlbumCovers}
              selectedStories2ShowColoredIcons={selectedStories2ShowColoredIcons}
              setSelectedStories2ShowColoredIcons={setSelectedStories2ShowColoredIcons}
              selectedStories2ShowIconBackground={selectedStories2ShowIconBackground}
              setSelectedStories2ShowIconBackground={setSelectedStories2ShowIconBackground}
              selectedCompletoBackgroundColor={selectedCompletoBackgroundColor}
              setSelectedCompletoBackgroundColor={setSelectedCompletoBackgroundColor}
              selectedCompletoTop={selectedCompletoTop}
              setSelectedCompletoTop={setSelectedCompletoTop}
              selectedCompletoShowColoredIcons={selectedCompletoShowColoredIcons}
              setSelectedCompletoShowColoredIcons={setSelectedCompletoShowColoredIcons}
              selectedCompletoColumns={selectedCompletoColumns}
              setSelectedCompletoColumns={setSelectedCompletoColumns}
              selectedCompletoCustomHeaderImage={selectedCompletoCustomHeaderImage}
              setSelectedCompletoCustomHeaderImage={setSelectedCompletoCustomHeaderImage}
              isAllowedImageDomain={isAllowedImageDomain}
              chartType={chartType}
              chartData={chartData}
              previewImageUrl={previewImageUrl}
              isLoading={isLoading}
              handleDownload={handleDownload}
              statsMap={statsMap}
              chartName={chartName}
              week={week}
              weekNumber={weekNumber}
              onUpdatePreview={() => {
                setPreviewImageUrl(null);
                setIsLoading(true);
                setCurrentImageType('');
                
                // Usa requestAnimationFrame + setTimeout para não travar a UI
                requestAnimationFrame(() => {
                  setTimeout(() => {
                    generatePreviewImage();
                  }, 50);
                });
              }}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Text size="sm" c="dimmed" mb="md">{t('charts.share.preview', 'Preview')}</Text>
            <Center style={{ border: '1px solid rgba(125,125,125,0.3)', borderRadius: '8px', width: '100%', padding: '10px' }} h={{ base: 'auto', sm: '85vh' }}>
              {selectedType === 'text' ? (
                <Textarea w="100%" value={generatePlainTextChart(t, chartData, chartName, week, weekNumber, chartType, statsMap)} readOnly rows={22} styles={{input: {margin: '0 auto', width: '100%', maxWidth: '550px', fontFamily: 'monospace', fontSize: '12px'}}} />
              ) : (
                <>
                  {isLoading && <Loader />}
                  {!isLoading && previewImageUrl && currentImageType === getCurrentTypeKey() && (
                    <img
                      src={previewImageUrl}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                      }}
                      alt="Chart Preview"
                    />
                  )}
                  {!isLoading && (!previewImageUrl || currentImageType !== getCurrentTypeKey()) && <Text>Não foi possível gerar a prévia.</Text>}
                </>
              )}
            </Center>
          </Grid.Col>
        </Grid>
      </Box>
    </Modal>
  );
};

export default ShareImageModal;