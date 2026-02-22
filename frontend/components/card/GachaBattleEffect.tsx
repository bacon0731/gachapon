import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

type Rarity = 'SSR' | 'SR' | 'R' | 'N';

export interface CardItem {
  id: string;
  rarity: Rarity;
  cardFrontImage: string;
}

interface GachaBattleEffectProps {
  isOpen: boolean;
  pullResults: CardItem[];
  onComplete?: () => void;
}

type Phase = 'intro' | 'qte' | 'outcome' | 'cards';

function getCardBackImage(rarity: Rarity) {
  if (rarity === 'SSR') return '/images/card/cardback1.png';
  if (rarity === 'SR') return '/images/card/cardback2.png';
  if (rarity === 'R') return '/images/card/cardback3.png';
  return '/images/card/cardback4.png';
}

export function GachaBattleEffect({ isOpen, pullResults, onComplete }: GachaBattleEffectProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [clickCount, setClickCount] = useState(0);
  const [timerStarted, setTimerStarted] = useState(false);
  const [revealedIds, setRevealedIds] = useState<string[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const hasSSR = useMemo(
    () => pullResults.some(card => card.rarity === 'SSR'),
    [pullResults]
  );

  useEffect(() => {
    if (!isOpen) {
      setPhase('intro');
      setClickCount(0);
      setTimerStarted(false);
      setRevealedIds([]);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    setPhase('intro');
    setClickCount(0);
    setTimerStarted(false);
    setRevealedIds([]);
  }, [isOpen, pullResults]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  const handleFirstPress = () => {
    if (!timerStarted) {
      setTimerStarted(true);
      timerRef.current = setTimeout(() => {
        setPhase('outcome');
      }, 4000);
    }
  };

  const handleTapQTE = () => {
    handleFirstPress();
    setClickCount(prev => prev + 1);
  };

  const handleRevealCard = (id: string) => {
    if (revealedIds.includes(id)) return;
    setRevealedIds(prev => [...prev, id]);
  };

  const handleRevealAll = () => {
    setRevealedIds(pullResults.map(card => card.id));
  };

  const allRevealed =
    pullResults.length > 0 && revealedIds.length >= pullResults.length;

  const intensity = Math.min(1.2, 0.3 + clickCount * 0.03);

  return (
    <div className="fixed inset-0 z-[1400] flex items-center justify-center">
      <div className="absolute inset-0 bg-black" />

      <AnimatePresence mode="wait">
        {phase === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 w-full h-full flex items-center justify-center bg-black"
          >
            <video
              key="video1"
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              onEnded={() => setPhase('qte')}
              src="/videos/video1_clash.mp4"
            />
          </motion.div>
        )}

        {phase === 'qte' && (
          <motion.div
            key="qte"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 w-full h-full flex items-center justify-center overflow-hidden bg-gradient-to-b from-black via-neutral-900 to-black"
          >
            <motion.div
              className="absolute inset-0"
              animate={{
                x: [-4 * intensity, 4 * intensity, -3 * intensity, 3 * intensity, 0],
                y: [-2 * intensity, 2 * intensity, -1 * intensity, 1 * intensity, 0],
              }}
              transition={{
                duration: timerStarted ? 0.25 : 0.4,
                repeat: timerStarted ? Infinity : 0,
                repeatType: 'mirror',
              }}
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 0%, rgba(248,250,252,0.15), transparent 55%), radial-gradient(circle at 80% 100%, rgba(248,250,252,0.12), transparent 55%)",
              }}
            />

            <div className="relative z-10 flex flex-col items-center gap-6">
              <div className="text-center">
                <div className="text-xs md:text-sm font-black tracking-[0.3em] uppercase text-white/60 mb-2">
                  power clash
                </div>
                <div className="text-2xl md:text-3xl font-black text-white tracking-widest">
                  連打決勝負！
                </div>
                {timerStarted && (
                  <div className="mt-1 text-[11px] md:text-xs font-bold text-white/70">
                    時間到自動判定，請瘋狂連打！
                  </div>
                )}
              </div>

              <motion.button
                type="button"
                onClick={handleTapQTE}
                whileTap={{ scale: 0.9 }}
                className={cn(
                  'relative rounded-full px-10 md:px-14 py-4 md:py-5 text-xl md:text-2xl font-black tracking-[0.3em] uppercase',
                  'bg-gradient-to-b from-red-500 to-red-700 text-white shadow-[0_0_40px_rgba(248,113,113,0.9)]',
                  'border border-red-300/80'
                )}
              >
                <span className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                  PUSH!
                </span>
                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] md:text-xs font-bold text-white/80">
                  用力連打！
                </span>

                {clickCount > 0 && (
                  <motion.div
                    key={clickCount}
                    initial={{ opacity: 0, y: 12, scale: 0.8 }}
                    animate={{ opacity: 1, y: -18, scale: 1.1 }}
                    exit={{ opacity: 0, y: -32, scale: 0.8 }}
                    className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs md:text-sm font-black text-yellow-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)]"
                  >
                    COMBO {clickCount}
                  </motion.div>
                )}
              </motion.button>
            </div>
          </motion.div>
        )}

        {phase === 'outcome' && (
          <motion.div
            key="outcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 w-full h-full flex items-center justify-center bg-black"
          >
            <video
              key={hasSSR ? 'video2_win' : 'video2_lose'}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              onEnded={() => setPhase('cards')}
              src={
                hasSSR
                  ? '/videos/video2_win.mp4'
                  : '/videos/video2_lose.mp4'
              }
            />
          </motion.div>
        )}

        {phase === 'cards' && (
          <motion.div
            key="cards"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 w-full h-full flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 -z-10">
              <Image
                src="/images/gacha_bg.png"
                alt=""
                fill
                className="object-cover filter brightness-[0.9] blur-[4px] scale-105"
                unoptimized
              />
              <div className="absolute inset-0 bg-black/70" />
            </div>

            <div className="w-full max-w-[420px] mx-auto h-full flex flex-col items-center justify-center">
              <div className="flex flex-col items-center gap-1 mb-4">
                <p className="text-xs font-black text-neutral-300 tracking-[0.3em] uppercase">
                  battle result
                </p>
                <p className="text-base font-black text-white">
                  共抽到 {pullResults.length} 張卡牌
                </p>
              </div>

              <div
                className={cn(
                  'grid gap-2 w-full',
                  pullResults.length <= 2 ? 'grid-cols-2' : 'grid-cols-3'
                )}
              >
                {pullResults.map(card => {
                  const isRevealed = revealedIds.includes(card.id);

                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => handleRevealCard(card.id)}
                      className="relative aspect-[650/930] rounded-xl bg-transparent focus:outline-none"
                    >
                      <div className="w-full h-full rounded-xl perspective-[1200px]">
                        <motion.div
                          className="relative w-full h-full rounded-xl shadow-[0_18px_40px_rgba(0,0,0,0.9)] bg-black"
                          style={{
                            transformStyle: 'preserve-3d',
                          }}
                          initial={{ rotateY: 0 }}
                          animate={{ rotateY: isRevealed ? 180 : 0 }}
                          transition={{ duration: 0.55, ease: 'easeInOut' }}
                        >
                          <div
                            className="absolute inset-0 rounded-xl overflow-hidden"
                            style={{ backfaceVisibility: 'hidden' }}
                          >
                            <Image
                              src={getCardBackImage(card.rarity)}
                              alt="card back"
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>

                          <div
                            className="absolute inset-0 rounded-xl overflow-hidden"
                            style={{
                              backfaceVisibility: 'hidden',
                              transform: 'rotateY(180deg)',
                            }}
                          >
                            <Image
                              src={card.cardFrontImage}
                              alt=""
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        </motion.div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 w-full flex flex-col gap-2 items-center">
                {!allRevealed && (
                  <button
                    type="button"
                    onClick={handleRevealAll}
                    className="text-primary font-black underline underline-offset-2 text-xs"
                  >
                    全部翻開
                  </button>
                )}

                <Button
                  size="lg"
                  className="w-full md:w-[320px] h-[44px] md:h-[52px] rounded-xl text-base md:text-lg font-black bg-[#3B82F6] hover:bg-[#2563EB] text-white shadow-xl shadow-blue-500/20"
                  onClick={onComplete}
                >
                  完成
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

