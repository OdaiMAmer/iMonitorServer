import Sidebar from './Sidebar';
import TopBar from './TopBar';
import StatusBar from './StatusBar';
import { useUIStore } from '../../stores/useUIStore';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);

  return (
    <div className="flex h-screen overflow-hidden bg-bg-root">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar />
        <main
          className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8"
          style={{
            marginLeft: sidebarCollapsed ? '64px' : '260px',
            transition: 'margin-left 0.2s ease-in-out',
          }}
        >
          {children}
        </main>
        <StatusBar />
      </div>
    </div>
  );
}
