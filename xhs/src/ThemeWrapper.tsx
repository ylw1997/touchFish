import { useEffect, useState } from 'react';
import Feed from './components/Feed';

declare global { interface Window { showImg?: boolean; } }

export default function ThemeWrapper() {
  const [showImg, setShowImg] = useState<boolean>(true);
  useEffect(() => {
    if (typeof window.showImg === 'boolean') setShowImg(window.showImg);
  }, []);
  return <Feed showImg={showImg} />;
}
