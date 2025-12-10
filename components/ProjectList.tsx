import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/mockDb';
import { Project } from '../types';
import { Button, Input, Card, Icons } from './ui';

const ProjectList: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectDesc, setNewProjectDesc] = useState('');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        setLoading(true);
        const projs = await db.getProjects();
        setProjects(projs);
        setLoading(false);
    };

    const handleCreate = async () => {
        if (!newProjectName) return;
        const newProj = await db.createProject(newProjectName, newProjectDesc);
        await loadProjects();
        setIsCreateOpen(false);
        setNewProjectName('');
        setNewProjectDesc('');
        navigate(`/projects/${newProj.id}`);
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this project?')) {
            await db.deleteProject(id);
            loadProjects();
        }
    };

    if (loading) return <div className="flex h-full items-center justify-center"><Icons.Spinner /></div>;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary">Projects</h1>
                    <p className="text-muted-foreground mt-2">Manage your data analysis workspaces.</p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)}>
                    <Icons.Plus /> <span className="ml-2">New Project</span>
                </Button>
            </div>

            {isCreateOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-md p-6 space-y-4">
                        <h2 className="text-xl font-semibold">Create Project</h2>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Name</label>
                            <Input value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} placeholder="e.g. Q4 Financials" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Description</label>
                            <Input value={newProjectDesc} onChange={(e) => setNewProjectDesc(e.target.value)} placeholder="Brief description..." />
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreate}>Create</Button>
                        </div>
                    </Card>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                    <Card key={project.id} className="cursor-pointer hover:shadow-md transition-shadow group relative overflow-hidden">
                        <div onClick={() => navigate(`/projects/${project.id}`)} className="p-6 h-full flex flex-col">
                             <div className="flex justify-between items-start mb-4">
                                <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                                    <Icons.File />
                                </div>
                                <Button variant="ghost" className="h-8 w-8 p-0 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => handleDelete(e, project.id)}>
                                    <Icons.Trash />
                                </Button>
                             </div>
                             <h3 className="font-semibold text-lg mb-2">{project.name}</h3>
                             <p className="text-sm text-slate-500 flex-grow line-clamp-6">{project.description}</p>
                             <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
                                <span>{project.files.length} Files</span>
                                <span>Updated {new Date(project.updatedAt).toLocaleDateString()}</span>
                             </div>
                        </div>
                    </Card>
                ))}
                {projects.length === 0 && (
                    <div className="col-span-full text-center py-12 border-2 border-dashed border-slate-200 rounded-lg text-slate-400">
                        No projects yet. Create one to get started.
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectList;