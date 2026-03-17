import React, { useState } from 'react';
import Library from './components/Library';
import DotGame from './games/DotGame';

export default function App() {
  const [currentBook, setCurrentBook] = useState<string | null>(null);

  const handleSelectBook = (bookId: string) => {
    setCurrentBook(bookId);
  };

  const handleBackToLibrary = () => {
    setCurrentBook(null);
  };

  if (currentBook === 'dot-game') {
    return <DotGame onBack={handleBackToLibrary} />;
  }

  return <Library onSelectBook={handleSelectBook} />;
}
