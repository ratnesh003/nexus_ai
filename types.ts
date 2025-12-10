export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  files: DataFile[];
}

export interface DataFile {
  id: string;
  name: string;
  content: string; // CSV string content or URL if using Cloudinary
  storageType: 'local' | 'cloudinary';
  versions: FileVersion[];
}

export interface FileVersion {
  id: string;
  timestamp: string;
  content: string;
  changeDescription: string;
  pythonCode: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  codeSnippet?: string;
  timestamp: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: any;
}

export interface ChartConfig {
  id: string;
  type: 'bar' | 'pie' | 'line' | 'radar' | 'radial';
  title: string;
  dataKey: string;
  categoryKey: string;
  data: ChartDataPoint[];
  description: string;
}

export interface DashboardData {
  mainStats: ChartConfig[];
  charts: ChartConfig[];
}

export interface AppConfig {
    mongoDbApiKey?: string;
    mongoDbUrl?: string; // Endpoint for Data API
    mongoDbCluster?: string;
    mongoDbDatabase?: string;
    mongoDbCollection?: string;
    cloudinaryCloudName?: string;
    cloudinaryUploadPreset?: string;
    useRealBackend: boolean;
}