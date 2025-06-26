'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, List, History, Heart, Trash2, Plus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreatePlaylistModal } from './CreatePlaylistModal';
import YouTube from 'react-youtube';

interface Playlist {
  playlist_id: string;
  playlist_name: string;
  created_at: string;
  updated_at: string;
}

interface PlaylistItem {
  item_id: string;
  playlist_id: string;
  youtube_url: string;
  added_at: string;
}

interface YouTubePlayerProps {
  videoUrl: string;
  onVideoEnd?: () => void;
}

export function YouTubePlayer({ videoUrl, onVideoEnd }: YouTubePlayerProps) {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [videoId, setVideoId] = useState('');
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isLarge, setIsLarge] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [playlistItems, setPlaylistItems] = useState<PlaylistItem[]>([]);
  const [currentPlaylistId, setCurrentPlaylistId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPlaylists = useCallback(async () => {
    if (!session?.user) return;
    
    try {
      const response = await fetch('/api/youtube-playlists');
      if (!response.ok) throw new Error('Failed to fetch playlists');
      const data = await response.json();
      setPlaylists(data);
    } catch (error) {
      console.error('Error fetching playlists:', error);
    }
  }, [session?.user]);

  useEffect(() => {
    fetchPlaylists();
  }, [fetchPlaylists]);

  useEffect(() => {
    if (currentPlaylistId) {
      fetchPlaylistItems(currentPlaylistId);
    }
  }, [currentPlaylistId]);

  const fetchPlaylistItems = async (playlistId: string) => {
    try {
      const response = await fetch(`/api/youtube-playlist/items?playlist_id=${playlistId}`);
      if (!response.ok) throw new Error('Failed to fetch playlist items');
      const data = await response.json();
      setPlaylistItems(data);
    } catch (error) {
      console.error('Error fetching playlist items:', error);
      toast({
        title: "Error",
        description: "Failed to load playlist items",
        variant: "destructive",
      });
    }
  };

  const addToPlaylist = async (playlistId: string) => {
    if (!session?.user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to add videos to playlists",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/youtube-playlist/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playlist_id: playlistId,
          youtube_url: videoUrl,
        }),
      });

      if (!response.ok) throw new Error('Failed to add video to playlist');

      toast({
        title: "Success",
        description: "Video added to playlist successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add video to playlist",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadPlaylist = async (playlistId: string) => {
    setCurrentPlaylistId(playlistId);
    await fetchPlaylistItems(playlistId);
  };

  const handleSearch = () => {
    if (!searchQuery) return;

    // Extract video ID from URL or search query
    let id = '';
    if (searchQuery.includes('youtube.com') || searchQuery.includes('youtu.be')) {
      const url = new URL(searchQuery);
      if (searchQuery.includes('youtube.com')) {
        id = url.searchParams.get('v') || '';
      } else {
        id = url.pathname.slice(1);
      }
    } else {
      id = searchQuery;
    }

    if (id) {
      setVideoId(id);
      // If we have a current playlist, offer to add to it
      if (currentPlaylistId) {
        addToPlaylist(currentPlaylistId);
      }
    }
  };

  const togglePlay = () => setIsPlaying(!isPlaying);
  const toggleMute = () => setIsMuted(!isMuted);

  const extractVideoId = (url: string) => {
    const match = url.match(/[?&]v=([^&]+)/);
    return match ? match[1] : url;
  };

  if (status === "loading") {
    return <div className="flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>;
  }

  return (
    <div className={`space-y-4 ${isLarge ? 'fixed inset-4 z-50 bg-slate-800/95 backdrop-blur-xl rounded-lg p-6 border border-slate-700/50' : ''}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-blue-400">
          Background Music
        </h3>
        <div className="flex items-center gap-2">
          {/* Create Playlist Button - Only show when authenticated */}
          {session && <CreatePlaylistModal onPlaylistCreated={fetchPlaylists} />}

          {/* Recent Playlists Dropdown - Only show when authenticated and has playlists */}
          {session && playlists.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-slate-700/50 text-slate-300"
                >
                  <History className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 bg-slate-800 border-slate-700">
                <DropdownMenuLabel className="text-slate-300">Your Playlists</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-700" />
                {playlists.map((playlist) => (
                  <DropdownMenuItem
                    key={playlist.playlist_id}
                    className="text-slate-300 hover:bg-slate-700/50 cursor-pointer"
                    onClick={() => loadPlaylist(playlist.playlist_id)}
                  >
                    <List className="h-4 w-4 mr-2" />
                    <span className="truncate">{playlist.playlist_name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Maximize/Minimize Button */}
          {videoId && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsLarge(!isLarge)}
              className="hover:bg-slate-700/50 text-slate-300"
            >
              {isLarge ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Paste YouTube URL or search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1 bg-slate-900/50 border-slate-700 text-slate-300 placeholder-slate-500"
        />
        <Button 
          onClick={handleSearch} 
          size="icon"
          className="bg-slate-800/50 border border-slate-700 hover:bg-slate-700/50 text-slate-300"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {videoId && (
        <>
          <div className={`relative ${isLarge ? 'h-[calc(100%-12rem)]' : 'pt-[56.25%]'} w-full rounded-lg overflow-hidden border border-slate-700/50 bg-slate-900/50`}>
            <YouTube
              videoId={extractVideoId(videoUrl)}
              opts={{
                height: '100%',
                width: '100%',
                playerVars: {
                  autoplay: 1,
                  controls: 1,
                  rel: 0,
                },
              }}
              onEnd={onVideoEnd}
              className="absolute top-0 left-0 w-full h-full"
            />
          </div>

          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={togglePlay}
              className="w-10 h-10 bg-slate-800/50 border-slate-700 hover:bg-slate-700/50 text-slate-300"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleMute}
              className="w-10 h-10 bg-slate-800/50 border-slate-700 hover:bg-slate-700/50 text-slate-300"
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            {/* Add to Playlist Button - Only show when authenticated */}
            {session && !currentPlaylistId && playlists.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-10 h-10 bg-slate-800/50 border-slate-700 hover:bg-slate-700/50 text-slate-300"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48 bg-slate-800 border-slate-700">
                  <DropdownMenuLabel className="text-slate-300">Add to Playlist</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-slate-700" />
                  {playlists.map((playlist) => (
                    <DropdownMenuItem
                      key={playlist.playlist_id}
                      className="text-slate-300 hover:bg-slate-700/50 cursor-pointer"
                      onClick={() => addToPlaylist(playlist.playlist_id)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      <span className="truncate">{playlist.playlist_name}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </>
      )}

      {/* Playlist Items */}
      {currentPlaylistId && playlistItems.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-slate-400">
              {playlists.find(p => p.playlist_id === currentPlaylistId)?.playlist_name || 'Playlist Items'}
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPlaylistId(null)}
              className="text-slate-400 hover:text-slate-300"
            >
              Close Playlist
            </Button>
          </div>
          <div className="space-y-1">
            {playlistItems.map((item) => (
              <div
                key={item.item_id}
                className="flex items-center justify-between p-2 rounded-md bg-slate-800/50 border border-slate-700/50"
              >
                <Button
                  variant="ghost"
                  className="flex-1 justify-start text-left text-slate-300 hover:bg-slate-700/50"
                  onClick={() => {
                    const videoId = new URL(item.youtube_url).searchParams.get('v');
                    if (videoId) setVideoId(videoId);
                  }}
                >
                  <List className="h-4 w-4 mr-2" />
                  <span className="truncate">
                    {new URL(item.youtube_url).searchParams.get('v')}
                  </span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-slate-700/50 text-red-400"
                  onClick={async () => {
                    try {
                      const response = await fetch(`/api/youtube-playlist/items/${item.item_id}`, {
                        method: 'DELETE',
                      });
                      if (!response.ok) throw new Error('Failed to delete item');
                      fetchPlaylistItems(currentPlaylistId);
                      toast({
                        title: "Success",
                        description: "Item removed from playlist",
                      });
                    } catch (error) {
                      toast({
                        title: "Error",
                        description: "Failed to remove item",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {!videoId && (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center">
            <Search className="h-6 w-6 text-slate-400" />
          </div>
          <p className="text-slate-400 text-center">
            Paste a YouTube URL or search for music<br />
            to enhance your focus session
          </p>
        </div>
      )}

      {/* Not authenticated message */}
      {!session && (
        <div className="text-center p-4 text-slate-400">
          <p>Please sign in to create and manage playlists</p>
        </div>
      )}
    </div>
  );
} 