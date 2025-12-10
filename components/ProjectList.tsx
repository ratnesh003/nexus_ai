import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../services/mockDb";
import { Project } from "../types";
import { Button, Input, Card, Icons } from "./ui";

const ProjectList: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);

  // Create State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");

  // Edit State
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

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
    setNewProjectName("");
    setNewProjectDesc("");
    navigate(`/projects/${newProj.id}`);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this project?")) {
      await db.deleteProject(id);
      loadProjects();
    }
  };

  const openEdit = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setEditingProject(project);
    setEditName(project.name);
    setEditDesc(project.description);
  };

  const handleUpdate = async () => {
    if (!editingProject) return;
    await db.updateProject(editingProject.id, editName, editDesc);
    await loadProjects();
    setEditingProject(null);
  };

  if (loading)
    return (
      <div className="flex h-full items-center justify-center">
        <Icons.Spinner />
      </div>
    );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">
            Projects
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your data analysis workspaces.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Icons.Plus /> <span className="ml-2">New Project</span>
        </Button>
      </div>

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6 space-y-4 shadow-xl border-t-4 border-t-accent">
            <h2 className="text-xl font-semibold">Create Project</h2>
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="e.g. Q4 Financials"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                value={newProjectDesc}
                onChange={(e) => setNewProjectDesc(e.target.value)}
                placeholder="Brief description..."
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>Create</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Edit Modal */}
      {editingProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6 space-y-4 shadow-xl border-t-4 border-t-blue-500">
            <h2 className="text-xl font-semibold">Edit Project</h2>
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Project Name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="Project Description"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="ghost" onClick={() => setEditingProject(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate}>Save Changes</Button>
            </div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Card
            key={project.id}
            className="cursor-pointer hover:shadow-lg transition-all group relative overflow-hidden border-l-4 border-l-transparent hover:border-l-accent"
          >
            <div
              onClick={() => navigate(`/projects/${project.id}`)}
              className="p-6 h-full flex flex-col"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                  <Icons.File />
                </div>

                {/* Action Buttons - Now Always Visible */}
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                    onClick={(e) => openEdit(e, project)}
                    title="Edit Project"
                  >
                    <Icons.Edit />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                    onClick={(e) => handleDelete(e, project.id)}
                    title="Delete Project"
                  >
                    <Icons.Trash />
                  </Button>
                </div>
              </div>

              <h3 className="font-semibold text-lg mb-2 text-slate-900">
                {project.name}
              </h3>
              <p className="text-sm text-slate-500 flex-grow line-clamp-3 mb-4">
                {project.description || "No description provided."}
              </p>

              <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
                <span className="bg-slate-100 px-2 py-1 rounded">
                  {project.files.length} Files
                </span>
                <span>
                  Updated {new Date(project.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </Card>
        ))}

        {projects.length === 0 && (
          <div className="col-span-full text-center py-16 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 bg-slate-50/50 flex flex-col items-center justify-center">
            <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Icons.Plus />
            </div>
            <p className="font-medium text-slate-900">No projects found</p>
            <p className="text-sm mt-1 mb-4">
              Get started by creating your first analysis project.
            </p>
            <Button onClick={() => setIsCreateOpen(true)} variant="secondary">
              Create Project
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectList;
