import { useIsMobile } from '@/hooks/use-mobile';
import cmsLogo from '@/assets/cms-logo-mark.png';

const MobileTopBar = () => {
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-40 safe-area-top">
      <div className="h-14 bg-card/90 backdrop-blur-xl border-b border-accent/20 flex items-center justify-center">
        <img
          src={cmsLogo}
          alt="count my shots"
          className="h-11 w-auto object-contain drop-shadow-[0_0_12px_hsl(190,95%,55%,0.5)]"
        />
      </div>
    </div>
  );
};

export default MobileTopBar;
