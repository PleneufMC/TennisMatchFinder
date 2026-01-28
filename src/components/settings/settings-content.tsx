'use client';

import { Settings, Bell, Shield, Palette, Globe, Smartphone } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { LocationSettings } from '@/components/profile/location-settings';
import { PasskeyManager } from '@/components/auth/passkey-manager';
import { LanguageSwitcher } from '@/components/language-switcher';
import { PushNotificationToggle } from '@/components/push';
import { WhatsAppSettings } from '@/components/settings/whatsapp-settings';
import { DeleteAccountSection } from '@/components/settings/delete-account-section';
import { useTranslations } from '@/lib/i18n';

interface SettingsContentProps {
  userEmail: string;
}

export function SettingsContent({ userEmail }: SettingsContentProps) {
  const { t, locale } = useTranslations('settings');
  const { t: tCommon } = useTranslations('common');

  const languageLabel = locale === 'fr' ? 'Français 🇫🇷' : 'English 🇬🇧';
  const dateFormatLabel = locale === 'fr' ? 'JJ/MM/AAAA' : 'MM/DD/YYYY';

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          {t('title')}
        </h1>
        <p className="text-muted-foreground">
          {t('description')}
        </p>
      </div>

      <div className="grid gap-6">
        {/* Notifications Push */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              {locale === 'fr' ? 'Notifications Push' : 'Push Notifications'}
            </CardTitle>
            <CardDescription>
              {locale === 'fr' 
                ? 'Recevez des notifications même quand l\'application n\'est pas ouverte'
                : 'Receive notifications even when the app is not open'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PushNotificationToggle variant="card" />
          </CardContent>
        </Card>

        {/* Notifications WhatsApp */}
        <WhatsAppSettings />

        {/* Notifications Email */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              {t('notifications.title')}
            </CardTitle>
            <CardDescription>
              {t('notifications.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('notifications.email')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('notifications.emailDesc')}
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('notifications.matchProposals')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('notifications.matchProposalsDesc')}
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('notifications.chatMessages')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('notifications.chatMessagesDesc')}
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('notifications.matchResults')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('notifications.matchResultsDesc')}
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Passkeys / Connexion biométrique */}
        <PasskeyManager />

        {/* Confidentialité */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t('privacy.title')}
            </CardTitle>
            <CardDescription>
              {t('privacy.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('privacy.profileVisible')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('privacy.profileVisibleDesc')}
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('privacy.showElo')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('privacy.showEloDesc')}
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('privacy.publicHistory')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('privacy.publicHistoryDesc')}
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Géolocalisation */}
        <LocationSettings />

        {/* Apparence */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              {t('appearance.title')}
            </CardTitle>
            <CardDescription>
              {t('appearance.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('appearance.theme')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('appearance.themeDesc')}
                </p>
              </div>
              <Badge variant="secondary">{t('appearance.automatic')}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Langue */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {t('language.title')}
            </CardTitle>
            <CardDescription>
              {t('language.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('language.language')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('language.languageDesc')}
                </p>
              </div>
              <LanguageSwitcher />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('language.dateFormat')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('language.dateFormatDesc')}
                </p>
              </div>
              <Badge variant="secondary">{dateFormatLabel}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Zone dangereuse - Suppression de compte RGPD */}
        <DeleteAccountSection userEmail={userEmail} />
      </div>

      {/* Note */}
      <p className="text-sm text-muted-foreground text-center">
        💡 {locale === 'fr' 
          ? 'Les modifications sont enregistrées automatiquement. Certaines fonctionnalités sont en cours de développement.'
          : 'Changes are saved automatically. Some features are under development.'}
      </p>
    </div>
  );
}
