import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import WeeklyChallenges from '@/components/challenges/WeeklyChallenges';
import PlayerChallenges from '@/components/challenges/PlayerChallenges';

const ChallengesPage = () => {
  const { playerId } = useParams();
  const { auth, user } = useAuth();
  const navigate = useNavigate();
  const isCoach = auth.role === 'coach';

  // If coach is viewing a specific player's challenges, use that playerId
  const viewingPlayerId = isCoach && playerId ? playerId : auth.playerId;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div />
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">אתגרים 🏆</h1>
            <Button variant="ghost" onClick={() => navigate(-1)} className="text-muted-foreground">
              חזרה
              <ArrowRight className="mr-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-8">
          {/* Weekly challenges */}
          <WeeklyChallenges />

          {/* Player-vs-player challenges */}
          {viewingPlayerId && (
            <PlayerChallenges playerId={viewingPlayerId} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChallengesPage;
