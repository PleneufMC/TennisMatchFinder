'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Loader2, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function CreateClubDialog() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    contactEmail: '',
    websiteUrl: '',
    address: '',
  });

  // Générer automatiquement le slug à partir du nom
  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
      .replace(/[^a-z0-9]+/g, '-') // Remplacer les caractères spéciaux par des tirets
      .replace(/^-+|-+$/g, ''); // Supprimer les tirets au début et à la fin
    
    setFormData(prev => ({ ...prev, name, slug }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/clubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la création');
      }

      const data = await response.json();
      toast.success('Club créé !', {
        description: `Le club "${data.club.name}" a été créé avec succès.`,
      });
      
      setIsOpen(false);
      setFormData({
        name: '',
        slug: '',
        description: '',
        contactEmail: '',
        websiteUrl: '',
        address: '',
      });
      router.refresh();
    } catch (error) {
      toast.error('Erreur', {
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau club
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Créer un nouveau club
          </DialogTitle>
          <DialogDescription>
            Remplissez les informations du club. Le slug sera utilisé pour l&apos;URL d&apos;inscription.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom du club *</Label>
            <Input
              id="name"
              placeholder="Ex: Tennis Club de Paris"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug (URL) *</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">/join/</span>
              <Input
                id="slug"
                placeholder="tennis-club-paris"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') 
                }))}
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Lettres minuscules, chiffres et tirets uniquement
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Description du club..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Email de contact</Label>
              <Input
                id="contactEmail"
                type="email"
                placeholder="contact@club.fr"
                value={formData.contactEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="websiteUrl">Site web</Label>
              <Input
                id="websiteUrl"
                type="url"
                placeholder="https://..."
                value={formData.websiteUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, websiteUrl: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Adresse</Label>
            <Input
              id="address"
              placeholder="Adresse du club"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading || !formData.name || !formData.slug}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer le club
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
