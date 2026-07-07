import { AiPanel } from './components/AiPanel.js';
import { RightPanel } from './components/RightPanel.js';
import { StatusBar } from './components/StatusBar.js';
import { ThumbnailsSidebar } from './components/ThumbnailsSidebar.js';
import { Toolbar } from './components/Toolbar.js';
import { Viewer } from './components/Viewer.js';
import { useEditor } from './store.js';

export function App() {
  const assistantOpen = useEditor((s) => s.assistantOpen);
  return (
    <div className="flex h-full flex-col overflow-hidden bg-canvas text-text">
      <Toolbar />
      <div className="flex min-h-0 flex-1">
        <ThumbnailsSidebar />
        <Viewer />
        {assistantOpen ? <AiPanel /> : <RightPanel />}
      </div>
      <StatusBar />
    </div>
  );
}
