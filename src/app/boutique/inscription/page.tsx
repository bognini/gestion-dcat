'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Loader2, Mail, Lock, Eye, EyeOff, User, Phone, MapPin, RefreshCw, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useBoutiqueAuth } from '@/components/providers/boutique-auth-provider';

export default function InscriptionPage() {
  const { register } = useBoutiqueAuth();
  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    password: '',
    confirmPassword: '',
    adresse: '',
    ville: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [captcha, setCaptcha] = useState<{ question: string; token: string } | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaLoading, setCaptchaLoading] = useState(false);

  const loadCaptcha = useCallback(async () => {
    setCaptchaLoading(true);
    setCaptchaAnswer('');
    try {
      const res = await fetch('/api/boutique/auth/captcha');
      if (res.ok) setCaptcha(await res.json());
    } catch { /* ignore */ }
    setCaptchaLoading(false);
  }, []);

  useEffect(() => { loadCaptcha(); }, [loadCaptcha]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (form.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (!captcha?.token || !captchaAnswer) {
      setError('Veuillez répondre à la question de sécurité');
      return;
    }

    setLoading(true);
    const result = await register({
      nom: form.nom,
      prenom: form.prenom || undefined,
      email: form.email,
      telephone: form.telephone,
      password: form.password,
      adresse: form.adresse || undefined,
      ville: form.ville || undefined,
      captchaToken: captcha.token,
      captchaAnswer,
    });

    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error || 'Erreur lors de l\'inscription');
      loadCaptcha();
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-md">
        <Card>
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Mail className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Vérifiez votre email</h2>
            <p className="text-slate-600">
              Un email de vérification a été envoyé à <strong>{form.email}</strong>.
            </p>
            <p className="text-sm text-slate-500">
              Cliquez sur le lien dans l&apos;email pour activer votre compte, puis connectez-vous.
            </p>
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <Link href="/boutique/connexion">Aller à la connexion</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-lg">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Créer un compte</CardTitle>
          <CardDescription>Inscrivez-vous pour commander sur DCAT E-Market</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-200">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="nom"
                    placeholder="BOGNINI"
                    value={form.nom}
                    onChange={(e) => setForm({ ...form, nom: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="prenom">Prénom(s)</Label>
                <Input
                  id="prenom"
                  placeholder="Jean Abraham"
                  value={form.prenom}
                  onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Adresse email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="telephone">Téléphone *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="telephone"
                  type="tel"
                  placeholder="+225 07 00 00 00 00"
                  value={form.telephone}
                  onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="adresse">Adresse</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="adresse"
                    placeholder="Cocody, Angré"
                    value={form.adresse}
                    onChange={(e) => setForm({ ...form, adresse: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ville">Ville</Label>
                <Input
                  id="ville"
                  placeholder="Abidjan"
                  value={form.ville}
                  onChange={(e) => setForm({ ...form, ville: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Au moins 6 caractères"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="pl-10 pr-10"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Répétez le mot de passe"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className="pl-10"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {/* CAPTCHA */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                Vérification de sécurité *
              </Label>
              <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-3 border">
                {captchaLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                ) : captcha ? (
                  <>
                    <span className="font-mono text-lg font-bold text-slate-700 select-none">
                      {captcha.question}
                    </span>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="?"
                      value={captchaAnswer}
                      onChange={(e) => setCaptchaAnswer(e.target.value)}
                      className="w-20 text-center font-mono text-lg"
                      required
                    />
                    <button
                      type="button"
                      onClick={loadCaptcha}
                      className="text-slate-400 hover:text-slate-600 shrink-0"
                      title="Nouveau captcha"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <span className="text-sm text-slate-500">Erreur de chargement</span>
                )}
              </div>
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading || !captcha}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Créer mon compte
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            Déjà un compte ?{' '}
            <Link href="/boutique/connexion" className="text-blue-600 hover:underline font-medium">
              Se connecter
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
