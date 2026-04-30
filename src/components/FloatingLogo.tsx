import { useNavigate } from 'react-router-dom';
import cmsLogo from '@/assets/cms-logo-mark.png';

const FloatingLogo = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/')}
      className="fixed top-3 right-3 z-40 hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-card/80 backdrop-blur-md border border-accent/30 shadow-lg hover:scale-105 transition-transform"
      aria-label="count my shots - חזרה לדף הבית"
    >
      <img src={cmsLogo} alt="count my shots" className="h-7 w-auto object-contain" />
    </button>
  );
};

export default FloatingLogo;
