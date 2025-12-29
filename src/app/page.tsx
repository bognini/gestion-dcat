'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

function LoginForm({ onLoginSuccess }: { onLoginSuccess: (user: unknown) => void }) {
  const router = useRouter();
  const { toast } = useToast();
  const { login } = useAuth();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const loggedInUser = await login(usernameOrEmail, password);
    
    if (loggedInUser) {
      onLoginSuccess(loggedInUser);
      router.push('/accueil');
    } else {
      toast({
        variant: 'destructive',
        title: 'Échec de la connexion',
        description: 'Veuillez vérifier votre identifiant et votre mot de passe.',
      });
    }
    setIsLoading(false);
  };
  
  return (
    <Card className="border-0 shadow-xl">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl font-headline text-primary">Connectez-vous à votre compte</CardTitle>
        <CardDescription>Entrez vos identifiants pour accéder à votre espace</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleLogin}>
          <div className="space-y-2">
            <Label htmlFor="username">Nom d&apos;utilisateur ou courriel</Label>
            <Input
              id="username"
              type="text"
              placeholder="Votre nom d'utilisateur ou e-mail"
              required
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              disabled={isLoading}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Votre mot de passe"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="h-11 pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-11 px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
              </Button>
            </div>
          </div>
          <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Connexion
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function InitialLoginForm({ onFirstLoginSuccess }: { onFirstLoginSuccess: () => void }) {
  const { toast } = useToast();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    if (username === 'admin' && password === 'admin') {
      onFirstLoginSuccess();
    } else {
      toast({
        variant: 'destructive',
        title: 'Échec de la connexion',
        description: 'Veuillez utiliser les identifiants par défaut "admin" et "admin".',
      });
    }
    setIsLoading(false);
  };
  
  return (
    <Card className="border-0 shadow-xl">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl font-headline text-primary">Première Connexion</CardTitle>
        <CardDescription>Veuillez utiliser les identifiants par défaut pour commencer la configuration.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleLogin}>
          <div className="space-y-2">
            <Label htmlFor="default-username">Nom d&apos;utilisateur</Label>
            <Input
              id="default-username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="default-password">Mot de passe</Label>
            <Input
              id="default-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11"
            />
          </div>
          <Button type="submit" className="w-full h-11" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Continuer
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

const PasswordRequirement = ({ label, met }: { label: string; met: boolean }) => (
  <div className={`flex items-center text-sm ${met ? 'text-green-600' : 'text-muted-foreground'}`}>
    {met ? <CheckCircle className="mr-2 h-4 w-4" /> : <XCircle className="mr-2 h-4 w-4" />}
    {label}
  </div>
);

function AdminSetupForm({ onSetupComplete }: { onSetupComplete: (newUser: unknown) => void }) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const passwordChecks = useMemo(() => {
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
      match: password !== '' && password === confirmPassword,
    };
    return {
      ...checks,
      allMet: Object.values(checks).every(Boolean)
    };
  }, [password, confirmPassword]);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordChecks.allMet) {
      toast({
        variant: 'destructive',
        title: 'Mot de passe non sécurisé',
        description: 'Veuillez vous assurer que tous les critères de mot de passe sont respectés.',
      });
      return;
    }
    
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: name,
          username,
          email,
          password,
        }),
      });

      const newUser = await response.json();
      
      if (!response.ok) {
        throw new Error(newUser.error || 'Erreur lors de la configuration');
      }

      onSetupComplete(newUser);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast({
        variant: 'destructive',
        title: 'Erreur de configuration',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl font-headline text-primary">Configuration de l&apos;Administrateur</CardTitle>
        <CardDescription>Créez votre compte administrateur principal sécurisé.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSetup}>
          <div className="space-y-2">
            <Label htmlFor="setup-name">Nom complet</Label>
            <Input id="setup-name" placeholder="ex: Jean Dupont" required value={name} onChange={(e) => setName(e.target.value)} className="h-11" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="setup-username">Nom d&apos;utilisateur</Label>
              <Input id="setup-username" placeholder="ex: jdupont" required value={username} onChange={(e) => setUsername(e.target.value)} className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="setup-email">Adresse e-mail</Label>
              <Input id="setup-email" type="email" placeholder="ex: j.dupont@dcat.ci" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="setup-password">Nouveau mot de passe</Label>
            <Input id="setup-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-11" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="setup-confirm-password">Confirmer le mot de passe</Label>
            <Input id="setup-confirm-password" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-11" />
          </div>
          
          <Card className="bg-muted/50 p-4 space-y-2 border-0">
            <PasswordRequirement label="Au moins 8 caractères" met={passwordChecks.length} />
            <PasswordRequirement label="Une lettre minuscule (a-z)" met={passwordChecks.lowercase} />
            <PasswordRequirement label="Une lettre majuscule (A-Z)" met={passwordChecks.uppercase} />
            <PasswordRequirement label="Un chiffre (0-9)" met={passwordChecks.number} />
            <PasswordRequirement label="Un caractère spécial (!@#...)" met={passwordChecks.special} />
            <PasswordRequirement label="Les mots de passe correspondent" met={passwordChecks.match} />
          </Card>

          <Button type="submit" className="w-full h-11" disabled={!passwordChecks.allMet || isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Créer le compte et se connecter
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  const { toast } = useToast();
  const { setUser, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loginStep, setLoginStep] = useState<'loading' | 'initial' | 'setup' | 'login'>('loading');

  useEffect(() => {
    // Redirect if already logged in
    if (!authLoading && user) {
      router.push('/accueil');
      return;
    }

    const checkAdminUser = async () => {
      try {
        const res = await fetch('/api/auth/check-admin');
        const { adminExists } = await res.json();
        setLoginStep(adminExists ? 'login' : 'initial');
      } catch (error) {
        console.error("Failed to check admin user", error);
        setLoginStep('initial');
      }
    };

    if (!authLoading && !user) {
      checkAdminUser();
    }
  }, [authLoading, user, router]);

  const handleLoginSuccess = (loggedInUser: unknown) => {
    setUser(loggedInUser as Parameters<typeof setUser>[0]);
  };
  
  const handleSetupComplete = () => {
    toast({
      title: 'Administrateur configuré !',
      description: 'Vous pouvez maintenant vous connecter avec vos nouveaux identifiants.',
    });
    setLoginStep('login');
  };

  const renderContent = () => {
    switch (loginStep) {
      case 'initial':
        return <InitialLoginForm onFirstLoginSuccess={() => setLoginStep('setup')} />;
      case 'setup':
        return <AdminSetupForm onSetupComplete={handleSetupComplete} />;
      case 'login':
        return <LoginForm onLoginSuccess={handleLoginSuccess} />;
      case 'loading':
      default:
        return (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="mt-2 text-muted-foreground">Chargement...</p>
          </div>
        );
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50"></div>
      
      <div className="relative w-full max-w-md space-y-6 p-4">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full"></div>
              <Image
                src="/dcat-logo.png"
                alt="DCAT logo"
                width={100}
                height={100}
                priority
                className="relative rounded-xl shadow-2xl"
              />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-headline font-bold tracking-wide text-white">
              APPLICATION DE GESTION
            </h1>
          </div>
        </div>
        
        {renderContent()}
        
        <p className="text-center text-xs text-slate-500">
          © {new Date().getFullYear()} DCAT. Tous droits réservés.
        </p>
      </div>
    </div>
  );
}
