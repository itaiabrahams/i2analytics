import { useNavigate } from 'react-router-dom';

const FloatingLogo = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/')}
      className="fixed top-3 right-3 z-40 hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl gradient-accent shadow-lg hover:scale-105 transition-transform"
      aria-label="I2 Analytics - חזרה לדף הבית"
    >
      <span className="text-sm font-black text-accent-foreground">I2</span>
    </button>
  );
};

export default FloatingLogo;
