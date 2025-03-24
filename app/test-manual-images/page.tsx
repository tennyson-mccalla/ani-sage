'use client';

import { useState, useEffect } from 'react';
import { manualMappings } from '@/app/lib/utils/malsync/manual-mappings';

interface AnimeMapping {
  id: string;
  title: string;
  imageUrl: string;
  tmdbId?: number;
  malId?: number;
}

export default function TestManualImagesPage() {
  const [mappings, setMappings] = useState<AnimeMapping[]>([]);
  const [successCount, setSuccessCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  
  useEffect(() => {
    // Convert manual mappings to array
    const mappingsArray = Object.entries(manualMappings).map(([id, mapping]) => {
      return {
        id,
        title: mapping.title,
        imageUrl: mapping.imageUrl || '',
        tmdbId: mapping.tmdbId,
        malId: mapping.malId
      };
    });
    
    // Sort by title
    mappingsArray.sort((a, b) => a.title.localeCompare(b.title));
    setMappings(mappingsArray);
  }, []);

  const handleImageLoad = () => {
    setSuccessCount(prev => prev + 1);
  };

  const handleImageError = () => {
    setErrorCount(prev => prev + 1);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Manual TMDb Image Mappings Test</h1>
      
      <div className="bg-gray-100 p-4 mb-6 rounded">
        <div className="text-lg">
          Loaded: {successCount} / {mappings.length} images
        </div>
        {errorCount > 0 && (
          <div className="text-red-600">
            Failed: {errorCount} images
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {mappings.map((mapping) => (
          <div key={mapping.id} className="border rounded overflow-hidden bg-white">
            <div className="relative aspect-[2/3] bg-gray-200">
              <img 
                src={mapping.imageUrl}
                alt={mapping.title}
                className="absolute inset-0 w-full h-full object-cover"
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            </div>
            <div className="p-3">
              <h3 className="font-semibold text-sm">{mapping.title}</h3>
              <div className="text-xs text-gray-600 mt-1">
                ID: {mapping.id}
                {mapping.tmdbId && <> | TMDb: {mapping.tmdbId}</>}
                {mapping.malId && <> | MAL: {mapping.malId}</>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}