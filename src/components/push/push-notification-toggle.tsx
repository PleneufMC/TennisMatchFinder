'use client';

import { Bell, BellOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePushNotifications } from '@/hooks/use-push-notifications';

interface PushNotificationToggleProps {
  variant?: 'switch' | 'button' | 'card';
  showStatus?: boolean;
  className?: string;
}

export function PushNotificationToggle({
  variant = 'switch',
  showStatus = true,
  className = '',
}: PushNotificationToggleProps) {
  const {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    error,
    subscribe,
    unsubscribe,
  } = usePushNotifications();

  const handleToggle = async () => {
    if (isSubscribed) {
      const success = await unsubscribe();
      if (success) {
        toast.success('Notifications désactivées');
      } else {
        toast.error('Erreur lors de la désactivation');
      }
    } else {
      const success = await subscribe();
      if (success) {
        toast.success('Notifications activées ! 🔔');
      } else if (permission === 'denied') {
        toast.error('Autorisez les notifications dans les paramètres de votre navigateur');
      }
    }
  };

  // Not supported
  if (!isSupported) {
    if (!showStatus) return null;
    return (
      <Alert variant="default" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Les notifications push ne sont pas supportées par votre navigateur.
        </AlertDescription>
      </Alert>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Chargement...</span>
      </div>
    );
  }

  // Error state
  if (error && showStatus) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // Button variant
  if (variant === 'button') {
    return (
      <Button
        variant={isSubscribed ? 'outline' : 'default'}
        onClick={handleToggle}
        disabled={isLoading}
        className={className}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : isSubscribed ? (
          <BellOff className="h-4 w-4 mr-2" />
        ) : (
          <Bell className="h-4 w-4 mr-2" />
        )}
        {isSubscribed ? 'Désactiver les notifications' : 'Activer les notifications'}
      </Button>
    );
  }

  // Card variant
  if (variant === 'card') {
    return (
      <div className={`rounded-lg border p-4 ${className}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-full ${isSubscribed ? 'bg-green-100 dark:bg-green-900/30' : 'bg-muted'}`}>
              {isSubscribed ? (
                <Bell className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <BellOff className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <h3 className="font-medium">Notifications push</h3>
              <p className="text-sm text-muted-foreground">
                {isSubscribed
                  ? 'Vous recevez des notifications pour les matchs, messages et événements.'
                  : 'Activez pour être notifié des nouveaux matchs, messages et événements.'}
              </p>
              {permission === 'denied' && (
                <p className="text-sm text-destructive mt-1">
                  ⚠️ Les notifications sont bloquées. Modifiez les paramètres de votre navigateur.
                </p>
              )}
            </div>
          </div>
          <Switch
            checked={isSubscribed}
            onCheckedChange={handleToggle}
            disabled={isLoading || permission === 'denied'}
          />
        </div>
      </div>
    );
  }

  // Default switch variant
  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      <div className="flex items-center gap-2">
        {isSubscribed ? (
          <Bell className="h-4 w-4 text-green-600" />
        ) : (
          <BellOff className="h-4 w-4 text-muted-foreground" />
        )}
        <Label htmlFor="push-notifications" className="cursor-pointer">
          Notifications push
        </Label>
        {isSubscribed && showStatus && (
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        )}
      </div>
      <Switch
        id="push-notifications"
        checked={isSubscribed}
        onCheckedChange={handleToggle}
        disabled={isLoading || permission === 'denied'}
      />
    </div>
  );
}

// Compact notification prompt for first-time setup
export function PushNotificationPrompt({ onDismiss }: { onDismiss?: () => void }) {
  const { isSupported, isSubscribed, isLoading, subscribe } = usePushNotifications();

  // Don't show if not supported, already subscribed, or loading
  if (!isSupported || isSubscribed || isLoading) {
    return null;
  }

  const handleEnable = async () => {
    const success = await subscribe();
    if (success) {
      toast.success('Notifications activées ! 🔔');
      onDismiss?.();
    }
  };

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-full shrink-0">
          <Bell className="h-5 w-5 text-green-600 dark:text-green-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-green-900 dark:text-green-100">
            Restez informé !
          </h3>
          <p className="text-sm text-green-700 dark:text-green-300 mt-1">
            Activez les notifications pour être alerté des nouveaux matchs, messages et défis.
          </p>
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              onClick={handleEnable}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Bell className="h-4 w-4 mr-2" />
              )}
              Activer
            </Button>
            {onDismiss && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onDismiss}
                className="text-green-700 hover:text-green-800 hover:bg-green-100"
              >
                Plus tard
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
