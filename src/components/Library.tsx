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
  },
  {
    id: 'coming-soon-3',
    title: '猜猜我有多爱你',
    author: 'Sam McBratney',
    coverColor: '#A8D8EA',
    description: '表达爱意的经典绘本。',
    icon: '🐰',
    isComingSoon: true,
  },
  {
    id: 'coming-soon-4',
    title: '逃家小兔',
    author: 'Margaret Wise Brown',
    coverColor: '#AA96DA',
    description: '母爱与勇气的温馨故事。',
    icon: '🐇',
    isComingSoon: true,
  },
  {
    id: 'coming-soon-5',
    title: '月亮的味道',
    author: 'Michael Grejniec',
    coverColor: '#FCBAD3',
    description: '动物们想尝尝月亮。',
    icon: '🌙',
    isComingSoon: true,
  },
  {
    id: 'coming-soon-6',
    title: '大卫，不可以',
    author: 'David Shannon',
    coverColor: '#FFFFD2',
    description: '调皮的大卫和妈妈的爱。',
    icon: '👦',
    isComingSoon: true,
  }
];

interface LibraryProps {
  onSelectBook: (bookId: string) => void;
}

const Shelf: React.FC<{ books: Book[], onSelectBook: (id: string) => void }> = ({ books, onSelectBook }) => (
  <div className="relative mb-24 last:mb-12">
    <div className="grid grid-cols-5 items-end gap-3 md:gap-8 mb-[-4px] px-2 md:px-8">
      {books.map((book, index) => (
        <motion.div
          key={book.id}
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.1, type: 'spring', stiffness: 100 }}
          whileHover={book.isComingSoon ? {} : { 
            scale: 1.05, 
            rotateY: -15,
            z: 50,
            transition: { duration: 0.3 }
          }}
          className={`relative w-full perspective-1000 ${book.isComingSoon ? 'cursor-not-allowed grayscale-[0.4]' : 'cursor-pointer'}`}
          onClick={() => !book.isComingSoon && onSelectBook(book.id)}
        >
          {/* Book Shadow on Shelf */}
          <div className="absolute -bottom-2 left-2 right-2 h-2 bg-black/20 blur-md rounded-full transform scale-x-110" />
          
          <div 
            className="aspect-[3/4] rounded-r-lg shadow-xl overflow-hidden relative flex flex-col items-center justify-center p-2 md:p-4 transition-all duration-500 transform-style-3d border-l-2 border-black/20"
            style={{ backgroundColor: book.coverColor }}
          >
            {/* Spine Highlight */}
            <div className="absolute left-0 top-0 w-full h-full bg-gradient-to-r from-black/20 via-transparent to-white/10 pointer-events-none" />
            
            <div className="text-3xl md:text-5xl mb-2 md:mb-3 drop-shadow-lg">
              {book.icon}
            </div>
            
            <h2 className="text-[10px] md:text-xl font-bold text-center mb-0.5 md:mb-1 text-white drop-shadow-md leading-tight line-clamp-2">
              {book.title}
            </h2>
            <p className="text-white/70 text-[8px] md:text-[10px] italic mb-1 md:mb-2 font-light line-clamp-1">
              {book.author}
            </p>
            
            {book.isComingSoon && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-[1px]">
                <span className="bg-white/90 text-black px-1.5 py-0.5 rounded-full font-bold text-[6px] md:text-[8px] tracking-widest uppercase shadow-lg">
                  SOON
                </span>
              </div>
            )}
          </div>

          {/* Book Info Tooltip */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileHover={{ opacity: 1, y: 0 }}
            className="absolute -top-20 left-1/2 -translate-x-1/2 w-32 md:w-40 bg-white/95 backdrop-blur-sm p-2 rounded-lg shadow-xl border border-[#5A5A40]/10 pointer-events-none hidden md:block z-30"
          >
            <p className="text-[10px] leading-relaxed text-[#4A4A40]">
              {book.description}
            </p>
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white/95 rotate-45 border-r border-b border-[#5A5A40]/10" />
          </motion.div>
        </motion.div>
      ))}
      
      {/* Fill empty slots to maintain grid alignment if row has < 5 books */}
      {books.length < 5 && Array.from({ length: 5 - books.length }).map((_, i) => (
        <div key={`empty-${i}`} className="w-full aspect-[3/4]" />
      ))}
    </div>

    {/* Shelf Plank */}
    <div className="relative h-5 w-full">
      <div className="absolute top-0 left-0 w-full h-2.5 bg-[#8B5E3C] rounded-t-sm shadow-sm" style={{ 
        backgroundImage: 'linear-gradient(to right, #7A5235, #9B6A45, #7A5235)' 
      }} />
      <div className="absolute top-2.5 left-0 w-full h-2.5 bg-[#6D4A2F] rounded-b-lg shadow-xl" />
      <div className="absolute top-5 left-[10%] w-3 h-6 bg-[#5A3D27] rounded-b-md" />
      <div className="absolute top-5 right-[10%] w-3 h-6 bg-[#5A3D27] rounded-b-md" />
    </div>
  </div>
);

export default function Library({ onSelectBook }: LibraryProps) {
  // Group books into rows of 5
  const rows = [];
  for (let i = 0; i < BOOKS.length; i += 5) {
    rows.push(BOOKS.slice(i, i + 5));
  }

  return (
    <div className="min-h-screen bg-[#FDFCF8] text-[#4A4A40] font-serif overflow-y-auto">
      {/* Background Decoration */}
      <div className="fixed inset-0 pointer-events-none opacity-20" style={{ 
        backgroundImage: 'radial-gradient(#5A5A40 1px, transparent 1px)', 
        backgroundSize: '40px 40px' 
      }} />

      <header className="max-w-6xl mx-auto pt-12 pb-16 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-block mb-2"
        >
          <span className="text-5xl">📚</span>
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-6xl font-bold mb-2 text-[#2A2A20] tracking-tight"
        >
          魔法绘本馆
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-lg md:text-xl italic opacity-70 font-light"
        >
          点开一本书，开启一段奇妙冒险
        </motion.p>
      </header>

      <main className="max-w-6xl mx-auto px-4 relative z-10 pb-20">
        {rows.map((row, index) => (
          <Shelf key={index} books={row} onSelectBook={onSelectBook} />
        ))}

        {/* Empty Shelf for future books */}
        <div className="relative opacity-40 mt-12">
          <div className="h-24 flex items-center justify-center italic text-[#5A5A40]/40 text-sm">
            更多精彩绘本正在编写中...
          </div>
          <div className="relative h-5 w-full">
            <div className="absolute top-0 left-0 w-full h-2.5 bg-[#8B5E3C] rounded-t-sm" style={{ 
              backgroundImage: 'linear-gradient(to right, #7A5235, #9B6A45, #7A5235)' 
            }} />
            <div className="absolute top-2.5 left-0 w-full h-2.5 bg-[#6D4A2F] rounded-b-lg shadow-lg" />
          </div>
        </div>
      </main>

      <footer className="max-w-6xl mx-auto pb-12 text-center opacity-30 text-xs font-light">
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
