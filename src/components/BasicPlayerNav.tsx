import { useNavigate, useLocation } from 'react-router-dom';
import { Target, Trophy, BarChart3, LogOut, Brain, Video, User } from 'lucide-react';
import euroleagueLogo from '@/assets/euroleague-logo.png';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import UpgradeDialog from './UpgradeDialog';
import FantasyInfoDialog from './FantasyInfoDialog';
import { useAuth } from '@/contexts/AuthContext';
import RoleSwitcher from './RoleSwitcher';

const BasicPlayerNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, profile } = useAuth();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [fantasyOpen, setFantasyOpen] = useState(false);

  const isPremium = profile?.subscription_tier === 'premium' || profile?.subscription_tier === 'free';

  const tabs = isPremium ? [
    { path: '/', icon: User, label: 'פרופיל' },
    { path: '/personal-coaching', icon: Video, label: 'ליווי' },
    { path: '/shots', icon: Target, label: 'קליעות' },
    { path: '/challenges', icon: Trophy, label: 'אתגרים' },
    { path: '/courtiq', icon: Brain, label: 'IQ' },
    { path: 'fantasy', icon: null, label: 'פנטזי', action: () => setFantasyOpen(true), customIcon: true },
  ] : [
    { path: '/shots', icon: Target, label: 'קליעות' },
    { path: '/challenges', icon: Trophy, label: 'אתגרים' },
    { path: '/courtiq', icon: Brain, label: 'IQ' },
    { path: '/leaderboard', icon: BarChart3, label: 'דירוג' },
    { path: 'fantasy', icon: null, label: 'פנטזי', action: () => setFantasyOpen(true), customIcon: true },
  ];

  const currentPath = location.pathname;

  return (
    <>
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 safe-area-top">
        <div className="bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {!isPremium && (
              <Button
                size="sm"
                onClick={() => setUpgradeOpen(true)}
                className="gradient-accent text-accent-foreground gap-1.5 font-bold text-[11px] h-8 px-3 rounded-xl"
              >
                <span>שדרג לליווי</span>
              </Button>
            )}
            <a href="https://wa.me/972526124759" target="_blank" rel="noopener noreferrer" className="text-success text-[11px] font-medium flex items-center gap-1 hover:underline">
              <span>💬</span>
              <span className="hidden sm:inline">052-6124759</span>
            </a>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-foreground tracking-tight">I2</span>
            <div className="flex items-center justify-center h-7 w-7 rounded-lg gradient-accent">
              <span className="text-[10px] font-black text-accent-foreground">I2</span>
            </div>
            <RoleSwitcher inline className="shrink-0" />
            <Button variant="ghost" size="icon" onClick={logout} className="text-muted-foreground h-8 w-8 shrink-0 rounded-xl">
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
        <div className="bg-background/80 backdrop-blur-xl border-t border-border/50">
          <div className="flex items-center justify-around py-1 px-1 max-w-md mx-auto">
            {tabs.map((tab: any) => {
              const isActive = !tab.action && (
                currentPath === tab.path ||
                (tab.path === '/shots' && currentPath === '/') ||
                (tab.path === '/' && currentPath === '/')
              );

              return (
                <button
                  key={tab.path}
                  onClick={() => tab.action ? tab.action() : navigate(tab.path)}
                  className={`flex flex-col items-center gap-0.5 min-w-[48px] min-h-[44px] justify-center px-1.5 py-1 rounded-xl transition-all active:scale-95 ${
                    isActive ? 'text-accent' : 'text-muted-foreground'
                  }`}
                >
                  {tab.customIcon ? (
                    <img src={euroleagueLogo} alt="EuroLeague" className="h-5 w-5 object-contain" loading="lazy" />
                  ) : (
                    <tab.icon className={`h-5 w-5 ${isActive ? 'drop-shadow-[0_0_8px_hsl(24,100%,50%,0.5)]' : ''}`} />
                  )}
                  <span className="text-[10px] font-semibold leading-none">{tab.label}</span>
                  {isActive && <div className="h-0.5 w-5 rounded-full gradient-accent mt-0.5" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <UpgradeDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} />
      <FantasyInfoDialog open={fantasyOpen} onOpenChange={setFantasyOpen} />
    </>
  );
};

export default BasicPlayerNav;
