'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  Mail, User, MapPin, Copy, CheckCircle, XCircle, 
  Clock, Download, Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface SignupAttempt {
  id: string;
  email: string | null;
  fullName: string | null;
  city: string | null;
  selfAssessedLevel: string | null;
  lastStepReached: number;
  lastStepName: string | null;
  status: string;
  source: string | null;
  utmSource: string | null;
  utmCampaign: string | null;
  timeSpentSeconds: number | null;
  createdAt: Date;
  updatedAt: Date;
}

interface SignupAttemptsTableProps {
  attempts: SignupAttempt[];
}

const STEP_NAMES: Record<number, string> = {
  1: 'Nom',
  2: 'Email',
  3: 'Ville',
  4: 'Niveau',
  5: 'Club',
  6: 'Submit',
};

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  started: { label: 'Démarré', variant: 'outline' },
  in_progress: { label: 'En cours', variant: 'secondary' },
  abandoned: { label: 'Abandonné', variant: 'destructive' },
  completed: { label: 'Converti', variant: 'default' },
};

export function SignupAttemptsTable({ attempts }: SignupAttemptsTableProps) {
  const [filter, setFilter] = useState<string>('all');
  const [copied, setCopied] = useState(false);

  // Filtrer les tentatives
  const filteredAttempts = attempts.filter(attempt => {
    if (filter === 'all') return true;
    if (filter === 'with_email') return !!attempt.email;
    if (filter === 'abandoned_with_email') return attempt.status === 'abandoned' && !!attempt.email;
    return attempt.status === filter;
  });

  // Exporter les emails pour relance
  const exportEmails = () => {
    const emails = filteredAttempts
      .filter(a => a.email && a.status === 'abandoned')
      .map(a => a.email)
      .filter((email, index, self) => self.indexOf(email) === index); // Unique

    if (emails.length === 0) {
      toast.error('Aucun email à exporter');
      return;
    }

    const csvContent = 'email,fullName,city,lastStep,createdAt\n' + 
      filteredAttempts
        .filter(a => a.email && a.status === 'abandoned')
        .map(a => `${a.email},${a.fullName || ''},${a.city || ''},${a.lastStepReached},${format(new Date(a.createdAt), 'yyyy-MM-dd')}`)
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `abandons-inscription-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();

    toast.success(`${emails.length} emails exportés`);
  };

  // Copier les emails dans le presse-papier
  const copyEmails = async () => {
    const emails = filteredAttempts
      .filter(a => a.email && a.status === 'abandoned')
      .map(a => a.email)
      .filter((email, index, self) => self.indexOf(email) === index)
      .join(', ');

    if (!emails) {
      toast.error('Aucun email à copier');
      return;
    }

    await navigator.clipboard.writeText(emails);
    setCopied(true);
    toast.success('Emails copiés dans le presse-papier');
    setTimeout(() => setCopied(false), 2000);
  };

  const abandonedWithEmailCount = attempts.filter(a => a.status === 'abandoned' && a.email).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrer..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous ({attempts.length})</SelectItem>
              <SelectItem value="abandoned_with_email">
                Abandons avec email ({abandonedWithEmailCount})
              </SelectItem>
              <SelectItem value="abandoned">Abandonnés</SelectItem>
              <SelectItem value="in_progress">En cours</SelectItem>
              <SelectItem value="completed">Convertis</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copyEmails}>
            {copied ? <CheckCircle className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            Copier emails
          </Button>
          <Button variant="default" size="sm" onClick={exportEmails}>
            <Download className="h-4 w-4 mr-2" />
            Exporter CSV
          </Button>
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Ville</TableHead>
              <TableHead>Étape</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAttempts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Aucune tentative trouvée
                </TableCell>
              </TableRow>
            ) : (
              filteredAttempts.map((attempt) => (
                <TableRow key={attempt.id}>
                  <TableCell>
                    {attempt.email ? (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono text-sm">{attempt.email}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Non renseigné</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {attempt.fullName ? (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{attempt.fullName}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {attempt.city ? (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{attempt.city}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5, 6].map((step) => (
                          <div
                            key={step}
                            className={`w-2 h-2 rounded-full ${
                              step <= attempt.lastStepReached
                                ? 'bg-primary'
                                : 'bg-muted'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {STEP_NAMES[attempt.lastStepReached] || attempt.lastStepName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_CONFIG[attempt.status]?.variant || 'outline'}>
                      {STATUS_CONFIG[attempt.status]?.label || attempt.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {attempt.source || attempt.utmSource ? (
                      <span className="text-sm">
                        {attempt.utmSource || attempt.source}
                        {attempt.utmCampaign && (
                          <span className="text-muted-foreground"> / {attempt.utmCampaign}</span>
                        )}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">Direct</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {format(new Date(attempt.createdAt), 'dd MMM HH:mm', { locale: fr })}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        Affichage de {filteredAttempts.length} tentative(s) sur {attempts.length}
      </div>
    </div>
  );
}
