import { useIsMobile } from '@/hooks/use-mobile';

const MobileTopBar = () => {
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  return (
    <>
      {/* Fixed visual bar */}
      <div className="fixed top-0 left-0 right-0 z-40 h-11 gradient-accent flex items-center justify-center shadow-md"
           style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <span className="text-sm font-black text-accent-foreground tracking-wider">I2 ANALYTICS</span>
      </div>
      {/* Spacer to push page content below the bar */}
      <div className="h-11" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }} />
    </>
  );
};

export default MobileTopBar;
