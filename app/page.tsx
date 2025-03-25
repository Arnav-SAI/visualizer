'use client';

import { useState, useEffect } from 'react';
import ForceGraph from './components/ForceGraph';
import FileInfoPanel from './components/FileInfoPanel';
import FileUpload from './components/FileUpload';
import { RepositoryData, FileNode } from './types';

export default function Home() {
  const [repoData, setRepoData] = useState<RepositoryData>({
    nodes: [],
    links: []
  });
  const [selectedNode, setSelectedNode] = useState<FileNode | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const handleCodeProcessed = (data: RepositoryData) => {
    setRepoData(data);
    setIsDataLoaded(true);
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Codebase Visualizer</h1>
        
        {!isDataLoaded ? (
          <div className="max-w-2xl mx-auto">
            <FileUpload onCodeProcessed={handleCodeProcessed} />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 bg-white rounded-lg shadow-lg p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Repository Structure</h2>
                <p className="text-gray-600">
                  Visualizing the relationships between files and directories in your codebase.
                  Click on nodes to view details.
                </p>
                <button
                  onClick={() => setIsDataLoaded(false)}
                  className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                >
                  Upload Different Code
                </button>
              </div>
              
              <div className="h-[600px]">
                <ForceGraph 
                  data={repoData} 
                  onNodeSelect={setSelectedNode}
                />
              </div>
            </div>

            <div className="col-span-1">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4">File Details</h2>
                {selectedNode ? (
                  <FileInfoPanel file={selectedNode} />
                ) : (
                  <p className="text-gray-600">
                    Select a file or directory to view its details
                  </p>
                )}
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
                <h2 className="text-xl font-semibold mb-4">Legend</h2>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-[#ff7f0e]"></div>
                    <span className="ml-2">Directory</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-[#1f77b4]"></div>
                    <span className="ml-2">File</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-0.5 bg-gray-400"></div>
                    <span className="ml-2">Contains</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-0.5 bg-gray-400 relative">
                      <div className="absolute right-0 top-1/2 -mt-1 w-2 h-2 border-t-2 border-r-2 border-gray-400 transform rotate-45"></div>
                    </div>
                    <span className="ml-2">Imports</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}