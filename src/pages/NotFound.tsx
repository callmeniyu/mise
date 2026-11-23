import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Compass } from 'lucide-react';
import { MiseLogo } from '@/components/brand/MiseLogo';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-between p-6 bg-background text-foreground">
      <MiseLogo />

      <div className="text-center max-w-md p-8 card-premium shadow-card my-auto">
        <div className="w-16 h-16 rounded-2xl bg-terracotta-light text-terracotta mx-auto flex items-center justify-center mb-4">
          <Compass className="w-8 h-8" />
        </div>
        <span className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-widest">
          Error 404
        </span>
        <h1 className="font-display text-2xl font-bold text-foreground mt-1 mb-2">
          Operational Station Not Found
        </h1>
        <p className="text-xs text-secondary-foreground mb-6 leading-relaxed">
          The requested station or culinary route does not exist in this workspace.
        </p>

        <Link to="/">
          <Button className="bg-charcoal text-white hover:bg-charcoal/90 text-xs h-9">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Return to Operations Command
          </Button>
        </Link>
      </div>

      <p className="text-[11px] text-muted-foreground">Mise Culinary Operations Platform</p>
    </div>
  );
}
