import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Only the weights used by the Figma design (Regular / SemiBold / Bold).
import 'pretendard/dist/web/static/Pretendard-Regular.css';
import 'pretendard/dist/web/static/Pretendard-SemiBold.css';
import 'pretendard/dist/web/static/Pretendard-Bold.css';
import './styles.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
