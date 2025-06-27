'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, Plus, Trash2, List, BookmarkPlus, Repeat, SkipBack, SkipForward, Music2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAuth } from '../../context/AuthContext';

export default function YouTubePlayer() {
  const [searchQuery, setSearchQuery] = useState('');
  const [videoId, setVideoId] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLarge, setIsLarge] = useState(false);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const { user } = useAuth();
  const [playlistItems, setPlaylistItems] = useState<any[]>([]);
  const [currentPlaylistId, setCurrentPlaylistId] = useState('');
  const [currentSong, setCurrentSong] = useState<any>(null);
  const [autoPlay, setAutoPlay] = useState(true);
  const [repeat, setRepeat] = useState(false);

  const extractVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const handleSearch = () => {
    const id = extractVideoId(searchQuery);
    if (id) {
      setVideoId(id);
      setIsPlaying(true);
    } else {
      // If not a direct URL, use as search query
      window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`, '_blank');
    }
  };

  const togglePlay = () => {
    const iframe = document.querySelector<HTMLIFrameElement>('iframe');
    if (iframe) {
      if (isPlaying) {
        iframe.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
      } else {
        iframe.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    const iframe = document.querySelector<HTMLIFrameElement>('iframe');
    if (iframe) {
      if (isMuted) {
        iframe.contentWindow?.postMessage('{"event":"command","func":"unMute","args":""}', '*');
      } else {
        iframe.contentWindow?.postMessage('{"event":"command","func":"mute","args":""}', '*');
      }
      setIsMuted(!isMuted);
    }
  };

  // Fetch playlists from API
  const fetchPlaylists = () => {
    if (!user?.email) return;
    fetch(`/api/youtubePlaylists?createdBy=${encodeURIComponent(user.email)}`)
      .then(res => res.json())
      .then(data => setPlaylists(data.playlists || []));
  };

  useEffect(() => {
    fetchPlaylists();
  }, [showPlaylistModal, user?.email]);

  // Create playlist
  const handleCreatePlaylist = async () => {
    setLoading(true);
    const res = await fetch('/api/youtubePlaylists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newPlaylistName, description: newPlaylistDesc, createdBy: user?.email || '' })
    });
    setLoading(false);
    setShowCreateModal(false);
    setNewPlaylistName('');
    setNewPlaylistDesc('');
    if (res.ok) fetchPlaylists();
  };

  // Delete playlist
  const handleDeletePlaylist = async (id: string) => {
    if (!confirm('Xoá playlist này?')) return;
    setLoading(true);
    await fetch(`/api/youtubePlaylists?id=${id}`, { method: 'DELETE' });
    setLoading(false);
    fetchPlaylists();
  };

  // Add to playlist
  const handleAddToPlaylist = async () => {
    if (!selectedPlaylist || !videoId) return;
    setAddLoading(true);
    const youtube_url = `https://www.youtube.com/watch?v=${videoId}`;
    await fetch('/api/youtubePlaylistItems', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playlist_id: selectedPlaylist, youtube_url, title: '' })
    });
    setAddLoading(false);
    setShowAddToPlaylist(false);
  };

  // Fetch songs in playlist
  const fetchPlaylistItems = async (playlistId: string) => {
    if (!playlistId) return setPlaylistItems([]);
    const res = await fetch(`/api/youtubePlaylistItems?playlist_id=${playlistId}`);
    const data = await res.json();
    setPlaylistItems(data.items || []);
  };

  // Khi chọn playlist mới
  useEffect(() => {
    if (currentPlaylistId) {
      fetchPlaylistItems(currentPlaylistId);
    } else {
      setPlaylistItems([]);
    }
  }, [currentPlaylistId]);

  // Khi chọn bài hát mới
  useEffect(() => {
    if (currentSong && currentSong.youtube_url) {
      setVideoId(extractVideoId(currentSong.youtube_url) || "");
    }
  }, [currentSong]);

  // Auto play & repeat logic
  useEffect(() => {
    if (!autoPlay) return;
    // Lắng nghe khi videoId thay đổi, nếu autoPlay thì play luôn
    setIsPlaying(true);
  }, [videoId]);

  // Khi video kết thúc, tự động chuyển bài hoặc lặp lại
  useEffect(() => {
    if (!autoPlay && !repeat) return;
    const onEnd = (e: any) => {
      if (repeat && currentSong) {
        setVideoId(extractVideoId(currentSong.youtube_url) || "");
        setIsPlaying(true);
      } else if (autoPlay && playlistItems.length > 0 && currentSong) {
        const idx = playlistItems.findIndex(i => i.item_id === currentSong.item_id);
        if (idx !== -1 && idx < playlistItems.length - 1) {
          setCurrentSong(playlistItems[idx + 1]);
        }
      }
    };
    window.addEventListener('youtube-player-ended', onEnd);
    return () => window.removeEventListener('youtube-player-ended', onEnd);
  }, [autoPlay, repeat, currentSong, playlistItems]);

  return (
    <div className={`space-y-4 ${isLarge ? 'fixed inset-4 z-50 bg-slate-800/95 backdrop-blur-xl rounded-lg p-6 border border-slate-700/50' : ''}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-blue-400">
          Background Music
        </h3>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => setShowPlaylistModal(true)} className="hover:bg-slate-700/50 text-slate-300" title="Quản lý playlist">
            <List className="h-4 w-4" />
          </Button>
          {videoId && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsLarge(!isLarge)}
              className="ml-2 hover:bg-slate-700/50 text-slate-300"
            >
              {isLarge ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
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
            <iframe
              className="absolute top-0 left-0 w-full h-full"
              src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=1&controls=0`}
              title="YouTube music player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
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
            {/* Add to Playlist Button */}
            {videoId && playlists.length > 0 && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowAddToPlaylist(true)}
                className="w-10 h-10 bg-slate-800/50 border-emerald-500/50 hover:bg-emerald-700/30 text-emerald-400 ml-2"
                title="Thêm vào playlist"
              >
                <BookmarkPlus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </>
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

      {/* Playlist Modal */}
      <Dialog open={showPlaylistModal} onOpenChange={setShowPlaylistModal}>
        <DialogContent className="max-w-lg bg-slate-900/30 backdrop-blur-sm border border-emerald-500/30 shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle>Danh sách Playlist</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {playlists.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <List className="h-8 w-8 mb-2 opacity-60" />
                <span>Chưa có playlist nào.<br/>Hãy tạo playlist đầu tiên!</span>
              </div>
            ) : (
              playlists.map((pl: any) => (
                <div
                  key={pl.id}
                  className="flex items-center justify-between gap-3 bg-gradient-to-r from-slate-800/70 to-slate-900/60 border border-slate-700/60 rounded-lg px-4 py-3 shadow-sm hover:shadow-lg hover:border-emerald-500 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <List className="h-6 w-6 text-emerald-400 group-hover:text-blue-400 transition" />
                    <div>
                      <div className="font-semibold text-slate-100 group-hover:text-emerald-300 truncate max-w-[180px]">{pl.name}</div>
                      {pl.description && <div className="text-xs text-slate-400 truncate max-w-[180px]">{pl.description}</div>}
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => handleDeletePlaylist(pl.id)} className="text-red-400 hover:bg-slate-700/50 hover:text-red-500 transition"><Trash2 className="h-5 w-5" /></Button>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowCreateModal(true)} className="bg-emerald-500 hover:bg-emerald-600"><Plus className="h-4 w-4 mr-1" />Tạo playlist</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Create Playlist Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md bg-slate-900/80 border border-slate-700/70 shadow-xl rounded-xl backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-blue-400">Tạo Playlist mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <label className="block text-slate-300 text-sm font-medium">Tên playlist</label>
            <Input placeholder="Nhập tên playlist" value={newPlaylistName} onChange={e => setNewPlaylistName(e.target.value)} className="bg-slate-800/70 border border-slate-700 text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 rounded-lg" />
            <label className="block text-slate-300 text-sm font-medium mt-2">Mô tả</label>
            <Input placeholder="Mô tả (không bắt buộc)" value={newPlaylistDesc} onChange={e => setNewPlaylistDesc(e.target.value)} className="bg-slate-800/70 border border-slate-700 text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 rounded-lg" />
          </div>
          <DialogFooter>
            <Button onClick={handleCreatePlaylist} disabled={loading || !newPlaylistName} className="w-full py-2 mt-2 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? 'Đang tạo...' : 'Tạo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Add to Playlist Modal */}
      <Dialog open={showAddToPlaylist} onOpenChange={setShowAddToPlaylist}>
        <DialogContent className="max-w-xs bg-slate-900/80 border border-emerald-500/30 shadow-xl rounded-xl backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-emerald-400">Thêm vào Playlist</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <label className="block text-slate-300 text-sm font-medium">Chọn playlist</label>
            <select
              className="w-full bg-slate-800/70 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500"
              value={selectedPlaylist}
              onChange={e => setSelectedPlaylist(e.target.value)}
            >
              <option value="">-- Chọn playlist --</option>
              {playlists.map((pl: any) => (
                <option key={pl.id} value={pl.id}>{pl.name}</option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button onClick={handleAddToPlaylist} disabled={addLoading || !selectedPlaylist} className="w-full py-2 mt-2 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed">
              {addLoading ? 'Đang thêm...' : 'Thêm vào playlist'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Danh sách bài hát trong playlist - UI đẹp, hiệu ứng, điều khiển */}
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-slate-400 text-sm">Playlist:</span>
          <select
            className="bg-slate-800/70 border border-slate-700 text-slate-200 rounded px-2 py-1"
            value={currentPlaylistId}
            onChange={e => setCurrentPlaylistId(e.target.value)}
          >
            <option value="">-- Chọn playlist --</option>
            {playlists.map((pl: any) => (
              <option key={pl.id} value={pl.id}>{pl.name}</option>
            ))}
          </select>
        </div>
        <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 rounded-xl border border-emerald-500/20 p-2 max-h-56 overflow-y-auto shadow-lg">
          {playlistItems.length === 0 ? (
            <div className="text-slate-500 text-center py-4">Chưa có bài hát nào trong playlist này.</div>
          ) : (
            playlistItems.map((item, idx) => (
              <div
                key={item.item_id}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all duration-150 group hover:bg-emerald-900/30 ${currentSong?.item_id === item.item_id ? 'bg-gradient-to-r from-emerald-700/40 to-blue-700/30 border border-emerald-400/40 shadow-md' : ''}`}
                onClick={() => setCurrentSong(item)}
              >
                <Music2 className={`h-5 w-5 ${currentSong?.item_id === item.item_id ? 'text-emerald-300' : 'text-slate-400 group-hover:text-emerald-400'}`} />
                <span className={`font-semibold truncate max-w-[160px] ${currentSong?.item_id === item.item_id ? 'text-emerald-100' : 'text-slate-200 group-hover:text-emerald-200'}`}>{item.title || item.youtube_url}</span>
                <span className="ml-auto text-xs text-slate-500">{new Date(item.added_at).toLocaleDateString()}</span>
              </div>
            ))
          )}
        </div>
        {/* Điều khiển chuyển bài, lặp lại, auto play */}
        <div className="flex items-center justify-center gap-3 mt-3">
          <Button size="icon" variant="ghost" onClick={() => {
            if (!currentSong || playlistItems.length === 0) return;
            const idx = playlistItems.findIndex(i => i.item_id === currentSong.item_id);
            if (idx > 0) setCurrentSong(playlistItems[idx - 1]);
          }} className="text-emerald-400 bg-slate-900/70 border border-emerald-500/30 hover:bg-emerald-800/30 hover:text-white focus:ring-2 focus:ring-emerald-400">
            <SkipBack className="h-5 w-5" />
            <span className="sr-only">Prev</span>
          </Button>
          <Button size="icon" variant="ghost" onClick={() => setRepeat(!repeat)}
            className={
              repeat
                ? 'bg-slate-900 border-emerald-400 text-white shadow-lg scale-110 ring-2 ring-emerald-300'
                : 'text-emerald-400 bg-slate-900/70 border border-emerald-500/30 hover:bg-emerald-800/30 hover:text-white'
            }>
            <Repeat className={`h-5 w-5 ${repeat ? 'text-white' : ''}`} />
            <span className="sr-only">Repeat</span>
          </Button>
          <Button size="icon" variant="ghost" onClick={() => setAutoPlay(!autoPlay)}
            className={
              autoPlay
                ? 'bg-slate-900 border-blue-400 text-white shadow-lg scale-110 ring-2 ring-blue-300'
                : 'text-blue-400 bg-slate-900/70 border border-blue-500/30 hover:bg-blue-800/30 hover:text-white'
            }>
            <Play className={`h-5 w-5 ${autoPlay ? 'text-white' : ''}`} />
            <span className="sr-only">AutoPlay</span>
          </Button>
          <Button size="icon" variant="ghost" onClick={() => {
            if (!currentSong || playlistItems.length === 0) return;
            const idx = playlistItems.findIndex(i => i.item_id === currentSong.item_id);
            if (idx !== -1 && idx < playlistItems.length - 1) setCurrentSong(playlistItems[idx + 1]);
          }} className="text-emerald-400 bg-slate-900/70 border border-emerald-500/30 hover:bg-emerald-800/30 hover:text-white focus:ring-2 focus:ring-emerald-400">
            <SkipForward className="h-5 w-5" />
            <span className="sr-only">Next</span>
          </Button>
        </div>
      </div>
    </div>
  );
} 