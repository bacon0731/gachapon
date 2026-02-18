'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';

type ProductRow = Database['public']['Tables']['products']['Row'];

const normalizePrizeLevel = (level: string | null | undefined) => {
  if (!level) return '';
  const trimmed = level.trim();
  if (trimmed === 'Last One') return 'Last One';
  if (trimmed.endsWith('賞')) return trimmed.slice(0, -1);
  return trimmed;
};

const HIGH_TIER_LEVELS = ['SP', 'A', 'B', 'C'];

export default function FairnessVerifyPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [supabase] = useState(() => createClient());
  const [product, setProduct] = useState<ProductRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [positions, setPositions] = useState<number[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [majorPrizeCount, setMajorPrizeCount] = useState<number | undefined>(undefined);
  const [totalTickets, setTotalTickets] = useState<number | undefined>(undefined);
  const [stepsUsed, setStepsUsed] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [txidInput, setTxidInput] = useState('');
  const [prizeCountInput, setPrizeCountInput] = useState('');
  const [tagCountInput, setTagCountInput] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
        const productId = Number(rawId);
        if (!productId || Number.isNaN(productId)) {
          setError('找不到商品');
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single();

        if (error) throw error;
        setProduct(data);

        const majorLevelsRaw = (data.major_prizes as string[] | null) ?? [];
        const majorLevels = majorLevelsRaw.filter(Boolean);
        const normalizedMajorLevels = majorLevels.map((level) => normalizePrizeLevel(level));

        const { data: prizeRows, error: prizesError } = await supabase
          .from('product_prizes')
          .select('level,total')
          .eq('product_id', productId);

        if (prizesError) {
          console.error('載入獎項資料失敗', prizesError);
          const inferredMajorCount = majorLevels.length || undefined;
          const inferredTotalTickets = data.total_count || undefined;

          const paramPrizeCount = searchParams?.get('prizeCount');
          const paramTotalTickets = searchParams?.get('totalTickets');
          const paramTxid = searchParams?.get('txid');

          const finalMajorCount =
            paramPrizeCount && !Number.isNaN(Number(paramPrizeCount))
              ? Number(paramPrizeCount)
              : inferredMajorCount;
          const finalTotalTickets =
            paramTotalTickets && !Number.isNaN(Number(paramTotalTickets))
              ? Number(paramTotalTickets)
              : inferredTotalTickets;
          const finalTxid = paramTxid || data.seed || data.txid_hash || '';

          setMajorPrizeCount(finalMajorCount);
          setTotalTickets(finalTotalTickets);

          setTxidInput(finalTxid);
          setPrizeCountInput(finalMajorCount ? String(finalMajorCount) : '');
          setTagCountInput(finalTotalTickets ? String(finalTotalTickets) : '');
        } else {
          const totalFromPrizes =
            prizeRows?.reduce((sum, p) => sum + (p.total || 0), 0) ?? 0;

          const highTierFromPrizes =
            prizeRows
              ?.map((p) => normalizePrizeLevel(p.level))
              .filter((level) => HIGH_TIER_LEVELS.includes(level)) ?? [];

          const levelsForMajorCount = Array.from(
            new Set([
              ...normalizedMajorLevels.filter((level) => HIGH_TIER_LEVELS.includes(level)),
              ...highTierFromPrizes,
            ]),
          );

          const majorCount =
            prizeRows
              ?.filter((p) => levelsForMajorCount.includes(normalizePrizeLevel(p.level)))
              .reduce((sum, p) => sum + (p.total || 0), 0) ?? 0;

          const inferredMajorCount = majorCount || undefined;
          const inferredTotalTickets = data.total_count || totalFromPrizes || undefined;

          const paramPrizeCount = searchParams?.get('prizeCount');
          const paramTotalTickets = searchParams?.get('totalTickets');
          const paramTxid = searchParams?.get('txid');

          const finalMajorCount =
            paramPrizeCount && !Number.isNaN(Number(paramPrizeCount))
              ? Number(paramPrizeCount)
              : inferredMajorCount;
          const finalTotalTickets =
            paramTotalTickets && !Number.isNaN(Number(paramTotalTickets))
              ? Number(paramTotalTickets)
              : inferredTotalTickets;
          const finalTxid = paramTxid || data.seed || data.txid_hash || '';

          setMajorPrizeCount(finalMajorCount);
          setTotalTickets(finalTotalTickets);

          setTxidInput(finalTxid);
          setPrizeCountInput(finalMajorCount ? String(finalMajorCount) : '');
          setTagCountInput(finalTotalTickets ? String(finalTotalTickets) : '');
        }
      } catch (err) {
        console.error('載入商品失敗', err);
        setError('載入商品失敗，請稍後再試');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [params, supabase, searchParams]);

  const seed = product?.seed || '';

  const parsedPrizeCount = (() => {
    const value = prizeCountInput.trim();
    if (!value) return null;
    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0) return null;
    return Math.floor(num);
  })();

  const parsedTagCount = (() => {
    const value = tagCountInput.trim();
    if (!value) return null;
    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0) return null;
    return Math.floor(num);
  })();

  const canVerify = !!txidInput.trim() && /^[0-9a-fA-F]+$/.test(txidInput.trim()) && parsedPrizeCount !== null && parsedTagCount !== null;

  const handleVerify = () => {
    if (!product) return;

    try {
      const hex = txidInput.trim();
      const prizeCount = parsedPrizeCount;
      const tagCount = parsedTagCount;

      if (!hex || !/^[0-9a-fA-F]+$/.test(hex) || prizeCount === null || tagCount === null) {
        setError('請輸入正確的 TXID、大賞數量與總籤數');
        return;
      }

      setIsVerifying(true);
      setError(null);
      setPositions([]);
      setStepsUsed(null);
      setElapsedMs(null);
      const startTime =
        typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
      const txidInt = BigInt('0x' + hex);

      const indexes: number[] = [];
      const stepBase = 100n;
      let step = 1;
      const maxCount = 100;
      let lastStep = 0;

      while (step <= maxCount && indexes.length < prizeCount) {
        const powResult = stepBase ** BigInt(step);
        const div = txidInt / powResult;
        const mod = div % BigInt(tagCount);
        const index = Number(mod);

        if (!indexes.includes(index)) {
          indexes.push(index);
        }

        lastStep = step;
        step += 1;
      }

      const result = indexes.map((v) => v + 1).sort((a, b) => a - b);

      const endTime =
        typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();

      setPositions(result);
      setStepsUsed(lastStep || null);
      setElapsedMs(endTime - startTime);
    } catch (e) {
      console.error('驗證失敗', e);
      setError('驗證失敗，請稍後再試');
      setPositions([]);
      setStepsUsed(null);
      setElapsedMs(null);
    } finally {
      setIsVerifying(false);
    }
  };

  const phpTxid =
    txidInput.trim() || seed || product?.txid_hash || '在此填入平台提供的隨機種子';
  const phpPrizeCount =
    parsedPrizeCount !== null
      ? parsedPrizeCount
      : typeof majorPrizeCount === 'number'
        ? majorPrizeCount
        : 0;
  const phpTagCount =
    parsedTagCount !== null
      ? parsedTagCount
      : typeof totalTickets === 'number'
        ? totalTickets
        : 0;

  const phpCode = `<?php
// 請填入本平台提供的隨機種子（TXID）並填入在單引號內
$txid = '${phpTxid}';

// 總共幾個大賞
$prize_count = ${phpPrizeCount};

// 總共幾個籤數
$tag_count = ${phpTagCount};

$dec = gmp_init($txid, 16);

$prize_tmp = [];
$prize_tmp_count = 0;

$step_tmp = 100;
$step = 1;
$max_count = 100;

try {
    while ($step <= $max_count) {
        $powResult = gmp_pow($step_tmp, $step);
        $div = gmp_div_q($dec, $powResult);
        $mod = gmp_mod($div, $tag_count);
        $prize_number = (int)gmp_strval($mod) + 1;

        if (!in_array($prize_number, $prize_tmp)) {
            $prize_tmp[] = $prize_number;
            $prize_tmp_count++;
        }

        if ($prize_tmp_count >= $prize_count) {
            break;
        }

        $step++;
    }

    sort($prize_tmp);
    echo implode(', ', $prize_tmp);
} catch (\\Exception $e) {
    echo $e->getMessage();
}`;

  const handleCopyCode = async () => {
    try {
      if (typeof navigator === 'undefined' || !navigator.clipboard) return;
      await navigator.clipboard.writeText(phpCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('複製程式碼失敗', err);
    }
  };

  const handleOpen3v4l = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(phpCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
      if (typeof window !== 'undefined') {
        window.open('https://3v4l.org/', '_blank', 'noreferrer');
      }
    } catch (err) {
      console.error('開啟 3v4l 失敗', err);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="max-w-4xl mx-auto px-3 sm:px-6 py-6 sm:py-10">
        {isLoading && (
          <div className="min-h-[70vh] flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-neutral-500 dark:text-neutral-400">
              <div className="w-8 h-8 border-2 border-neutral-300 dark:border-neutral-700 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-black tracking-widest">載入公平性驗證中...</span>
            </div>
          </div>
        )}

        {error && !isLoading && (
          <div className="text-sm text-red-500">
            {error}
          </div>
        )}

        {product && !isLoading && !error && (
          <div className="space-y-5 sm:space-y-6">
              <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl p-3 sm:p-4 space-y-3 sm:space-y-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <Link
                    href={product ? `/shop/${product.id}` : '/'}
                    className="hidden sm:flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-200 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Link>
                  <div className="space-y-0.5">
                    <h1 className="text-lg sm:text-2xl font-black text-neutral-900 dark:text-neutral-50">
                      {product?.name || '公平性驗證'}
                    </h1>
                    <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                      請輸入抽獎相關參數進行公平性驗證，確保抽獎結果的透明度和公正性。
                    </p>
                  </div>
                </div>
                <div className="text-xs sm:text-sm font-black text-neutral-700 dark:text-neutral-200">
                  抽獎參數
                </div>
                <div className="space-y-3 sm:space-y-4">
                  <div className="space-y-1.5">
                    <div className="text-xs sm:text-sm font-black text-neutral-500 dark:text-neutral-400">
                      TXID
                    </div>
                    <input
                      value={txidInput}
                      onChange={(e) => setTxidInput(e.target.value)}
                      placeholder="完抽後才會公開 TXID"
                      className="block w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-[13px] sm:text-sm font-mono text-neutral-800 dark:text-neutral-200 break-all outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary"
                      autoComplete="off"
                      spellCheck={false}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <div className="text-xs sm:text-sm font-black text-neutral-500 dark:text-neutral-400">
                        大賞數量
                      </div>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={prizeCountInput}
                        onChange={(e) => setPrizeCountInput(e.target.value)}
                        placeholder={majorPrizeCount !== undefined ? String(majorPrizeCount) : '請輸入大賞數量'}
                        className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 text-sm font-black text-neutral-900 dark:text-neutral-50 outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="text-xs sm:text-sm font-black text-neutral-500 dark:text-neutral-400">
                        總籤數
                      </div>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={tagCountInput}
                        onChange={(e) => setTagCountInput(e.target.value)}
                        placeholder={totalTickets !== undefined ? String(totalTickets) : '請輸入總籤數'}
                        className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 text-sm font-black text-neutral-900 dark:text-neutral-50 outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary"
                      />
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={!canVerify || isVerifying}
                  className="w-full mt-1 inline-flex items-center justify-center rounded-xl bg-primary text-white text-sm sm:text-base font-black py-2.5 sm:py-3 disabled:opacity-60 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
                >
                  {isVerifying ? '驗證中...' : '開始驗證'}
                </button>
                {!canVerify && (
                  <p className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400">
                    需待本商品完抽且平台公開 TXID、TXID Hash、大賞數量及總籤數後，方可進行驗證。
                  </p>
                )}
              </div>

              {positions.length > 0 && (
                <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl p-3 sm:p-4 space-y-3 sm:space-y-4">
                  <div className="text-xs sm:text-sm font-black text-neutral-500 dark:text-neutral-400">
                    驗證結果
                  </div>
                  <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300">
                    計算出的大賞位置：
                  </p>
                  <div className="bg-neutral-50 dark:bg-neutral-900/40 rounded-xl p-3 sm:p-4 text-xs sm:text-sm text-neutral-800 dark:text-neutral-100 font-mono leading-relaxed break-words">
                    {positions.join(', ')}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <div className="text-xs sm:text-sm font-black text-neutral-500 dark:text-neutral-400">
                        使用的步數
                      </div>
                      <div className="inline-flex items-center px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-100 dark:border-neutral-800 text-xs sm:text-sm font-mono text-neutral-800 dark:text-neutral-100">
                        {stepsUsed !== null ? stepsUsed : '—'}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs sm:text-sm font-black text-neutral-500 dark:text-neutral-400">
                        計算時間
                      </div>
                      <div className="inline-flex items-center px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-100 dark:border-neutral-800 text-xs sm:text-sm font-mono text-neutral-800 dark:text-neutral-100">
                        {elapsedMs !== null ? `${Math.max(elapsedMs, 0.01).toFixed(2)} ms` : '—'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 sm:p-4 space-y-2.5 sm:space-y-3">
                <div className="text-xs sm:text-sm font-black text-neutral-500 dark:text-neutral-400">
                  驗證程式碼
                </div>
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300">
                  以下是用於驗證大賞位置的完整程式碼，您可以複製到任何 PHP 環境中執行以驗證結果：
                </p>
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs sm:text-sm font-black text-neutral-500 dark:text-neutral-400">
                    PHP 驗證程式碼
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-neutral-900 text-white text-[11px] sm:text-xs font-black hover:bg-neutral-800 transition-colors"
                  >
                    {copied ? '已複製' : '複製程式碼'}
                  </button>
                </div>
                <pre className="bg-neutral-900 text-neutral-50 rounded-xl p-3 sm:p-4 text-[11px] sm:text-xs overflow-x-auto">
<code>{phpCode}</code>
                </pre>
              </div>

              <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl p-3 sm:p-4 space-y-3 sm:space-y-4">
                <div className="text-xs sm:text-sm font-black text-neutral-500 dark:text-neutral-400">
                  第三方驗證
                </div>
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300">
                  您也可以使用以下第三方平台來驗證程式碼的執行結果：
                </p>
                <button
                  type="button"
                  onClick={handleOpen3v4l}
                  className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-primary text-white text-xs sm:text-sm font-black hover:bg-primary/90 transition-colors"
                >
                  前往 3v4l.org 驗證
                </button>
              </div>
          </div>
        )}
      </div>
    </div>
  );
}
