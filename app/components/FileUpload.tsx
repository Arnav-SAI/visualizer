'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import JSZip from 'jszip';

interface FileUploadProps {
  onCodeProcessed: (data: any) => void;
}

export default function FileUpload({ onCodeProcessed }: FileUploadProps) {
  const processFiles = async (files: File[]) => {
    const zip = new JSZip();
    const nodes: any[] = [];
    const links: any[] = [];
    let idCounter = 1;
    const fileIdMap = new Map();

    // Process each file
    for (const file of files) {
      const content = await file.text();
      const path = file.webkitRelativePath || file.name;
      const parts = path.split('/');
      
      // Process directories in the path
      let currentPath = '';
      for (let i = 0; i < parts.length - 1; i++) {
        const dirPath = parts.slice(0, i + 1).join('/');
        if (!fileIdMap.has(dirPath)) {
          const id = String(idCounter++);
          fileIdMap.set(dirPath, id);
          nodes.push({
            id,
            name: parts[i],
            path: dirPath,
            type: 'directory',
            size: 0,
            lastModified: new Date().toISOString()
          });

          // Create contains link with parent directory
          if (i > 0) {
            const parentPath = parts.slice(0, i).join('/');
            links.push({
              source: fileIdMap.get(parentPath),
              target: id,
              type: 'contains',
              weight: 1
            });
          }
        }
      }

      // Process the file itself
      const id = String(idCounter++);
      fileIdMap.set(path, id);
      nodes.push({
        id,
        name: parts[parts.length - 1],
        path,
        type: 'file',
        size: file.size,
        lastModified: new Date(file.lastModified).toISOString()
      });

      // Create contains link with parent directory
      if (parts.length > 1) {
        const parentPath = parts.slice(0, -1).join('/');
        links.push({
          source: fileIdMap.get(parentPath),
          target: id,
          type: 'contains',
          weight: 1
        });
      }

      // Analyze imports for JavaScript/TypeScript files
      if (path.match(/\.(js|jsx|ts|tsx)$/)) {
        try {
          const imports = await analyzeImports(content);
          for (const importPath of imports) {
            // Resolve relative imports
            const resolvedPath = resolveImportPath(path, importPath);
            if (fileIdMap.has(resolvedPath)) {
              links.push({
                source: id,
                target: fileIdMap.get(resolvedPath),
                type: 'imports',
                weight: 1.5
              });
            }
          }
        } catch (error) {
          console.error(`Error analyzing imports in ${path}:`, error);
        }
      }
    }

    onCodeProcessed({ nodes, links });
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // Handle both directory upload and zip file upload
    if (acceptedFiles[0]?.type === 'application/zip') {
      const zip = await JSZip.loadAsync(acceptedFiles[0]);
      const files: File[] = [];
      
      for (const [path, file] of Object.entries(zip.files)) {
        if (!file.dir) {
          const content = await file.async('blob');
          const customFile = new File([content], path, {
            type: content.type,
            lastModified: file.date.getTime()
          });
          Object.defineProperty(customFile, 'webkitRelativePath', {
            value: path
          });
          files.push(customFile);
        }
      }
      
      await processFiles(files);
    } else {
      await processFiles(acceptedFiles);
    }
  }, [onCodeProcessed]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: false,
    noKeyboard: false,
    accept: {
      'application/zip': ['.zip'],
      'application/x-zip-compressed': ['.zip'],
      'folder': ['']
    }
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
        ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
    >
      <input {...getInputProps()} directory="" webkitdirectory="" />
      <div className="space-y-4">
        <div className="text-4xl">📁</div>
        <p className="text-lg font-medium">
          {isDragActive ? 'Drop your files here' : 'Drag and drop your project files here'}
        </p>
        <p className="text-sm text-gray-500">
          Upload a folder or ZIP file containing your project
        </p>
      </div>
    </div>
  );
}

async function analyzeImports(content: string): Promise<string[]> {
  // Simple regex-based import detection
  // In a production environment, you'd want to use a proper parser like acorn
  const imports: string[] = [];
  const importRegex = /import\s+.*?from\s+['"]([^'"]+)['"]/g;
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }

  return imports;
}

function resolveImportPath(currentPath: string, importPath: string): string {
  if (importPath.startsWith('.')) {
    const parts = currentPath.split('/');
    parts.pop(); // Remove the current file name
    const importParts = importPath.split('/');
    
    for (const part of importParts) {
      if (part === '..') {
        parts.pop();
      } else if (part !== '.') {
        parts.push(part);
      }
    }

    // Add common extensions if not specified
    if (!parts[parts.length - 1].includes('.')) {
      for (const ext of ['.js', '.jsx', '.ts', '.tsx']) {
        const pathWithExt = [...parts].join('/') + ext;
        return pathWithExt;
      }
    }

    return parts.join('/');
  }
  return importPath;
}