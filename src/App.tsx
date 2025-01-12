import React, { useState, useEffect, useCallback } from 'react';
import { CSVLink } from 'react-csv';
import Papa from 'papaparse';

interface Track {
  Artist: string;
  TrackName: string;
  Year: string;
  Genre: string;
}

interface Node {
  id: string;
  label: string;
  children: Node[];
  type: 'artist' | 'track' | 'year' | 'genre';
  parent?: Node;
}

const mockCSVData = `Artist,TrackName,Year,Genre
The Beatles,Hey Jude,1968,Rock;Pop
The Beatles,Let It Be,1970,Rock;Pop
Queen,Bohemian Rhapsody,1975,Rock
Queen,We Will Rock You,1977,Rock;Funk
Led Zeppelin,Kashmir,1975,Rock;Heavy Metal
Led Zeppelin,Stairway to Heaven,1971,Rock;Heavy Metal`;

const parseCSV = (data: string): Track[] => {
  const results = Papa.parse(data, { header: true, skipEmptyLines: true });
  return results.data as Track[];
};

const buildMindMap = (tracks: Track[]): Node => {
  const root: Node = { id: 'root', label: 'Music Library', children: [], type: 'artist' };
  const artistMap: { [key: string]: Node } = {};

  tracks.forEach(track => {
    const artistNode = artistMap[track.Artist] || {
      id: track.Artist,
      label: track.Artist,
      children: [],
      type: 'artist',
      parent: root,
    };

    if (!artistMap[track.Artist]) {
      root.children.push(artistNode);
      artistMap[track.Artist] = artistNode;
    }

    const trackNode: Node = {
      id: `${track.Artist}-${track.TrackName}`,
      label: track.TrackName,
      children: [],
      type: 'track',
      parent: artistNode,
    };

    artistNode.children.push(trackNode);

    const yearNode: Node = {
      id: `${track.Artist}-${track.TrackName}-${track.Year}`,
      label: track.Year,
      children: [trackNode],
      type: 'year',
      parent: trackNode,
    };

    const genreNodes: Node[] = track.Genre.split(';').map(genre => ({
      id: `${track.Artist}-${track.TrackName}-${genre}`,
      label: genre,
      children: [trackNode],
      type: 'genre',
      parent: trackNode,
    }));

    trackNode.children.push(yearNode, ...genreNodes);
  });

  return root;
};

const MindMapNode: React.FC<{ node: Node }> = ({ node }) => {
  const [isOpen, setIsOpen] = useState(true);

  const toggleNode = useCallback(() => setIsOpen(!isOpen), [isOpen]);

  return (
    <div className="flex flex-col items-center">
      <div
        className={`cursor-pointer p-2 rounded-lg bg-blue-500 text-white mb-2 ${
          node.type === 'artist' && 'font-bold'
        }`}
        onClick={toggleNode}
        role="button"
        tabIndex={0}
        aria-label={`Toggle ${node.label}`}
        onKeyPress={toggleNode}
      >
        {node.label}
      </div>
      {isOpen && node.children.length > 0 && (
        <div className="flex flex-col items-center space-y-2">
          {node.children.map(child => (
            <MindMapNode key={child.id} node={child} />
          ))}
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [mindMap, setMindMap] = useState<Node | null>(null);

  useEffect(() => {
    const parsedData = parseCSV(mockCSVData);
    setTracks(parsedData);
    setMindMap(buildMindMap(parsedData));
  }, []);

  return (
    <div className="min- bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-8 text-center">Music Library Visualizer</h1>
      <CSVLink data={mockCSVData} filename="music-library.csv" className="text-blue-500 mb-8">
        Download Sample CSV
      </CSVLink>
      {mindMap && <MindMapNode node={mindMap} />}
    </div>
  );
};

export default React.memo(App);