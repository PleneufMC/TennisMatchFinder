'use client';

import { useState, useEffect } from 'react';
import { MapPin, Loader2, Check, X, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface LocationData {
  hasLocation: boolean;
  latitude: string | null;
  longitude: string | null;
  city: string | null;
}

export function LocationSettings() {
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Charger la position actuelle
  useEffect(() => {
    fetchLocation();
  }, []);

  const fetchLocation = async () => {
    try {
      const response = await fetch('/api/player/location');
      if (response.ok) {
        const data = await response.json();
        setLocationData(data);
      }
    } catch (err) {
      console.error('Error fetching location:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateLocation = async () => {
    setIsUpdating(true);
    setError(null);
    setSuccess(null);

    if (!navigator.geolocation) {
      setError('La géolocalisation n\'est pas supportée par votre navigateur');
      setIsUpdating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Optionnel : obtenir le nom de la ville via une API de reverse geocoding
          let city = null;
          try {
            const geoResponse = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`
            );
            if (geoResponse.ok) {
              const geoData = await geoResponse.json();
              city = geoData.address?.city || 
                     geoData.address?.town || 
                     geoData.address?.village ||
                     geoData.address?.municipality;
            }
          } catch (geoError) {
            console.error('Error fetching city name:', geoError);
          }

          const response = await fetch('/api/player/location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ latitude, longitude, city }),
          });

          if (response.ok) {
            setSuccess('Position mise à jour avec succès !');
            await fetchLocation();
          } else {
            const data = await response.json();
            setError(data.error || 'Erreur lors de la mise à jour');
          }
        } catch (err) {
          setError('Erreur lors de la mise à jour de la position');
        } finally {
          setIsUpdating(false);
        }
      },
      (err) => {
        setIsUpdating(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('Vous avez refusé l\'accès à votre position. Autorisez l\'accès dans les paramètres de votre navigateur.');
            break;
          case err.POSITION_UNAVAILABLE:
            setError('Position indisponible. Vérifiez que le GPS est activé.');
            break;
          case err.TIMEOUT:
            setError('Délai d\'attente dépassé. Réessayez.');
            break;
          default:
            setError('Erreur inconnue lors de la récupération de la position');
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const deleteLocation = async () => {
    setIsUpdating(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/player/location', {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccess('Position supprimée');
        setLocationData({
          hasLocation: false,
          latitude: null,
          longitude: null,
          city: null,
        });
      } else {
        const data = await response.json();
        setError(data.error || 'Erreur lors de la suppression');
      }
    } catch (err) {
      setError('Erreur lors de la suppression de la position');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Géolocalisation
        </CardTitle>
        <CardDescription>
          Activez la géolocalisation pour trouver des partenaires autour de vous avec Match Now
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-900/20">
            <Check className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        {locationData?.hasLocation ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                <Check className="w-3 h-3 mr-1" />
                Géolocalisation activée
              </Badge>
            </div>
            
            {locationData.city && (
              <p className="text-sm text-muted-foreground">
                Position enregistrée : <span className="font-medium text-foreground">{locationData.city}</span>
              </p>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={updateLocation}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <MapPin className="w-4 h-4 mr-2" />
                )}
                Mettre à jour ma position
              </Button>
              <Button
                variant="outline"
                className="text-red-600 hover:text-red-700"
                onClick={deleteLocation}
                disabled={isUpdating}
              >
                <X className="w-4 h-4 mr-2" />
                Désactiver
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              La géolocalisation vous permet de trouver des partenaires de tennis 
              autour de votre position, même s&apos;ils ne sont pas dans votre club.
            </p>
            
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Note :</strong> Votre position exacte n&apos;est jamais partagée. 
                Seule la distance approximative avec d&apos;autres joueurs est calculée.
              </p>
            </div>

            <Button onClick={updateLocation} disabled={isUpdating}>
              {isUpdating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <MapPin className="w-4 h-4 mr-2" />
              )}
              Activer la géolocalisation
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
