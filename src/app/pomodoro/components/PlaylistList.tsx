'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/ui/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface Playlist {
  playlist_id: string;
  playlist_name: string;
  created_at: string;
}

export function PlaylistList() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session } = useSession();
  const { toast } = useToast();

  const fetchPlaylists = async () => {
    if (!session?.user) return;

    try {
      const response = await fetch('/api/youtube-playlists');
      if (!response.ok) throw new Error('Failed to fetch playlists');
      const data = await response.json();
      setPlaylists(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load playlists",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deletePlaylist = async (playlistId: string) => {
    if (!session?.user) return;

    try {
      const response = await fetch(`/api/youtube-playlists/${playlistId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete playlist');

      toast({
        title: "Success",
        description: "Playlist deleted successfully",
      });

      // Refresh playlists
      fetchPlaylists();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete playlist",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchPlaylists();
  }, [session]);

  if (!session?.user) {
    return (
      <div className="text-center py-4 text-gray-500">
        Please sign in to view your playlists
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-4">
        Loading playlists...
      </div>
    );
  }

  if (playlists.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        No playlists found. Create one to get started!
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Created At</TableHead>
          <TableHead className="w-[100px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {playlists.map((playlist) => (
          <TableRow key={playlist.playlist_id}>
            <TableCell>{playlist.playlist_name}</TableCell>
            <TableCell>
              {new Date(playlist.created_at).toLocaleDateString()}
            </TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deletePlaylist(playlist.playlist_id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
} 