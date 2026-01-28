'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ClubExportButtonProps {
  clubId: string;
}

export function ClubExportButton({ clubId }: ClubExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const response = await fetch(`/api/clubs/${clubId}/members/export`);
      
      if (!response.ok) {
        throw new Error('Erreur lors de l\'export');
      }

      // Récupérer le nom du fichier depuis les headers
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] ?? 'membres-export.csv';

      // Créer le blob et télécharger
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Export réussi', {
        description: `Fichier ${filename} téléchargé`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erreur lors de l\'export', {
        description: 'Veuillez réessayer',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleExport}
      disabled={isExporting}
    >
      {isExporting ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Export en cours...
        </>
      ) : (
        <>
          <Download className="h-4 w-4 mr-2" />
          Exporter CSV
        </>
      )}
    </Button>
  );
}
