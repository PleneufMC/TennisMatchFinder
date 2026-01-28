'use client';

import { useState } from 'react';
import { MoreHorizontal, Ban, Flag, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { BlockPlayerDialog } from './block-player-dialog';
import { ReportPlayerDialog } from './report-player-dialog';

interface PlayerActionsMenuProps {
  playerId: string;
  playerName: string;
}

export function PlayerActionsMenu({ playerId, playerName }: PlayerActionsMenuProps) {
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem 
            onClick={() => setShowBlockDialog(true)}
            className="text-destructive focus:text-destructive"
          >
            <Ban className="h-4 w-4 mr-2" />
            Bloquer
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => setShowReportDialog(true)}
            className="text-orange-600 focus:text-orange-600"
          >
            <Flag className="h-4 w-4 mr-2" />
            Signaler
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <BlockPlayerDialog
        open={showBlockDialog}
        onOpenChange={setShowBlockDialog}
        playerId={playerId}
        playerName={playerName}
      />

      <ReportPlayerDialog
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
        playerId={playerId}
        playerName={playerName}
      />
    </>
  );
}
