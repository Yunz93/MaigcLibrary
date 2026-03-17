import React from 'react';
import { motion } from 'motion/react';

export type Book = {
  id: string;
  title: string;
  author: string;
  coverColor: string;
  description: string;
  icon: string;
  isComingSoon?: boolean;
};

const BOOKS: Book[] = [
  {
    id: 'dot-game',
    title: '点点点',
    author: 'Herve Tullet',
    coverColor: '#FFD13B',
    description: '一个充满魔力的互动绘本，带你进入色彩的世界。',
    icon: '🟡',
  },
  {
    id: 'coming-soon-1',
    title: '肚子里有个火车站',
    author: 'Anna Russelmann',
    coverColor: '#E93D44',
    description: '了解我们的身体是如何消化食物的。',
    icon: '🚂',
    isComingSoon: true,
  },
  {
    id: 'coming-soon-2',
    title: '好饿的毛毛虫',
    author: 'Eric Carle',
    coverColor: '#00A859',
    description: '一只毛毛虫的蜕变之旅。',
    icon: '🐛',
    isComingSoon: true,
  }
];

interface LibraryProps {
  onSelectBook: (bookId: string) => void;
}

export default function Library({ onSelectBook }: LibraryProps) {
  return (
    <div className="min-h-screen bg-[#FDFCF8] text-[#4A4A40] font-serif overflow-x-hidden">
      {/* Background Decoration */}
      <div className="fixed inset-0 pointer-events-none opacity-20" style={{ 
        backgroundImage: 'radial-gradient(#5A5A40 1px, transparent 1px)', 
        backgroundSize: '40px 40px' 
      }} />

      <header className="max-w-6xl mx-auto pt-16 pb-24 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-block mb-4"
        >
          <span className="text-6xl">📚</span>
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-7xl font-bold mb-4 text-[#2A2A20] tracking-tight"
        >
          魔法绘本馆
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-xl md:text-2xl italic opacity-70 font-light"
        >
          点开一本书，开启一段奇妙冒险
        </motion.p>
      </header>

      <main className="max-w-5xl mx-auto px-6 relative z-10">
        {/* Shelf 1 */}
        <div className="relative mb-32">
          <div className="flex flex-wrap justify-center items-end gap-8 md:gap-16 mb-[-4px] px-4">
            {BOOKS.map((book, index) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15, type: 'spring', stiffness: 100 }}
                whileHover={book.isComingSoon ? {} : { 
                  scale: 1.05, 
                  rotateY: -15,
                  z: 50,
                  transition: { duration: 0.3 }
                }}
                className={`relative w-48 md:w-56 perspective-1000 ${book.isComingSoon ? 'cursor-not-allowed grayscale-[0.4]' : 'cursor-pointer'}`}
                onClick={() => !book.isComingSoon && onSelectBook(book.id)}
              >
                {/* Book Shadow on Shelf */}
                <div className="absolute -bottom-2 left-4 right-4 h-4 bg-black/20 blur-md rounded-full transform scale-x-110" />
                
                <div 
                  className="aspect-[3/4] rounded-r-xl shadow-2xl overflow-hidden relative flex flex-col items-center justify-center p-6 transition-all duration-500 transform-style-3d border-l-4 border-black/20"
                  style={{ backgroundColor: book.coverColor }}
                >
                  {/* Spine Highlight */}
                  <div className="absolute left-0 top-0 w-full h-full bg-gradient-to-r from-black/20 via-transparent to-white/10 pointer-events-none" />
                  
                  <div className="text-7xl mb-4 drop-shadow-lg">
                    {book.icon}
                  </div>
                  
                  <h2 className="text-2xl md:text-3xl font-bold text-center mb-1 text-white drop-shadow-md leading-tight">
                    {book.title}
                  </h2>
                  <p className="text-white/70 text-xs italic mb-4 font-light">
                    {book.author}
                  </p>
                  
                  {book.isComingSoon && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-[1px]">
                      <span className="bg-white/90 text-black px-3 py-1.5 rounded-full font-bold text-[10px] tracking-widest uppercase shadow-lg">
                        COMING SOON
                      </span>
                    </div>
                  )}
                </div>

                {/* Book Info Tooltip-like (Visible on Hover) */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  whileHover={{ opacity: 1, y: 0 }}
                  className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-xl border border-[#5A5A40]/10 pointer-events-none hidden md:block"
                >
                  <p className="text-xs leading-relaxed text-[#4A4A40]">
                    {book.description}
                  </p>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white/95 rotate-45 border-r border-b border-[#5A5A40]/10" />
                </motion.div>
              </motion.div>
            ))}
          </div>

          {/* Shelf Plank */}
          <div className="relative h-6 w-full">
            {/* Top Surface */}
            <div className="absolute top-0 left-0 w-full h-3 bg-[#8B5E3C] rounded-t-sm shadow-sm" style={{ 
              backgroundImage: 'linear-gradient(to right, #7A5235, #9B6A45, #7A5235)' 
            }} />
            {/* Front Edge */}
            <div className="absolute top-3 left-0 w-full h-3 bg-[#6D4A2F] rounded-b-lg shadow-xl" />
            {/* Shelf Support Brackets */}
            <div className="absolute top-6 left-[15%] w-4 h-8 bg-[#5A3D27] rounded-b-md" />
            <div className="absolute top-6 right-[15%] w-4 h-8 bg-[#5A3D27] rounded-b-md" />
          </div>
        </div>

        {/* Empty Shelf 2 (For future books) */}
        <div className="relative opacity-40">
          <div className="h-32 flex items-center justify-center italic text-[#5A5A40]/40">
            更多精彩绘本正在编写中...
          </div>
          <div className="relative h-6 w-full">
            <div className="absolute top-0 left-0 w-full h-3 bg-[#8B5E3C] rounded-t-sm" style={{ 
              backgroundImage: 'linear-gradient(to right, #7A5235, #9B6A45, #7A5235)' 
            }} />
            <div className="absolute top-3 left-0 w-full h-3 bg-[#6D4A2F] rounded-b-lg shadow-lg" />
          </div>
        </div>
      </main>

      <footer className="max-w-6xl mx-auto mt-32 pb-16 text-center opacity-30 text-sm font-light">
        <p>© 2026 魔法绘本馆 · 开启智慧之门</p>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
      `}} />
    </div>
  );
}
