'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Settings, 
  ArrowLeft,
  Mail,
  Bell,
  Palette,
  Globe,
  Database,
  Save,
  Loader2,
  Moon,
  Sun,
  Monitor
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes';

export default function OptionsPage() {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [configLoading, setConfigLoading] = useState(true);
  const [configAccessDenied, setConfigAccessDenied] = useState(false);
  
  // Email settings
  const [emailSettings, setEmailSettings] = useState({
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpPassword: '',
    senderEmail: '',
    senderName: 'DCAT System',
    smtpSecure: true,
  });
  
  // Notification settings
  const [notifications, setNotifications] = useState({
    lowStockAlert: true,
    newUserAlert: true,
    dailyReport: false,
    weeklyReport: true,
  });

  const [notificationEmails, setNotificationEmails] = useState('');
  const [notificationLists, setNotificationLists] = useState<Record<string, string>>({
    low_stock_alert: '',
    new_user_alert: '',
    daily_report: '',
    weekly_report: '',
  });
  
  // General settings
  const [generalSettings, setGeneralSettings] = useState({
    companyName: 'DCAT',
    language: 'fr',
    currency: 'XOF',
    timezone: 'Africa/Abidjan',
    dateFormat: 'DD/MM/YYYY',
    whatsappNumber: '+225 07 09 02 96 25',
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('dcat_email_settings');
    const savedNotifications = localStorage.getItem('dcat_notification_settings');
    const savedGeneral = localStorage.getItem('dcat_general_settings');
    
    if (savedEmail) setEmailSettings(JSON.parse(savedEmail));
    if (savedNotifications) setNotifications(JSON.parse(savedNotifications));
    if (savedGeneral) setGeneralSettings(JSON.parse(savedGeneral));
  }, []);

  const parseEmailText = (raw: string): string[] => {
    const emails = raw
      .split(/[\n\r,;\t ]+/g)
      .map((s) => s.trim())
      .filter(Boolean);
    return Array.from(new Set(emails));
  };

  useEffect(() => {
    const fetchConfig = async () => {
      setConfigLoading(true);
      setConfigAccessDenied(false);
      try {
        const [mailRes, listsRes] = await Promise.all([
          fetch('/api/mail-config'),
          fetch('/api/notification-email-lists'),
        ]);

        if (mailRes.status === 403 || listsRes.status === 403) {
          setConfigAccessDenied(true);
        }

        if (mailRes.ok) {
          const cfg = await mailRes.json();
          setEmailSettings((prev) => ({
            ...prev,
            smtpHost: cfg.smtpHost || '',
            smtpPort: String(cfg.smtpPort || 587),
            smtpUser: cfg.smtpUser || '',
            senderEmail: cfg.smtpFrom || '',
            senderName: cfg.smtpFromName || prev.senderName,
            smtpSecure: cfg.smtpSecure ?? true,
          }));
          setNotificationEmails(Array.isArray(cfg.notificationEmails) ? cfg.notificationEmails.join('\n') : '');
        }

        if (listsRes.ok) {
          const lists = await listsRes.json();
          if (Array.isArray(lists)) {
            setNotificationLists((prev) => {
              const next = { ...prev };
              for (const item of lists) {
                if (item && typeof item.eventKey === 'string' && Array.isArray(item.emails)) {
                  next[item.eventKey] = item.emails.join('\n');
                }
              }
              return next;
            });
          }
        }
      } catch {
      } finally {
        setConfigLoading(false);
      }
    };

    fetchConfig();
  }, []);

  const handleSaveEmail = async () => {
    setSaving(true);
    localStorage.setItem('dcat_email_settings', JSON.stringify(emailSettings));
    try {
      const res = await fetch('/api/mail-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtpHost: emailSettings.smtpHost,
          smtpPort: parseInt(emailSettings.smtpPort || '587'),
          smtpUser: emailSettings.smtpUser,
          smtpPass: emailSettings.smtpPassword,
          smtpFrom: emailSettings.senderEmail,
          smtpFromName: emailSettings.senderName,
          smtpSecure: emailSettings.smtpSecure,
        }),
      });

      if (res.ok) {
        toast({
          title: 'Paramètres enregistrés',
          description: 'La configuration email a été mise à jour',
        });
        setEmailSettings((prev) => ({ ...prev, smtpPassword: '' }));
      } else {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible d\'enregistrer la configuration email' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible d\'enregistrer la configuration email' });
    }
    setSaving(false);
  };

  const handleTestConnection = async () => {
    if (!emailSettings.smtpHost || !emailSettings.smtpUser) {
      toast({
        variant: 'destructive',
        title: 'Configuration incomplète',
        description: 'Veuillez remplir le serveur SMTP et l\'utilisateur',
      });
      return;
    }
    setTesting(true);
    try {
      const res = await fetch('/api/mail-config/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtpHost: emailSettings.smtpHost,
          smtpPort: emailSettings.smtpPort,
          smtpUser: emailSettings.smtpUser,
          smtpPassword: emailSettings.smtpPassword || undefined,
          smtpSecure: emailSettings.smtpSecure,
          senderEmail: emailSettings.senderEmail,
          senderName: emailSettings.senderName,
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast({
          title: '✅ Connexion réussie',
          description: data.message || 'Configuration SMTP validée',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Échec du test',
          description: data.error || 'Impossible de se connecter au serveur SMTP',
        });
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de tester la connexion SMTP',
      });
    }
    setTesting(false);
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    localStorage.setItem('dcat_notification_settings', JSON.stringify(notifications));
    try {
      const res = await fetch('/api/mail-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationEmails: parseEmailText(notificationEmails),
        }),
      });

      if (!res.ok) {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible d\'enregistrer les emails de notification' });
        setSaving(false);
        return;
      }

      const eventDefs = [
        { key: 'low_stock_alert', label: 'Alerte stock faible' },
        { key: 'new_user_alert', label: 'Nouvel utilisateur' },
        { key: 'daily_report', label: 'Rapport journalier' },
        { key: 'weekly_report', label: 'Rapport hebdomadaire' },
      ];

      for (const def of eventDefs) {
        await fetch('/api/notification-email-lists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventKey: def.key,
            label: def.label,
            emails: parseEmailText(notificationLists[def.key] || ''),
          }),
        });
      }

      toast({
        title: 'Notifications mises à jour',
        description: 'Vos préférences ont été enregistrées',
      });
    } catch {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible d\'enregistrer les emails de notification' });
    }
    setSaving(false);
  };

  const handleSaveGeneral = async () => {
    setSaving(true);
    localStorage.setItem('dcat_general_settings', JSON.stringify(generalSettings));
    await new Promise(resolve => setTimeout(resolve, 500));
    toast({
      title: 'Paramètres généraux enregistrés',
      description: 'La configuration a été mise à jour',
    });
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/parametres">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Options
          </h2>
          <p className="text-muted-foreground">
            Configuration générale de l&apos;application
          </p>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Général
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Apparence
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Paramètres généraux
              </CardTitle>
              <CardDescription>
                Configuration de base de l&apos;application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nom de l&apos;entreprise</Label>
                  <Input
                    id="companyName"
                    value={generalSettings.companyName}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, companyName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Langue</Label>
                  <Select 
                    value={generalSettings.language} 
                    onValueChange={(v) => setGeneralSettings({ ...generalSettings, language: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Devise</Label>
                  <Select 
                    value={generalSettings.currency} 
                    onValueChange={(v) => setGeneralSettings({ ...generalSettings, currency: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="XOF">F CFA (XOF - UEMOA)</SelectItem>
                      <SelectItem value="XAF">F CFA (XAF - CEMAC)</SelectItem>
                      <SelectItem value="EUR">Euro (EUR)</SelectItem>
                      <SelectItem value="USD">Dollar US (USD)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Fuseau horaire</Label>
                  <Select 
                    value={generalSettings.timezone} 
                    onValueChange={(v) => setGeneralSettings({ ...generalSettings, timezone: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Africa/Abidjan">Africa/Abidjan (UTC+0)</SelectItem>
                      <SelectItem value="Africa/Douala">Africa/Douala (UTC+1)</SelectItem>
                      <SelectItem value="Europe/Paris">Europe/Paris (UTC+1/+2)</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Format de date</Label>
                  <Select 
                    value={generalSettings.dateFormat} 
                    onValueChange={(v) => setGeneralSettings({ ...generalSettings, dateFormat: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="whatsappNumber">Numéro WhatsApp (E-Market)</Label>
                  <Input
                    id="whatsappNumber"
                    value={generalSettings.whatsappNumber}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, whatsappNumber: e.target.value })}
                    placeholder="+225 07 XX XX XX XX"
                  />
                  <p className="text-xs text-muted-foreground">
                    Ce numéro sera utilisé pour le bouton WhatsApp sur les pages produits de la boutique en ligne
                  </p>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveGeneral} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Apparence
              </CardTitle>
              <CardDescription>
                Personnalisez l&apos;interface utilisateur
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Thème</Label>
                <div className="grid grid-cols-3 gap-4">
                  <Button
                    variant={theme === 'light' ? 'default' : 'outline'}
                    className="flex flex-col items-center gap-2 h-auto py-4"
                    onClick={() => setTheme('light')}
                  >
                    <Sun className="h-6 w-6" />
                    <span>Clair</span>
                  </Button>
                  <Button
                    variant={theme === 'dark' ? 'default' : 'outline'}
                    className="flex flex-col items-center gap-2 h-auto py-4"
                    onClick={() => setTheme('dark')}
                  >
                    <Moon className="h-6 w-6" />
                    <span>Sombre</span>
                  </Button>
                  <Button
                    variant={theme === 'system' ? 'default' : 'outline'}
                    className="flex flex-col items-center gap-2 h-auto py-4"
                    onClick={() => setTheme('system')}
                  >
                    <Monitor className="h-6 w-6" />
                    <span>Système</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Gérez les alertes et rapports automatiques
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {configAccessDenied && (
                <div className="p-4 border rounded-lg bg-muted/30 text-sm text-muted-foreground">
                  Seuls les administrateurs peuvent configurer les emails de notification.
                </div>
              )}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Alerte stock faible</p>
                    <p className="text-sm text-muted-foreground">
                      Recevoir une notification quand un produit atteint son seuil d&apos;alerte
                    </p>
                  </div>
                  <Switch
                    checked={notifications.lowStockAlert}
                    onCheckedChange={(v) => setNotifications({ ...notifications, lowStockAlert: v })}
                  />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Nouvel utilisateur</p>
                    <p className="text-sm text-muted-foreground">
                      Notification à la création d&apos;un nouveau compte
                    </p>
                  </div>
                  <Switch
                    checked={notifications.newUserAlert}
                    onCheckedChange={(v) => setNotifications({ ...notifications, newUserAlert: v })}
                  />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Rapport journalier</p>
                    <p className="text-sm text-muted-foreground">
                      Recevoir un résumé quotidien des activités
                    </p>
                  </div>
                  <Switch
                    checked={notifications.dailyReport}
                    onCheckedChange={(v) => setNotifications({ ...notifications, dailyReport: v })}
                  />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Rapport hebdomadaire</p>
                    <p className="text-sm text-muted-foreground">
                      Recevoir un résumé hebdomadaire des activités
                    </p>
                  </div>
                  <Switch
                    checked={notifications.weeklyReport}
                    onCheckedChange={(v) => setNotifications({ ...notifications, weeklyReport: v })}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Emails de notification (global)</Label>
                  <Textarea
                    value={notificationEmails}
                    onChange={(e) => setNotificationEmails(e.target.value)}
                    placeholder="email1@dcat.ci\nemail2@dcat.ci"
                    rows={6}
                    disabled={configLoading || configAccessDenied}
                  />
                  <p className="text-xs text-muted-foreground">Un email par ligne (ou séparé par virgule)</p>
                </div>

                <div className="space-y-2">
                  <Label>Emails - Alerte stock faible</Label>
                  <Textarea
                    value={notificationLists.low_stock_alert || ''}
                    onChange={(e) => setNotificationLists({ ...notificationLists, low_stock_alert: e.target.value })}
                    placeholder="email1@dcat.ci\nemail2@dcat.ci"
                    rows={6}
                    disabled={configLoading || configAccessDenied}
                  />
                  <p className="text-xs text-muted-foreground">Vide = désactiver cet événement (ignore le global)</p>
                </div>

                <div className="space-y-2">
                  <Label>Emails - Nouvel utilisateur</Label>
                  <Textarea
                    value={notificationLists.new_user_alert || ''}
                    onChange={(e) => setNotificationLists({ ...notificationLists, new_user_alert: e.target.value })}
                    placeholder="email@dcat.ci"
                    rows={6}
                    disabled={configLoading || configAccessDenied}
                  />
                  <p className="text-xs text-muted-foreground">Vide = désactiver cet événement (ignore le global)</p>
                </div>

                <div className="space-y-2">
                  <Label>Emails - Rapport journalier</Label>
                  <Textarea
                    value={notificationLists.daily_report || ''}
                    onChange={(e) => setNotificationLists({ ...notificationLists, daily_report: e.target.value })}
                    placeholder="email@dcat.ci"
                    rows={6}
                    disabled={configLoading || configAccessDenied}
                  />
                  <p className="text-xs text-muted-foreground">Vide = désactiver cet événement (ignore le global)</p>
                </div>

                <div className="space-y-2">
                  <Label>Emails - Rapport hebdomadaire</Label>
                  <Textarea
                    value={notificationLists.weekly_report || ''}
                    onChange={(e) => setNotificationLists({ ...notificationLists, weekly_report: e.target.value })}
                    placeholder="email@dcat.ci"
                    rows={6}
                    disabled={configLoading || configAccessDenied}
                  />
                  <p className="text-xs text-muted-foreground">Vide = désactiver cet événement (ignore le global)</p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveNotifications} disabled={saving || configLoading || configAccessDenied}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Configuration Email (SMTP)
              </CardTitle>
              <CardDescription>
                Paramètres du serveur de messagerie pour les notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {configAccessDenied && (
                <div className="p-4 border rounded-lg bg-muted/30 text-sm text-muted-foreground">
                  Seuls les administrateurs peuvent configurer le SMTP.
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="smtpHost">Serveur SMTP</Label>
                  <Input
                    id="smtpHost"
                    value={emailSettings.smtpHost}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpHost: e.target.value })}
                    placeholder="smtp.example.com"
                    disabled={configLoading || configAccessDenied}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPort">Port</Label>
                  <Input
                    id="smtpPort"
                    value={emailSettings.smtpPort}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpPort: e.target.value })}
                    placeholder="587"
                    disabled={configLoading || configAccessDenied}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpUser">Utilisateur SMTP</Label>
                  <Input
                    id="smtpUser"
                    value={emailSettings.smtpUser}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpUser: e.target.value })}
                    placeholder="user@example.com"
                    disabled={configLoading || configAccessDenied}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPassword">Mot de passe SMTP</Label>
                  <Input
                    id="smtpPassword"
                    type="password"
                    value={emailSettings.smtpPassword}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpPassword: e.target.value })}
                    placeholder="••••••••"
                    disabled={configLoading || configAccessDenied}
                  />
                  <p className="text-xs text-muted-foreground">Laissez vide pour conserver le mot de passe existant</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="senderEmail">Email expéditeur</Label>
                  <Input
                    id="senderEmail"
                    type="email"
                    value={emailSettings.senderEmail}
                    onChange={(e) => setEmailSettings({ ...emailSettings, senderEmail: e.target.value })}
                    placeholder="noreply@example.com"
                    disabled={configLoading || configAccessDenied}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="senderName">Nom expéditeur</Label>
                  <Input
                    id="senderName"
                    value={emailSettings.senderName}
                    onChange={(e) => setEmailSettings({ ...emailSettings, senderName: e.target.value })}
                    placeholder="DCAT System"
                    disabled={configLoading || configAccessDenied}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Connexion sécurisée (SSL/TLS)</p>
                  <p className="text-sm text-muted-foreground">Active généralement sur le port 465</p>
                </div>
                <Switch
                  checked={emailSettings.smtpSecure}
                  onCheckedChange={(v) => setEmailSettings({ ...emailSettings, smtpSecure: v })}
                  disabled={configLoading || configAccessDenied}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleTestConnection} disabled={testing || configLoading || configAccessDenied}>
                  {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Tester la connexion
                </Button>
                <Button onClick={handleSaveEmail} disabled={saving || configLoading || configAccessDenied}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Informations système
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Version</p>
              <p className="font-medium">1.0.0</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Environnement</p>
              <p className="font-medium">Production</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Base de données</p>
              <p className="font-medium">PostgreSQL</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Framework</p>
              <p className="font-medium">Next.js 15</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
