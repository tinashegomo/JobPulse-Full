import { Outlet } from 'react-router-dom';
import TopNav from './TopNav';
import BottomNav from './BottomNav';

export default function MainLayout() {
  return (
    <div className="flex flex-col h-dvh w-full overflow-hidden bg-bg-default">
      <TopNav />

      <main className="flex-1 w-full max-w-[480px] md:max-w-[768px] lg:max-w-[1024px] xl:max-w-[1140px] mx-auto px-4 md:px-6 lg:px-8 pt-4 pb-24 overflow-y-auto scroll-smooth">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
}
