import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { MiseLogo } from '@/components/brand/MiseLogo';
import { Sparkles, ArrowRight, ShieldCheck, Database, Check } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loginDemo, isAuthenticated, demoCredentials } = useAuth();

  const [formData, setFormData] = useState({
    email: demoCredentials.email,
    password: demoCredentials.password,
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = login(formData);
    setIsLoading(false);

    if (result.success) {
      navigate('/', { replace: true });
    } else {
      setError(result.error || 'Authentication error.');
    }
  };

  const handleInstantDemoLogin = () => {
    loginDemo();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-4 sm:p-8">
      {/* Top Bar */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between">
        <MiseLogo />
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground border border-border flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-sage" />
          Browser-Only Prototype
        </span>
      </header>

      {/* Main Login Canvas */}
      <main className="max-w-md w-full mx-auto my-8">
        <div className="card-premium p-6 sm:p-8 shadow-elevated bg-card border-border">
          {/* Editorial Brand Header */}
          <div className="text-center mb-6">
            <h1 className="font-display text-3xl font-bold text-foreground tracking-tight">
              Sign In to Command
            </h1>
            <p className="text-xs text-secondary-foreground mt-1.5">
              High-artisan restaurant, catering banquet, and costing management
            </p>
          </div>

          {/* One-Click Instant Demo Access Button */}
          <div className="mb-6 p-4 rounded-xl bg-charcoal text-white text-center space-y-2.5">
            <div className="flex items-center justify-center gap-1.5 text-butter text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Full Access Demo Available</span>
            </div>
            <p className="text-[11px] text-sidebar-muted leading-relaxed">
              Explore live orders, ingredient inventory, recipe costing, and payment simulation instantly.
            </p>
            <Button
              type="button"
              onClick={handleInstantDemoLogin}
              className="w-full bg-terracotta hover:bg-terracotta/90 text-white font-semibold text-xs h-9 shadow-sm"
            >
              Enter Demo Account <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </div>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
              <span className="bg-card px-3 text-muted-foreground">Or Sign In with Credentials</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {error && (
              <Alert variant="destructive" className="py-2.5 text-xs">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="font-semibold text-xs text-foreground">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="h-9 bg-card text-xs border-border"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="font-semibold text-xs text-foreground">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="h-9 bg-card text-xs border-border"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-charcoal hover:bg-charcoal/90 text-white text-xs h-9 mt-2"
            >
              {isLoading ? 'Verifying...' : 'Sign In'}
            </Button>
          </form>

          {/* Demo Credentials Box */}
          <div className="mt-6 p-3 rounded-lg bg-secondary/50 border border-border/80 text-[11px] text-secondary-foreground space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-foreground">
              <ShieldCheck className="w-3.5 h-3.5 text-sage" />
              <span>Standard Demo Credentials:</span>
            </div>
            <div className="flex justify-between items-center font-mono text-[10px] pt-1">
              <span>Email: <strong className="text-foreground">{demoCredentials.email}</strong></span>
              <span>Pass: <strong className="text-foreground">{demoCredentials.password}</strong></span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-[11px] text-muted-foreground">
        <p>Mise Culinary Operations Platform • Standalone LocalStorage Architecture</p>
      </footer>
    </div>
  );
}
