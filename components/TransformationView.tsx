import React, { useState, useEffect } from 'react';
import { DataFile, Project } from '../types';
import { db } from '../services/mockDb';
import { transformCsvData } from '../services/geminiService';
import { Button, Input, Card, Icons, CodeBlock } from './ui';

interface TransformationViewProps {
    projectId: string;
    fileId?: string;
}

const TransformationView: React.FC<TransformationViewProps> = ({ projectId, fileId }) => {
    const [project, setProject] = useState<Project | undefined>(undefined);
    const [activeFile, setActiveFile] = useState<DataFile | null>(null);
    const [csvRows, setCsvRows] = useState<string[][]>([]);
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [lastCode, setLastCode] = useState<string | null>(null);

    useEffect(() => {
        loadProject();
    }, [projectId]);

    const loadProject = async () => {
        const proj = await db.getProjectById(projectId);
        setProject(proj);
        if (proj && proj.files.length > 0) {
            const file = fileId ? proj.files.find(f => f.id === fileId) : proj.files[0];
            if (file) handleFileSelect(file);
        }
    };

    const handleFileSelect = (file: DataFile) => {
        setActiveFile(file);
        parseCsv(file.content);
        setLastCode(file.versions.length > 0 ? file.versions[0].pythonCode : null);
    };

    const parseCsv = (content: string) => {
        const lines = content.trim().split('\n');
        const rows = lines.map(line => line.split(','));
        setCsvRows(rows.slice(0, 50)); // Limit for performance in preview
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && project) {
            try {
                // Uses the new Simulated Cloudinary Upload
                const newFile = await db.uploadFileToProject(project.id, file);
                await loadProject(); // Refresh full state
            } catch (err) {
                console.error(err);
                alert("Upload failed");
            }
        }
    };

    const handleTransformation = async () => {
        if (!prompt || !activeFile || !project) return;
        setIsLoading(true);
        try {
            const { newCsv, pythonCode } = await transformCsvData(activeFile.content, prompt);
            
            // In a real app, user confirms before save. Here we auto-save for flow.
            await db.updateFileVersion(project.id, activeFile.id, newCsv, prompt, pythonCode);
            
            // Refresh state
            await loadProject();
            setPrompt('');
        } catch (err) {
            alert("Transformation failed. See console.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!project) return <div className="p-8"><Icons.Spinner /></div>;

    return (
        <div className="h-full flex flex-col bg-slate-50 relative">
            {/* Header / Toolbar */}
            <div className="border-b border-border bg-white px-6 py-3 flex justify-between items-center shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <h2 className="font-semibold text-lg">Transformation</h2>
                    <select 
                        className="text-sm border-none bg-slate-100 rounded px-2 py-1 outline-none focus:ring-1 ring-accent"
                        value={activeFile?.id || ''}
                        onChange={(e) => {
                            const f = project.files.find(file => file.id === e.target.value);
                            if (f) handleFileSelect(f);
                        }}
                    >
                        {project.files.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                </div>
                <div>
                     <label className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring h-9 px-4 py-2 bg-secondary text-white hover:bg-slate-700">
                        <Icons.Upload /> <span className="ml-2">Upload CSV</span>
                        <input type="file" accept=".csv" className="hidden" onChange={handleUpload} />
                    </label>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden flex flex-col relative">
                {activeFile ? (
                    <>
                         {/* Code Preview (Collapsible in real app, shown here for "Transparency") */}
                         {lastCode && (
                             <div className="bg-slate-900 p-2 text-xs text-white max-h-32 overflow-y-auto shrink-0 border-b border-slate-700">
                                 <span className="opacity-50 font-mono block mb-1"># Generated Python Transformation</span>
                                 <pre className="font-mono">{lastCode}</pre>
                             </div>
                         )}

                        {/* CSV Table Preview */}
                        <div className="flex-1 overflow-auto p-6 pb-24"> 
                            <Card className="overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                                            <tr>
                                                {csvRows[0]?.map((header, i) => (
                                                    <th key={i} className="px-6 py-3 font-medium whitespace-nowrap">{header}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {csvRows.slice(1).map((row, i) => (
                                                <tr key={i} className="bg-white border-b hover:bg-slate-50">
                                                    {row.map((cell, j) => (
                                                        <td key={j} className="px-6 py-4 whitespace-nowrap text-slate-700 font-mono text-xs">{cell}</td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="px-6 py-3 bg-slate-50 text-xs text-slate-500 border-t">
                                    Showing first 50 rows. Total versions: {activeFile.versions.length}
                                </div>
                            </Card>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-400">
                        Select or upload a file to begin.
                    </div>
                )}
                
                {/* Floating Chat Input */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-20">
                     <Card className="p-2 shadow-2xl border-accent/20 ring-1 ring-accent/10 flex gap-2 items-center bg-white/95 backdrop-blur-sm">
                        <div className="h-8 w-8 bg-accent/10 rounded-full flex items-center justify-center text-accent shrink-0">
                            <Icons.Bot />
                        </div>
                        <Input 
                            value={prompt} 
                            onChange={(e) => setPrompt(e.target.value)} 
                            placeholder="Describe how to transform this data (e.g., 'Remove rows where Sales < 1000')..." 
                            className="border-none shadow-none focus-visible:ring-0 bg-transparent text-base"
                            onKeyDown={(e) => e.key === 'Enter' && handleTransformation()}
                        />
                        <Button onClick={handleTransformation} disabled={isLoading || !activeFile} className={isLoading ? "opacity-70" : ""}>
                            {isLoading ? <Icons.Spinner /> : <Icons.Send />}
                        </Button>
                     </Card>
                </div>
            </div>
        </div>
    );
};

export default TransformationView;