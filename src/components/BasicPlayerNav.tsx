import { useNavigate, useLocation } from 'react-router-dom';
import { Target, Trophy, BarChart3, Crown, LogOut, Brain, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import UpgradeDialog from './UpgradeDialog';
import { useAuth } from '@/contexts/AuthContext';

const BasicPlayerNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const tabs = [
    { path: '/shots', icon: Target, label: 'קליעות' },
    { path: '/challenges', icon: Trophy, label: 'אתגרים' },
    { path: '/courtiq', icon: Brain, label: 'Court IQ' },
    { path: '/leaderboard', icon: BarChart3, label: 'דירוג' },
  ];

  const currentPath = location.pathname;

  return (
    <>
      {/* Top bar with upgrade + logout */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border px-3 py-2 flex items-center justify-between safe-area-top">
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            onClick={() => setUpgradeOpen(true)}
            className="gradient-accent text-accent-foreground gap-1 font-semibold text-xs h-8 px-2.5"
          >
            <Crown className="h-3.5 w-3.5" />
            <span className="hidden xs:inline">שדרג לליווי אישי</span>
            <span className="xs:hidden">שדרג</span>
          </Button>
          <a href="https://wa.me/972526124759" target="_blank" rel="noopener noreferrer" className="text-success text-xs font-medium flex items-center gap-1 hover:underline">
            <span>💬</span>
            <span className="hidden sm:inline">לשאלות — 052-6124759</span>
            <span className="sm:hidden">💬</span>
          </a>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs sm:text-sm font-bold text-foreground">I2 Analytics</span>
          <div className="flex items-center justify-center h-7 w-7 rounded-lg gradient-accent">
            <span className="text-xs font-black text-accent-foreground">I2</span>
          </div>
          <Button variant="ghost" size="icon" onClick={logout} className="text-muted-foreground h-8 w-8">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border safe-area-bottom">
        <div className="flex items-center justify-around py-1.5 px-2 max-w-md mx-auto">
          {tabs.map(tab => {
            const isActive = currentPath === tab.path || (tab.path === '/shots' && currentPath === '/');
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={`flex flex-col items-center gap-0.5 min-w-[56px] min-h-[44px] justify-center px-2 py-1 rounded-xl transition-all ${
                  isActive
                    ? 'text-accent scale-105'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <tab.icon className={`h-5 w-5 ${isActive ? 'drop-shadow-[0_0_6px_hsl(var(--accent)/0.5)]' : ''}`} />
                <span className="text-[10px] sm:text-xs font-medium">{tab.label}</span>
                {isActive && <div className="h-0.5 w-4 rounded-full bg-accent" />}
              </button>
            );
          })}
        </div>
      </div>

      <UpgradeDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </>
  );
};

export default BasicPlayerNav;
