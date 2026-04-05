import { useIsMobile } from '@/hooks/use-mobile';

const MobileTopBar = () => {
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-40 safe-area-top">
        <div className="h-11 gradient-accent flex items-center justify-center">
          <span className="text-[13px] font-black text-accent-foreground tracking-widest">I2 ANALYTICS</span>
        </div>
      </div>
      <div className="h-11 safe-area-top" />
    </>
  );
};

export default MobileTopBar;
