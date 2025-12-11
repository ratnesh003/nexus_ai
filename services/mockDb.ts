
import { Project, DataFile, User, AppConfig, DashboardData } from '../types';

// STORAGE KEYS
const STORAGE_KEY_PROJECTS = 'datanexus_projects';
const STORAGE_KEY_USER = 'datanexus_user';
const STORAGE_KEY_CONFIG = 'datanexus_config';

// --- INDEXEDDB HELPERS for Offline Large File Storage ---
const IDB_NAME = 'DataNexusDB';
const IDB_VERSION = 1;
const STORE_FILES = 'files';

const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        if (!window.indexedDB) {
            reject(new Error("IndexedDB not supported"));
            return;
        }
        const request = window.indexedDB.open(IDB_NAME, IDB_VERSION);
        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_FILES)) {
                db.createObjectStore(STORE_FILES, { keyPath: 'id' });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

const saveFileToIDB = async (id: string, content: string, versions: any[]) => {
    try {
        const db = await openDB();
        return new Promise<void>((resolve, reject) => {
            const tx = db.transaction(STORE_FILES, 'readwrite');
            const store = tx.objectStore(STORE_FILES);
            const request = store.put({ id, content, versions });
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (e) {
        console.warn("IndexedDB Save Error", e);
    }
};

const getFileFromIDB = async (id: string): Promise<{ content: string; versions: any[] } | undefined> => {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_FILES, 'readonly');
            const store = tx.objectStore(STORE_FILES);
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    } catch (e) {
        console.warn("IndexedDB Read Error", e);
        return undefined;
    }
};

class DatabaseService {
  private projects: Project[];
  private user: User | null;
  private config: AppConfig;

  constructor() {
    const storedProjects = localStorage.getItem(STORAGE_KEY_PROJECTS);
    const storedUser = localStorage.getItem(STORAGE_KEY_USER);
    const storedConfig = localStorage.getItem(STORAGE_KEY_CONFIG);

    this.projects = storedProjects ? JSON.parse(storedProjects) : [];
    this.user = storedUser ? JSON.parse(storedUser) : null;
    this.config = storedConfig ? JSON.parse(storedConfig) : {
        useRealBackend: false
    };
  }

  // --- Configuration ---
  updateConfig(newConfig: Partial<AppConfig>) {
      this.config = { ...this.config, ...newConfig };
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(this.config));
  }

  getConfig() {
      return this.config;
  }

  // --- Persistence Helper ---
  // Save lightweight metadata to LocalStorage and heavy content to IndexedDB
  private async persistLocal() {
      // 1. Prepare projects for LocalStorage (strip heavy content)
      const lightweightProjects = this.projects.map(p => ({
          ...p,
          files: p.files.map(f => {
              // If it's a Cloudinary file, we keep the content (it's just a URL)
              // If it's local, we strip it to save space in LS
              if (f.storageType === 'cloudinary') return f;
              
              return {
                  ...f,
                  content: '', // Stripped
                  versions: f.versions.map(v => ({ ...v, content: '' })) // Stripped
              };
          })
      }));

      // 2. Save heavy content to IndexedDB for all local files
      const savePromises = [];
      for (const p of this.projects) {
          for (const f of p.files) {
              if (f.storageType === 'local') {
                  savePromises.push(saveFileToIDB(f.id, f.content, f.versions));
              }
          }
      }
      
      await Promise.all(savePromises);

      // 3. Save metadata to LocalStorage
      try {
          localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(lightweightProjects));
      } catch (e) {
          console.error("LocalStorage Quota Exceeded even with IDB offloading", e);
          alert("Storage full. Please delete some projects.");
      }
  }

  // --- Auth ---
  getUser(): User | null {
    return this.user;
  }

  login(email: string, name: string): User {
    const user: User = {
      id: `u-${Date.now()}`,
      name: name || email.split('@')[0],
      email: email,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}` // Using generic avatar logic
    };
    // Fix for CSP/broken avatar: Use a local SVG data URI if needed, but keeping simple for now
    // Actually, let's use a generated initial avatar to be safe
    user.avatar = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%233b82f6'/%3E%3Ctext x='50' y='65' font-size='50' fill='white' text-anchor='middle' font-family='sans-serif'%3E${name.charAt(0).toUpperCase()}%3C/text%3E%3C/svg%3E`;

    this.user = user;
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(this.user));
    return user;
  }

  logout(): void {
    this.user = null;
    localStorage.removeItem(STORAGE_KEY_USER);
  }

  // --- Projects ---

  async getProjects(): Promise<Project[]> {
    if (this.config.useRealBackend && this.config.mongoDbApiKey) {
        try {
            const response = await fetch(`${this.config.mongoDbUrl}/action/find`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': this.config.mongoDbApiKey || '',
                },
                body: JSON.stringify({
                    dataSource: this.config.mongoDbCluster,
                    database: this.config.mongoDbDatabase,
                    collection: 'projects',
                    filter: {} // Get all
                })
            });
            const data = await response.json();
            return data.documents || [];
        } catch (e) {
            console.error("MongoDB Fetch Error", e);
            return this.projects; // Fallback to local
        }
    }
    // For local listing, the lightweight version in memory is sufficient (names/descriptions are there)
    return this.projects;
  }

  async getProjectById(id: string): Promise<Project | undefined> {
    if (this.config.useRealBackend && this.config.mongoDbApiKey) {
         try {
            const response = await fetch(`${this.config.mongoDbUrl}/action/findOne`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': this.config.mongoDbApiKey || '',
                },
                body: JSON.stringify({
                    dataSource: this.config.mongoDbCluster,
                    database: this.config.mongoDbDatabase,
                    collection: 'projects',
                    filter: { id: id }
                })
            });
            const data = await response.json();
            return data.document;
        } catch (e) {
            console.error("MongoDB Fetch One Error", e);
            // Fallback to local
        }
    }

    // LOCAL MODE: Rehydrate from IndexedDB if needed
    const project = this.projects.find(p => p.id === id);
    if (!project) return undefined;

    // We must ensure files have their content loaded
    const hydratedFiles = await Promise.all(project.files.map(async (f) => {
        if (f.storageType === 'local' && (!f.content || f.content === '')) {
            // Content missing in memory/LS, fetch from IDB
            const idbData = await getFileFromIDB(f.id);
            if (idbData) {
                return { ...f, content: idbData.content, versions: idbData.versions };
            }
        }
        return f;
    }));

    // Update memory cache with hydrated files so subsequent calls are fast
    project.files = hydratedFiles;
    return project;
  }

  async createProject(name: string, description: string): Promise<Project> {
    const newProject: Project = {
      id: `p${Date.now()}`,
      name,
      description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      files: []
    };

    if (this.config.useRealBackend && this.config.mongoDbApiKey) {
         await fetch(`${this.config.mongoDbUrl}/action/insertOne`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': this.config.mongoDbApiKey || '',
            },
            body: JSON.stringify({
                dataSource: this.config.mongoDbCluster,
                database: this.config.mongoDbDatabase,
                collection: 'projects',
                document: newProject
            })
        });
    }

    this.projects = [newProject, ...this.projects];
    await this.persistLocal();
    return newProject;
  }

  async updateProject(id: string, name: string, description: string): Promise<void> {
    const project = await this.getProjectById(id);
    if (!project) return;

    project.name = name;
    project.description = description;
    project.updatedAt = new Date().toISOString();

    if (this.config.useRealBackend && this.config.mongoDbApiKey) {
         await fetch(`${this.config.mongoDbUrl}/action/updateOne`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': this.config.mongoDbApiKey || '',
            },
            body: JSON.stringify({
                dataSource: this.config.mongoDbCluster,
                database: this.config.mongoDbDatabase,
                collection: 'projects',
                filter: { id: id },
                update: { $set: { name, description, updatedAt: project.updatedAt } }
            })
        });
    }

    // Update Local Cache
    const idx = this.projects.findIndex(p => p.id === id);
    if (idx !== -1) this.projects[idx] = project;
    
    await this.persistLocal();
  }

  async deleteProject(id: string): Promise<void> {
    if (this.config.useRealBackend && this.config.mongoDbApiKey) {
        await fetch(`${this.config.mongoDbUrl}/action/deleteOne`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': this.config.mongoDbApiKey || '',
            },
            body: JSON.stringify({
                dataSource: this.config.mongoDbCluster,
                database: this.config.mongoDbDatabase,
                collection: 'projects',
                filter: { id }
            })
        });
    }
    
    // Cleanup IndexedDB files (Optional but good practice)
    // For simplicity, we just remove from the list here
    this.projects = this.projects.filter(p => p.id !== id);
    await this.persistLocal();
  }

  async saveDashboardData(projectId: string, dashboardData: DashboardData): Promise<void> {
      const project = await this.getProjectById(projectId);
      if (!project) return;

      project.dashboardData = dashboardData;
      project.updatedAt = new Date().toISOString();

      if (this.config.useRealBackend && this.config.mongoDbApiKey) {
           await fetch(`${this.config.mongoDbUrl}/action/updateOne`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'api-key': this.config.mongoDbApiKey || '',
              },
              body: JSON.stringify({
                  dataSource: this.config.mongoDbCluster,
                  database: this.config.mongoDbDatabase,
                  collection: 'projects',
                  filter: { id: projectId },
                  update: { $set: { dashboardData, updatedAt: project.updatedAt } }
              })
          });
      }

      const idx = this.projects.findIndex(p => p.id === projectId);
      if (idx !== -1) this.projects[idx] = project;
      await this.persistLocal();
  }

  // --- Files & Cloudinary ---

  async uploadFileToProject(projectId: string, file: File): Promise<DataFile> {
    let content = '';
    let storageType: 'local' | 'cloudinary' = 'local';

    // 1. Upload Content
    if (this.config.useRealBackend && this.config.cloudinaryCloudName && this.config.cloudinaryUploadPreset) {
        // Real Cloudinary Upload
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', this.config.cloudinaryUploadPreset);
        
        try {
            const res = await fetch(`https://api.cloudinary.com/v1_1/${this.config.cloudinaryCloudName}/raw/upload`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            content = data.secure_url; // Store URL
            storageType = 'cloudinary';
        } catch (e) {
            console.error("Cloudinary Upload Error", e);
            throw new Error("Cloudinary Upload Failed");
        }
    } else {
        // Local File Reader
        content = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsText(file);
        });
    }

    // Read initial content for memory/display purposes even if hosted on Cloudinary
    const initialTextContent = storageType === 'cloudinary' 
        ? await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsText(file);
          })
        : content;

    const newFile: DataFile = {
        id: `f${Date.now()}`,
        name: file.name,
        content: initialTextContent,
        storageType: storageType, 
        versions: [{
            id: `v${Date.now()}`,
            timestamp: new Date().toISOString(),
            content: initialTextContent,
            changeDescription: "Initial Upload",
            pythonCode: "# Initial Upload"
        }]
    };

    // Update Project
    const project = await this.getProjectById(projectId);
    if (project) {
        project.files.push(newFile);
        project.updatedAt = new Date().toISOString();
        
        if (this.config.useRealBackend && this.config.mongoDbApiKey) {
             // Update MongoDB
             await fetch(`${this.config.mongoDbUrl}/action/updateOne`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': this.config.mongoDbApiKey || '',
                },
                body: JSON.stringify({
                    dataSource: this.config.mongoDbCluster,
                    database: this.config.mongoDbDatabase,
                    collection: 'projects',
                    filter: { id: projectId },
                    update: { $set: { files: project.files, updatedAt: project.updatedAt } }
                })
            });
        }
        
        // Update Local State (Hybrid Persistence)
        const idx = this.projects.findIndex(p => p.id === projectId);
        if (idx !== -1) this.projects[idx] = project;
        
        // This will save to IndexedDB if local, preventing quota issues
        await this.persistLocal();
    }

    return newFile;
  }

  async updateFileVersion(projectId: string, fileId: string, newContent: string, description: string, pythonCode: string): Promise<void> {
     const project = await this.getProjectById(projectId);
     if (!project) return;
     
     const file = project.files.find(f => f.id === fileId);
     if (!file) return;

     const newVersion = {
        id: `v${Date.now()}`,
        timestamp: new Date().toISOString(),
        content: newContent,
        changeDescription: description,
        pythonCode: pythonCode
     };

     file.versions.unshift(newVersion);
     file.content = newContent;
     project.updatedAt = new Date().toISOString();

     if (this.config.useRealBackend && this.config.mongoDbApiKey) {
        await fetch(`${this.config.mongoDbUrl}/action/updateOne`, {
           method: 'POST',
           headers: {
               'Content-Type': 'application/json',
               'api-key': this.config.mongoDbApiKey || '',
           },
           body: JSON.stringify({
               dataSource: this.config.mongoDbCluster,
               database: this.config.mongoDbDatabase,
               collection: 'projects',
               filter: { id: projectId },
               update: { $set: { files: project.files, updatedAt: project.updatedAt } }
           })
       });
   }
   
   // Update Local State
   const idx = this.projects.findIndex(p => p.id === projectId);
   if (idx !== -1) this.projects[idx] = project;
   await this.persistLocal();
  }
}

export const db = new DatabaseService();
