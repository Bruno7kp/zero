import { useEffect, useRef, useState } from 'react';

interface ProgressiveRevealOptions {
  initial?: number; // Quantidade inicial mostrada (pode ser recalculada se muito grande ou pequena)
  step?: number; // Quantidade adicionada a cada iteração (base)
  intervalMs?: number; // Intervalo entre batches
  adaptive?: boolean; // Ajuste dinâmico de step
  maxStep?: number; // Limite superior de step
  minStep?: number; // Limite inferior de step
  disableBelow?: number; // Se total <= disableBelow, desativa progressive e mostra tudo
  targetDurationMs?: number; // Tenta completar dentro desse tempo aproximado
}

/**
 * useProgressiveReveal
 * Mostra itens em partes para melhorar percepção de velocidade.
 * Não altera a lista original; apenas devolve um slice progressivo.
 */
export function useProgressiveReveal<T>(items: T[], opts: ProgressiveRevealOptions = {}) {
  const {
    initial = 25,
    step: baseStep = 25,
    intervalMs = 24,
    adaptive = true,
    maxStep = 160,
    minStep = 5,
    disableBelow = 200,
    targetDurationMs = 300,
  } = opts;

  const [visible, setVisible] = useState(initial);
  const stepRef = useRef(baseStep);
  const rafRef = useRef<number | null>(null);
  const cancelledRef = useRef(false);
  const prevItemsRef = useRef<T[]>(items);

  // Reset quando a lista muda de identidade (nova semana / tipo)
  useEffect(() => {
    cancelledRef.current = true; // cancela ciclo anterior
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    // Se a nova lista estiver vazia, mantemos o estado anterior (evita piscar) até algo aparecer
    if (items.length === 0) return;
    prevItemsRef.current = items;
    cancelledRef.current = false;

    // Se total é pequeno, mostra tudo de uma vez
    if (items.length <= disableBelow) {
      setVisible(items.length);
      return; // Sem progressive
    }

    // Ajusta initial dinamicamente: para listas muito grandes, começa com ~30% cap limitado
    let dynamicInitial = initial;
    if (initial < 1) dynamicInitial = 1; // sanity
    if (items.length > 800 && initial < 150)
      dynamicInitial = Math.min(150, Math.max(initial, Math.round(items.length * 0.18)));
    else if (items.length > 500 && initial < 120)
      dynamicInitial = Math.min(120, Math.max(initial, Math.round(items.length * 0.22)));
    else if (items.length > 300 && initial < 100)
      dynamicInitial = Math.min(100, Math.max(initial, Math.round(items.length * 0.28)));

    setVisible(Math.min(dynamicInitial, items.length));

    // Calcula step objetivo para tentar finalizar próximo do targetDurationMs
    const remaining = items.length - dynamicInitial;
    let dynamicStep = baseStep;
    if (remaining > 0) {
      const approxBatches = Math.max(1, Math.round(targetDurationMs / intervalMs));
      const computed = Math.ceil(remaining / approxBatches);
      dynamicStep = Math.min(maxStep, Math.max(minStep, Math.max(baseStep, computed)));
    }
    stepRef.current = dynamicStep;

    if (items.length <= dynamicInitial) return; // nada a revelar

    const run = () => {
      if (cancelledRef.current) return;
      const t0 = performance.now();
      setVisible(v => {
        const next = Math.min(items.length, v + stepRef.current);
        return next;
      });
      const duration = performance.now() - t0;
      if (adaptive) {
        if (duration < 6 && stepRef.current < maxStep) {
          stepRef.current = Math.min(maxStep, Math.round(stepRef.current * 1.25));
        } else if (duration > 12 && stepRef.current > minStep) {
          stepRef.current = Math.max(minStep, Math.round(stepRef.current * 0.8));
        }
      }
      if (!cancelledRef.current) {
        // Usa setTimeout para liberar a UI entre batches
        setTimeout(() => {
          if (visible + stepRef.current >= items.length) {
            // Último batch será aplicado, deixa finalizar
            rafRef.current = requestAnimationFrame(run);
          } else {
            rafRef.current = requestAnimationFrame(run);
          }
        }, intervalMs);
      }
    };

    rafRef.current = requestAnimationFrame(run);
    return () => {
      cancelledRef.current = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  // Se itens atual ficou vazio, devolve a versão anterior para evitar flicker abrupto
  const base = items.length === 0 ? prevItemsRef.current : items;
  const slice = base.slice(0, Math.min(visible, base.length));
  const done = slice.length >= base.length;

  return { items: slice, done, total: base.length, visible: slice.length };
}
