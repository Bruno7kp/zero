import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Box, Button, Radio, Text, Stack, Grid, Center, Loader } from '@mantine/core';
import { IconDownload } from '@tabler/icons-react';
import html2canvas from 'html2canvas';
import { generateGridHTML } from './templates/gridTemplate';
import { generateStoriesHTML } from './templates/storiesTemplate';
import { generateCompletoHTML } from './templates/completoTemplate';
import { spotifyImagesDb } from '../../db/spotifyImagesDb';

interface ShareImageModalProps {
  t: (k: any, options?: any) => string;
  chartData: any[];
  chartName: string;
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
  week,
  weekNumber,
  chartType,
  opened,
  onClose,
}) => {
  const [selectedType, setSelectedType] = useState<'grid' | 'stories' | 'completo'>('stories');
  const [selectedGridSize, setSelectedGridSize] = useState<3 | 4 | 5>(3);
  const [selectedStoriesTop, setSelectedStoriesTop] = useState<5 | 10>(10);

  // Estados para a imagem de prévia e o carregamento
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentImageType, setCurrentImageType] = useState<string>('');

  // Função helper para gerar o tipo atual da imagem
  const getCurrentTypeKey = useCallback(() => {
    return `${selectedType}-${selectedType === 'grid' ? selectedGridSize : selectedType === 'stories' ? selectedStoriesTop : 'completo'}`;
  }, [selectedType, selectedGridSize, selectedStoriesTop]);

  // Função que gera a imagem em alta resolução em background
  const generatePreviewImage = useCallback(async () => {
    // Enriquecer data com imagens
    const enrichedData = await Promise.all(chartData.map(async (row) => {
      const cached = await spotifyImagesDb.images.get(row.entityId);
      const imageUrl = cached?.imageUrl || null;
      const albumImage = imageUrl; // para compatibilidade
      return { ...row, imageUrl, albumImage };
    }));

    const htmlForCanvas = selectedType === 'grid'
      ? generateGridHTML(enrichedData, selectedGridSize)
      : selectedType === 'stories'
      ? generateStoriesHTML(enrichedData, selectedStoriesTop, week, weekNumber, chartType)
      : generateCompletoHTML(enrichedData, chartName, week, weekNumber, chartType);
    
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.innerHTML = htmlForCanvas;
    document.body.appendChild(tempDiv);

    try {
      let options: any = { backgroundColor: '#ffffff', logging: false, allowTaint: true, useCORS: true };
      if (selectedType === 'stories' || selectedType === 'completo') {
        options = { ...options, width: 1080, height: 1920 };
      } else if (selectedType === 'grid') {
        const sizePx = selectedGridSize * 300;
        options = { ...options, width: sizePx, height: sizePx };
      }
      
      const canvas = await html2canvas(tempDiv.querySelector('.poster') as HTMLElement, options);
      setPreviewImageUrl(canvas.toDataURL('image/png'));
      setCurrentImageType(getCurrentTypeKey());
    } catch (error) {
      console.error('Error generating preview image:', error);
      setPreviewImageUrl(null);
    } finally {
      document.body.removeChild(tempDiv);
      setIsLoading(false);
    }
  }, [chartData, selectedType, selectedGridSize, selectedStoriesTop, week, weekNumber, chartType, chartName, getCurrentTypeKey]);

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
  }, [selectedType, selectedGridSize, selectedStoriesTop, chartData, opened, generatePreviewImage]);

  // O download agora é instantâneo
  const handleDownload = () => {
    if (!previewImageUrl) return;
    const link = document.createElement('a');
    const suffix = selectedType === 'grid' ? `_${selectedGridSize}x${selectedGridSize}` : selectedType === 'stories' ? `_${selectedStoriesTop}` : '';
    link.download = `${chartName}_${selectedType}${suffix}.png`;
    link.href = previewImageUrl;
    link.click();
  };

  return (
    <Modal opened={opened} onClose={onClose} title={t('charts.share.shareChartTitle', 'Compartilhar chart')} fullScreen centered>
      <Box>
        <Grid>
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Text size="sm" c="dimmed" mb="md">{t('charts.share.preview', 'Preview')}</Text>
            <Center style={{ border: '1px solid rgba(125,125,125,0.3)', width: '100%', height: '90vh', padding: '10px' }}>
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
            </Center>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Stack>
              <Text size="sm" fw={500}>{t('charts.share.selectType', 'Selecionar tipo')}</Text>
              <Radio.Group value={selectedType} onChange={(value) => setSelectedType(value as any)}>
                <Radio value="stories" label={t('charts.share.stories', 'Stories')} />
                <Radio value="grid" label={t('charts.share.grid', 'Grid')} />
                <Radio value="completo" label={t('charts.share.completo', 'Completo')} />
              </Radio.Group>
              
              {selectedType === 'grid' && (
                <div>
                  <Text size="sm" fw={500} mt="sm">{t('charts.share.gridSize', 'Grid Size')}</Text>
                  <Radio.Group value={selectedGridSize.toString()} onChange={(value) => setSelectedGridSize(parseInt(value) as 3 | 4 | 5)}>
                    <Radio value="3" label="3x3" disabled={chartData.length < 9} />
                    <Radio value="4" label="4x4" disabled={chartData.length < 16} />
                    <Radio value="5" label="5x5" disabled={chartData.length < 25} />
                  </Radio.Group>
                </div>
              )}
              
              {selectedType === 'stories' && (
                <div>
                  <Text size="sm" fw={500} mt="sm">{t('charts.share.storiesTop', 'Top Count')}</Text>
                  <Radio.Group value={selectedStoriesTop.toString()} onChange={(value) => setSelectedStoriesTop(parseInt(value) as 5 | 10)}>
                    <Radio value="5" label="Top 5" />
                    <Radio value="10" label="Top 10" disabled={chartData.length < 10} />
                  </Radio.Group>
                </div>
              )}
              
              <Button
                leftSection={<IconDownload size={16} />}
                onClick={handleDownload}
                mt="md"
                disabled={!previewImageUrl || isLoading}
              >
                {isLoading ? 'Gerando imagem...' : t('charts.share.download', 'Download')}
              </Button>
            </Stack>
          </Grid.Col>
        </Grid>
      </Box>
    </Modal>
  );
};

export default ShareImageModal;