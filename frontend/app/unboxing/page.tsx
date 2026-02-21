export default function UnboxingPage() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pb-20 transition-colors">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 pt-2 md:pt-6">
        <div className="flex flex-col gap-4 sm:gap-6 mb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 min-h-[38px]">
            <h1 className="flex items-baseline gap-4 text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
              開箱
              <span className="text-xs font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
                敬請期待
              </span>
            </h1>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center mb-4">
            <span className="text-3xl">📹</span>
          </div>
          <div className="text-[15px] font-black text-neutral-900 dark:text-white mb-1">
            開箱社群即將上線
          </div>
          <div className="text-[13px] text-neutral-500 dark:text-neutral-400 text-center max-w-xs">
            未來會在這裡看到玩家的開箱紀錄、心得分享與討論區，敬請期待。
          </div>
        </div>
      </div>
    </div>
  );
}

