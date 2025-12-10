import { Project, DataFile, User, AppConfig, DashboardData } from '../types';

// STORAGE KEYS
const STORAGE_KEY_PROJECTS = 'datanexus_projects';
const STORAGE_KEY_USER = 'datanexus_user';
const STORAGE_KEY_CONFIG = 'datanexus_config';

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

    // --- Auth (Mock for Client, but structure ready for Better Auth) ---
    getUser(): User | null {
        return this.user;
    }

    login(email: string, name: string): User {
        const user: User = {
            id: `u-${Date.now()}`,
            name: name || email.split('@')[0],
            email: email,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
        };
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
            // MongoDB Data API Implementation
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
                return this.projects; // Fallback
            }
        }
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
                return this.projects.find(p => p.id === id);
            }
        }
        return this.projects.find(p => p.id === id);
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
        localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(this.projects));
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

        const idx = this.projects.findIndex(p => p.id === id);
        if (idx !== -1) this.projects[idx] = project;
        localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(this.projects));
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
        this.projects = this.projects.filter(p => p.id !== id);
        localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(this.projects));
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
        localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(this.projects));
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

                // For processing immediately, we still need the text content
                // We can fetch it back or read the file locally for the initial version
            } catch (e) {
                console.error("Cloudinary Upload Error", e);
                throw new Error("Cloudinary Upload Failed");
            }
        } else {
            // Local Fallback
            content = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target?.result as string);
                reader.readAsText(file);
            });
        }

        // If we uploaded to Cloudinary, we need the raw text for the initial version to show in UI
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
            content: initialTextContent, // We store the TEXT content in memory for the app to use
            storageType: 'local', // For simplicity in this demo, we treat active working copy as local
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

            // Update Local State mirror
            const idx = this.projects.findIndex(p => p.id === projectId);
            if (idx !== -1) this.projects[idx] = project;
            localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(this.projects));
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

        // Update Local Mirror
        const idx = this.projects.findIndex(p => p.id === projectId);
        if (idx !== -1) this.projects[idx] = project;
        localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(this.projects));
    }
}

export const db = new DatabaseService();