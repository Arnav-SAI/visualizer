export interface FileNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  size: number;
  lastModified: string;
}

export interface DependencyLink {
  source: string;
  target: string;
  type: string;
  weight: number;
}

export interface RepositoryData {
  nodes: FileNode[];
  links: DependencyLink[];
}