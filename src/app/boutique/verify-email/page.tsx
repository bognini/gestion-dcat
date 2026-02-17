'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token de vérification manquant');
      return;
    }

    fetch(`/api/boutique/auth/verify-email?token=${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setStatus('success');
          setMessage(data.message);
        } else {
          setStatus('error');
          setMessage(data.error || 'Erreur de vérification');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Erreur réseau');
      });
  }, [token]);

  return (
    <div className="container mx-auto px-4 py-12 max-w-md">
      <Card>
        <CardContent className="pt-8 pb-8 text-center space-y-4">
          {status === 'loading' && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
              <p className="text-slate-600">Vérification en cours...</p>
            </>
          )}
          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Email vérifié !</h2>
              <p className="text-slate-600">{message}</p>
              <Button asChild className="bg-blue-600 hover:bg-blue-700">
                <Link href="/boutique/connexion">Se connecter</Link>
              </Button>
            </>
          )}
          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Erreur</h2>
              <p className="text-slate-600">{message}</p>
              <Button asChild variant="outline">
                <Link href="/boutique/inscription">Réessayer l&apos;inscription</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-12 max-w-md text-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
