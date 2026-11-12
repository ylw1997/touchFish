import { createRoot } from 'react-dom/client';
import ThemeWrapper from './ThemeWrapper';
import './style/index.less';

import { unlockSoftwareAudioOnInteraction } from "../../webview/softVideoAudio";

unlockSoftwareAudioOnInteraction();
createRoot(document.getElementById('root')!).render(<ThemeWrapper />);
