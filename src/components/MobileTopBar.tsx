import { useIsMobile } from '@/hooks/use-mobile';

const MobileTopBar = () => {
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-30 h-10 gradient-accent flex items-center justify-center shadow-md">
      <span className="text-sm font-black text-accent-foreground tracking-wider">I2 ANALYTICS</span>
    </div>
  );
};

export default MobileTopBar;
