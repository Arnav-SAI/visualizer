'use client';

import { FileNode } from '../types';

interface FileInfoPanelProps {
  file: FileNode | null;
}

export default function FileInfoPanel({ file }: FileInfoPanelProps) {
  if (!file) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold mb-2">{file.name}</h3>
      <div className="space-y-2">
        <div>
          <span className="text-gray-600">Type:</span>
          <span className="ml-2 capitalize">{file.type}</span>
        </div>
        <div>
          <span className="text-gray-600">Path:</span>
          <span className="ml-2 font-mono text-sm">{file.path}</span>
        </div>
        <div>
          <span className="text-gray-600">Size:</span>
          <span className="ml-2">{formatFileSize(file.size)}</span>
        </div>
        <div>
          <span className="text-gray-600">Last Modified:</span>
          <span className="ml-2">{new Date(file.lastModified).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}