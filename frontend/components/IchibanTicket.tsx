'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface IchibanTicketProps {
  grade: string;
  prizeName: string;
  isOpened?: boolean;
  isLastOne?: boolean;
  onOpen?: () => void;
  className?: string;
}

export const IchibanTicket: React.FC<IchibanTicketProps> = ({
  grade,
  prizeName,
  isOpened: externalIsOpened,
  isLastOne = false,
  onOpen,
  className,
}) => {
  const [internalIsOpened, setInternalIsOpened] = useState(false);
  const isOpened = externalIsOpened !== undefined ? externalIsOpened : internalIsOpened;

  const handleOpen = () => {
    if (!isOpened) {
      setInternalIsOpened(true);
      onOpen?.();
    }
  };

  return (
    <div 
      className={cn(
        "relative w-full max-w-[320px] aspect-[2/1] group select-none perspective-1000",
        !isOpened && "cursor-pointer",
        className
      )}
    >
      {/* Shadow layer for depth */}
      <div className="absolute inset-0 bg-black/10 rounded-3xl blur-md translate-y-1 group-hover:translate-y-2 transition-transform" />

      {/* Main Ticket Base */}
      <div className={cn(
        "absolute inset-0 rounded-3xl border-2 overflow-hidden shadow-xl transition-colors duration-300",
        isLastOne ? "bg-neutral-900 border-yellow-500" : "bg-[#2D3648] border-[#3E4A61]"
      )}>
        {/* Glossy overlay on base */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
        
        {/* Top/Bottom thick borders */}
        <div className="absolute top-0 left-0 right-0 h-2.5 bg-black/20" />
        <div className="absolute bottom-0 left-0 right-0 h-2.5 bg-black/20" />

        {/* Fixed branding on the base */}
        <div className="absolute inset-y-0 left-0 w-[15%] flex items-center justify-center border-r border-white/5 bg-black/10 pt-2.5 pb-2.5">
          <div className={cn(
            "rotate-180 [writing-mode:vertical-lr] text-[8px] font-black uppercase tracking-[0.4em]",
            isLastOne ? "text-yellow-500/50" : "text-white/20"
          )}>
            {isLastOne ? "LAST ONE" : "Original"}
          </div>
        </div>
        <div className="absolute inset-y-0 right-0 w-[15%] flex items-center justify-center border-l border-white/5 bg-black/10 pt-2.5 pb-2.5">
          <div className={cn(
            "[writing-mode:vertical-lr] text-[8px] font-black uppercase tracking-[0.4em]",
            isLastOne ? "text-yellow-500/50" : "text-white/20"
          )}>
            {isLastOne ? "SPECIAL" : "Authentic"}
          </div>
        </div>

        {/* The Result Layer (Revealed Area) - Positioned in the middle 70% */}
        <div className="absolute inset-y-0 left-[10%] right-[10%] mt-2.5 mb-2.5 flex items-center justify-center">
          {/* The Styled Ticket Shape */}
          <div className={cn(
            "relative w-full h-full rounded-3xl shadow-inner overflow-hidden flex flex-col items-center justify-center border transition-colors duration-300",
            isLastOne ? "bg-gradient-to-br from-yellow-300 to-yellow-500 border-yellow-200" : "bg-[#F3F4F6] border-white/50"
          )}>
            {/* Dashed border inside */}
            <div className="absolute inset-1.5 border-2 border-dashed border-black/5 rounded-2xl pointer-events-none" />
            
            {/* The "Tab" on the left */}
            <div className={cn(
              "absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full border-r shadow-[-4px_0_10px_rgba(0,0,0,0.05)]",
              isLastOne ? "bg-yellow-400 border-yellow-200" : "bg-[#EAECEF] border-white/50"
            )} />

            <motion.div
              initial={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
              animate={isOpened ? { opacity: 1, scale: 1, filter: 'blur(0px)' } : {}}
              transition={{ delay: 0.3, duration: 0.6, type: 'spring' }}
              className="flex flex-col items-center justify-center w-full z-10"
            >
              <div className="flex items-baseline gap-0.5 sm:gap-1 text-center justify-center">
                <span className={cn(
                  "text-4xl sm:text-5xl font-black tracking-tighter leading-none font-amount",
                  isLastOne ? "text-neutral-900 drop-shadow-sm" : "text-neutral-900"
                )}>
                  {(() => {
                    if (isLastOne) return "LAST";
                    const val = grade.replace('賞', '');
                    const num = parseInt(val);
                    return isNaN(num) ? val : num.toLocaleString();
                  })()}
                </span>
                <span className={cn(
                  "text-sm sm:text-lg font-black",
                  isLastOne ? "text-neutral-800" : "text-neutral-900"
                )}>
                  {isLastOne ? "ONE" : "賞"}
                </span>
              </div>
              <div className="text-[10px] sm:text-xs font-black text-neutral-800 text-center line-clamp-2 px-2 w-full mt-1 leading-tight">
                {prizeName}
              </div>
            </motion.div>
          </div>
        </div>

        {/* The Tearable Cover Layer */}
        <AnimatePresence>
          {!isOpened && (
            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: 300 }}
              dragElastic={0.1}
              onDragEnd={(_, info) => {
                if (info.offset.x > 100 || info.velocity.x > 500) {
                  handleOpen();
                }
              }}
              onClick={handleOpen}
              exit={{ 
                rotateY: -110,
                x: '110%',
                z: 400,
                opacity: 0,
                transition: { 
                  duration: 1, 
                  ease: [0.4, 0, 0.2, 1],
                }
              }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              style={{ 
                originX: 1,
                originY: 0.5,
                perspective: 2000,
                transformStyle: 'preserve-3d',
                zIndex: 50
              }}
              className="absolute inset-0 touch-none cursor-grab active:cursor-grabbing"
            >
              <div className="absolute inset-0 backface-hidden">
                <svg width="100%" height="100%" viewBox="0 0 309 157" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                  {/* Main Cover Body with Cutout */}
                  <path d="M287 1C298.598 1 308 10.402 308 22V135C308 146.598 298.598 156 287 156H68L20 110V106.229C8.91114 102.155 1 91.5017 1 79C1 66.4982 8.91097 55.8442 20 51.7705V22C20 10.402 29.402 1 41 1H287Z" fill="url(#paint0_linear_6_186)"/>
                  
                  {/* Pattern/Texture Path with correct fill */}
                  <path d="M74.5576 148H68.4238V147H74.5576V148ZM86.8252 148H80.6914V147H86.8252V148ZM99.0938 148H92.96V147H99.0938V148ZM111.362 148H105.228V147H111.362V148ZM123.63 148H117.496V147H123.63V148ZM135.898 148H129.765V147H135.898V148ZM148.166 148H142.032V147H148.166V148ZM160.435 148H154.301V147H160.435V148ZM172.703 148H166.568V147H172.703V148ZM184.971 148H178.837V147H184.971V148ZM197.239 148H191.105V147H197.239V148ZM209.507 148H203.373V147H209.507V148ZM221.775 148H215.642V147H221.775V148ZM234.044 148H227.909V147H234.044V148ZM246.312 148H240.178V147H246.312V148ZM258.58 148H252.446V147H258.58V148ZM270.848 148H264.714V147H270.848V148ZM283.65 146.677L283.74 147.169H283.739L283.829 147.661C282.604 147.884 281.34 148 280.049 148H276.982V147H280.049C281.28 147 282.484 146.887 283.649 146.675L283.65 146.677ZM62.2891 148H59.6523L58.6084 147H62.2891V148ZM295.667 139.237L296.476 139.827C294.989 141.867 293.091 143.613 290.899 144.962L290.637 144.535V144.536L290.375 144.11L290.374 144.109C292.458 142.828 294.257 141.169 295.666 139.236L295.667 139.237ZM300 129.092C300 130.394 299.861 131.666 299.596 132.896L298.618 132.685C298.837 131.67 298.965 130.623 298.994 129.554L299 129.092V125.93H300V129.092ZM300 119.605H299V113.281H300V119.605ZM28.0029 117.669L27.0029 116.711V113.281H28.0029V117.669ZM27.0029 102.352C27.3333 102.472 27.6663 102.587 28.0029 102.695V106.958H27.0029V102.352ZM300 106.958H299V100.634H300V106.958ZM20.665 99.0439C22.4821 100.327 24.4797 101.394 26.6143 102.207V102.21L26.2588 103.144C24.0458 102.3 21.9744 101.193 20.0889 99.8613L20.665 99.0449V99.0439ZM12.1191 88.7812C13.0478 90.8374 14.2587 92.7521 15.7061 94.4824V94.4834L14.9385 95.125C13.4343 93.3268 12.1741 91.3345 11.207 89.1934L12.1182 88.7822L12.1191 88.7812ZM300 94.3096H299V87.9863H300V94.3096ZM10.2373 75.5791H10.2383C10.0817 76.6808 10 77.8051 10 78.9473C10 80.0893 10.0818 81.2139 10.2383 82.3154L10.2373 82.3164L9.24707 82.457C9.0839 81.3088 9 80.1368 9 78.9473C9.00002 77.7579 9.08393 76.5865 9.24707 75.4385L10.2373 75.5791ZM300 81.6621H299V75.3379H300V81.6621ZM15.7061 63.4121C14.2587 65.1423 13.0478 67.0573 12.1191 69.1133H12.1182L11.6631 68.9082V68.9072L11.207 68.7021C12.1741 66.561 13.4343 64.5687 14.9385 62.7705L15.7061 63.4121ZM300 69.0137H299V62.6904H300V69.0137ZM26.6143 55.6855V55.6875C24.4797 56.501 22.4821 57.5675 20.665 58.8506L20.0889 58.0342C21.9744 56.7027 24.0458 55.5943 26.2588 54.751L26.6143 55.6855ZM300 56.3662H299V50.042H300V56.3662ZM28.0029 55.1992C27.6663 55.3071 27.3333 55.4228 27.0029 55.543V50.042H28.0029V55.1992ZM28.0029 43.7188H27.0029V37.3945H28.0029V43.7188ZM300 43.7188H299V37.3945H300V43.7188ZM28.3848 24.3154C28.1346 25.4761 28.003 26.6777 28.0029 27.9082V31.0703H27.0029V27.9082C27.003 26.6063 27.1423 25.3339 27.4072 24.1045L28.3848 24.3154ZM299.596 24.1045C299.861 25.3339 300 26.6063 300 27.9082V31.0703H299V27.9082C299 26.6773 298.868 25.4755 298.618 24.3145L299.596 24.1045ZM36.6279 12.8896V12.8906C34.545 14.1723 32.7455 15.8302 31.3369 17.7627H31.3359L30.5283 17.1729C32.0153 15.1329 33.9128 13.3865 36.1045 12.0381L36.6279 12.8896ZM290.899 12.0381C293.091 13.3865 294.989 15.1328 296.476 17.1729L295.667 17.7627H295.666C294.257 15.8298 292.458 14.1714 290.374 12.8896H290.375L290.899 12.0381ZM50.0215 10H46.9541L46.4648 10.0059C45.4033 10.0313 44.3637 10.1404 43.3525 10.3242V10.3232L43.1738 9.33887C44.3986 9.11621 45.6625 9 46.9541 9H50.0215V10ZM280.049 9C281.34 9 282.604 9.11624 283.829 9.33887L283.739 9.83105L283.65 10.3232L283.649 10.3242C282.484 10.1123 281.28 10 280.049 10H276.982V9H280.049ZM62.2891 10H56.1553V9H62.2891V10ZM74.5576 10H68.4238V9H74.5576V10ZM86.8252 10H80.6914V9H86.8252V10ZM99.0938 10H92.96V9H99.0938V10ZM111.362 10H105.228V9H111.362V10ZM123.63 10H117.496V9H123.63V10ZM135.898 10H129.765V9H135.898V10ZM148.166 10H142.032V9H148.166V10ZM160.435 10H154.301V9H160.435V10ZM172.703 10H166.568V9H172.703V10ZM184.971 10H178.837V9H184.971V10ZM197.239 10H191.105V9H197.239V10ZM209.507 10H203.373V9H209.507V10ZM221.775 10H215.642V9H221.775V10ZM234.044 10H227.909V9H234.044V10ZM246.312 10H240.178V9H246.312V10ZM258.58 10H252.445V9H258.58V10ZM270.848 10H264.714V9H270.848V10Z" fill="white" fillOpacity={0.17}/>
                  
                  {/* Bottom-left corner element from test2.svg */}
                  <path d="M68.5 156.5L19.5 109.5C26.4775 114.484 40.027 113.905 50.9848 112.357C58.1255 111.348 64.5608 117.467 64.0562 124.661C62.9921 139.831 64.8363 152.331 68.5 156.5Z" fill="url(#paint1_linear_6_186)"/>

                  <defs>
                    <linearGradient id="paint0_linear_6_186" x1="2" y1="78.5" x2="307" y2="78.5" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#303849"/>
                      <stop offset="1" stopColor="#3D4759"/>
                    </linearGradient>
                    <linearGradient id="paint1_linear_6_186" x1="40" y1="128.5" x2="55" y2="113" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#8E8E8E"/>
                      <stop offset="0.124427" stopColor="#C5C5C5"/>
                      <stop offset="0.306396" stopColor="#FDFDFD"/>
                      <stop offset="1" stopColor="#FDFDFD"/>
                    </linearGradient>
                  </defs>
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div className="text-white/30 font-black text-[10px] tracking-[0.4em] uppercase">
                    Ichiban Kuji
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                    <span className="text-[9px] text-white/40 font-bold uppercase tracking-[0.2em]">Peel to Reveal</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Jagged Edge Mask */}
        {isOpened && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-y-0 left-[10%] w-6 pointer-events-none z-40 overflow-hidden mt-2.5 mb-2.5"
          >
            <div 
              className="absolute inset-0 bg-[#2D3648] opacity-80"
              style={{
                clipPath: 'polygon(0% 0%, 100% 0%, 40% 5%, 100% 10%, 40% 15%, 100% 20%, 40% 25%, 100% 30%, 40% 35%, 100% 40%, 40% 45%, 100% 50%, 40% 55%, 100% 60%, 40% 65%, 100% 70%, 40% 75%, 100% 80%, 40% 85%, 100% 90%, 40% 95%, 100% 100%, 0% 100%)'
              }}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
};
