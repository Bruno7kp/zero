import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Box, Grid, Center, Loader, Text, Textarea } from '@mantine/core';
import { useSelector } from 'react-redux';
import html2canvas from 'html2canvas';
import { generateGridHTML } from './templates/gridTemplate';
import { generateStoriesHTML } from './templates/storiesTemplate';
import { generateStories2HTML } from './templates/stories2Template';
import { generateCompletoHTML } from './templates/completoTemplate';
import { spotifyImagesDb } from '../../db/spotifyImagesDb';
import { generatePlainTextChart } from './utils/shareUtils';
import { ShareOptions } from './ShareOptions';

interface ShareImageModalProps {
  t: (k: any, options?: any) => string;
  chartData: any[];
  chartName: string;
  lastfmUsername?: string;
  week: string | undefined;
  weekNumber: number | null;
  chartType: 'artist' | 'album' | 'track';
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
  opened,
  onClose,
}) => {
  const [selectedType, setSelectedType] = useState<'grid' | 'stories' | 'stories2' | 'completo' | 'text'>('stories');
  const [selectedGridSize, setSelectedGridSize] = useState<3 | 4 | 5>(3);
  const [selectedStoriesTop, setSelectedStoriesTop] = useState<5 | 10>(10);
  const [selectedStories2Top, setSelectedStories2Top] = useState<5 | 10>(10);
  const [selectedStories2BackgroundType, setSelectedStories2BackgroundType] = useState<'blur' | 'solid'>('blur');
  const [selectedStories2BackgroundColor, setSelectedStories2BackgroundColor] = useState<string>('#1a1a1a');
  const [selectedStories2ShowPlays, setSelectedStories2ShowPlays] = useState<'last' | 'plays' | 'peak' | 'weeks'>('last');

  // Estados para a imagem de prévia e o carregamento
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentImageType, setCurrentImageType] = useState<string>('');

  const statsMap = useSelector((state: any) => state.charts?.statsMap || {});

  // Função helper para gerar o tipo atual da imagem
  const getCurrentTypeKey = useCallback(() => {
    return `${selectedType}-${selectedType === 'grid' ? selectedGridSize : (selectedType === 'stories' || selectedType === 'stories2') ? (selectedType === 'stories' ? selectedStoriesTop : `${selectedStories2Top}-${selectedStories2BackgroundType}${selectedStories2BackgroundType === 'solid' ? `-${selectedStories2BackgroundColor}` : ''}-${selectedStories2ShowPlays}`) : selectedType === 'text' ? 'text' : 'completo'}`;
  }, [selectedType, selectedGridSize, selectedStoriesTop, selectedStories2Top, selectedStories2BackgroundType, selectedStories2BackgroundColor, selectedStories2ShowPlays]);

  // Função que gera a imagem em alta resolução em background
  const generatePreviewImage = useCallback(async () => {
    if (selectedType === 'text') {
      setPreviewImageUrl(null);
      setCurrentImageType(getCurrentTypeKey());
      setIsLoading(false);
      return;
    }

    // Enriquecer data com imagens e estatísticas
    const enrichedData = await Promise.all(chartData.map(async (row) => {
      const cached = await spotifyImagesDb.images.get(row.entityId);
      const imageUrl = cached?.imageUrl || null;
      const albumImage = imageUrl; // para compatibilidade
      
      // Adicionar informações de estatísticas
      const stats = statsMap?.[row.entityId] || {};
      const peak = stats?.peak?.position ?? null;
      const weeks = stats?.totals?.withinCutoff ?? null;
      
      return { ...row, imageUrl, albumImage, peak, weeks };
    }));

    let htmlForCanvas: string;
    if (selectedType === 'stories2') {
      let dateRange = '';
      if (week) {
        const endDate = new Date(week);
        const startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 6);
        const formatDate = (d: Date) => `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;
        dateRange = `${formatDate(startDate)} - ${formatDate(endDate)}`;
      }
      htmlForCanvas = await generateStories2HTML(enrichedData, selectedStories2Top, week, weekNumber, chartType, dateRange, selectedStories2BackgroundType, selectedStories2BackgroundColor, lastfmUsername, selectedStories2ShowPlays);
    } else {
      htmlForCanvas = selectedType === 'grid'
        ? generateGridHTML(enrichedData, selectedGridSize)
        : selectedType === 'stories'
        ? generateStoriesHTML(enrichedData, selectedStoriesTop, week, weekNumber, chartType)
        : generateCompletoHTML(enrichedData, chartName, week, weekNumber, chartType);
    }
    
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.innerHTML = htmlForCanvas;
    document.body.appendChild(tempDiv);

    try {
      let options: any = { backgroundColor: '#ffffff', logging: false, allowTaint: true, useCORS: true };
      if (selectedType === 'stories' || selectedType === 'stories2' || selectedType === 'completo') {
        options = { ...options, width: 1080, height: 1920 };
      } else if (selectedType === 'grid') {
        const sizePx = selectedGridSize * 300;
        options = { ...options, width: sizePx, height: sizePx };
      }
      
      const selector = selectedType === 'stories2' ? '.story' : '.poster';
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
  }, [chartData, selectedType, selectedGridSize, selectedStoriesTop, selectedStories2Top, week, weekNumber, chartType, chartName, getCurrentTypeKey, lastfmUsername, selectedStories2BackgroundColor, selectedStories2BackgroundType, selectedStories2ShowPlays]);

  // Efeito que gera a imagem de prévia sempre que uma opção muda
  useEffect(() => {
    // Limpa a imagem imediatamente quando as opções mudam
    setPreviewImageUrl(null);
    setIsLoading(true);
    setCurrentImageType('');

    // Debounce: espera 300ms após a última mudança para gerar a imagem
    const handler = setTimeout(() => {
      if (opened) { // Só gera se o modal estiver aberto
        generatePreviewImage();
      }
    }, 300);

    // Limpa o timeout se o usuário fizer outra alteração antes dos 300ms
    return () => {
      clearTimeout(handler);
    };
  }, [selectedType, selectedGridSize, selectedStoriesTop, selectedStories2Top, selectedStories2ShowPlays, chartData, opened, generatePreviewImage]);

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
            <ShareOptions
              t={t}
              selectedType={selectedType}
              setSelectedType={setSelectedType}
              selectedGridSize={selectedGridSize}
              setSelectedGridSize={setSelectedGridSize}
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
              chartData={chartData}
              previewImageUrl={previewImageUrl}
              isLoading={isLoading}
              handleDownload={handleDownload}
              statsMap={statsMap}
              chartName={chartName}
              week={week}
              weekNumber={weekNumber}
              chartType={chartType}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Text size="sm" c="dimmed" mb="md">{t('charts.share.preview', 'Preview')}</Text>
            <Center style={{ border: '1px solid rgba(125,125,125,0.3)', width: '100%', height: '90vh', padding: '10px' }}>
              {selectedType === 'text' ? (
                <Textarea value={generatePlainTextChart(t, chartData, chartName, week, weekNumber, chartType, statsMap)} readOnly rows={22} styles={{input: {minWidth: '500px', fontFamily: 'monospace', fontSize: '12px'}}} />
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