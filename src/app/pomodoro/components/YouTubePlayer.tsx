'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Play, Pause, Volume2, VolumeX, Maximize2, Minimize2 } from 'lucide-react';

export default function YouTubePlayer() {
  const [searchQuery, setSearchQuery] = useState('');
  const [videoId, setVideoId] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLarge, setIsLarge] = useState(false);

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

  return (
    <div className={`space-y-4 ${isLarge ? 'fixed inset-4 z-50 bg-white dark:bg-gray-800 rounded-lg p-6' : ''}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Background Music
        </h3>
        {videoId && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsLarge(!isLarge)}
            className="ml-2"
          >
            {isLarge ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Paste YouTube URL or search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1"
        />
        <Button onClick={handleSearch} size="icon">
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {videoId && (
        <>
          <div className={`relative ${isLarge ? 'h-[calc(100%-12rem)]' : 'pt-[56.25%]'} w-full`}>
            <iframe
              className="absolute top-0 left-0 w-full h-full rounded-lg"
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
              className="w-10 h-10"
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
              className="w-10 h-10"
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </>
      )}

      {!videoId && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>Paste a YouTube URL or search for music</p>
        </div>
      )}
    </div>
  );
} 