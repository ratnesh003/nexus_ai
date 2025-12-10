import React, { useState, useEffect } from 'react';
import { DataFile, Project } from '../types';
import { db } from '../services/mockDb';
import { transformCsvData, applyTransformationToFullData } from '../services/geminiService';
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
    const [isProcessingFull, setIsProcessingFull] = useState(false);
    
    // State for transformation review
    const [pendingTransformation, setPendingTransformation] = useState<{ newCsv: string, pythonCode: string } | null>(null);
    const [lastCommittedCode, setLastCommittedCode] = useState<string | null>(null);

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
        setLastCommittedCode(file.versions.length > 0 ? file.versions[0].pythonCode : null);
        setPendingTransformation(null); // Reset pending state on file switch
    };

    const parseCsv = (content: string) => {
        const lines = content.trim().split('\n');
        // Handle basic CSV parsing, including quoted fields if possible, but basic split for now
        const rows = lines.map(line => line.split(',')); 
        setCsvRows(rows.slice(0, 100)); // Limit for performance in preview
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

    const handleDownload = async () => {
        if (!activeFile) return;
        
        let contentToDownload = activeFile.content;
        let fileName = activeFile.name;

        // If we are in preview mode, we need to generate the FULL result first
        if (pendingTransformation) {
            setIsProcessingFull(true);
            try {
                // Apply the python code to the FULL active file content
                const fullResult = await applyTransformationToFullData(activeFile.content, pendingTransformation.pythonCode);
                contentToDownload = fullResult;
                fileName = `transformed_${activeFile.name}`;
            } catch (e) {
                alert("Failed to process full file for download.");
                setIsProcessingFull(false);
                return;
            } finally {
                setIsProcessingFull(false);
            }
        }
        
        const blob = new Blob([contentToDownload], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    const handleTransformation = async () => {
        if (!prompt || !activeFile || !project) return;
        setIsLoading(true);
        try {
            const { newCsv, pythonCode } = await transformCsvData(activeFile.content, prompt);
            
            // Do NOT save yet. Set as pending preview.
            setPendingTransformation({ newCsv, pythonCode });
            
            // Update the preview table immediately
            parseCsv(newCsv);
            
        } catch (err) {
            alert("Transformation failed. See console.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAcceptTransformation = async () => {
        if (!pendingTransformation || !activeFile || !project) return;
        
        setIsProcessingFull(true);

        try {
            // 1. Apply the code to the FULL dataset
            const fullResultCsv = await applyTransformationToFullData(activeFile.content, pendingTransformation.pythonCode);

            // 2. Save the full result
            await db.updateFileVersion(
                project.id, 
                activeFile.id, 
                fullResultCsv, 
                prompt, 
                pendingTransformation.pythonCode
            );
            
            // Refresh state
            await loadProject();
            
            setPendingTransformation(null);
            setPrompt('');
        } catch (e) {
            console.error(e);
            alert("Failed to process full dataset and save version");
        } finally {
            setIsProcessingFull(false);
        }
    };

    const handleRejectTransformation = () => {
        if (!activeFile) return;
        
        // Revert table to original content
        parseCsv(activeFile.content);
        
        // Clear pending state
        setPendingTransformation(null);
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
                <div className="flex items-center gap-2">
                     <Button variant="ghost" onClick={handleDownload} disabled={!activeFile || isProcessingFull} title="Download CSV">
                        {isProcessingFull ? <Icons.Spinner /> : <Icons.Download />} <span className="ml-2">{isProcessingFull ? 'Processing Full File...' : 'Download'}</span>
                     </Button>
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
                         {/* Pending Preview Banner */}
                         {pendingTransformation && (
                             <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-2 flex justify-between items-center text-sm text-yellow-800">
                                 <span className="font-medium flex items-center gap-2">
                                     <span className="relative flex h-3 w-3">
                                       <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                                       <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                                     </span>
                                     Previewing Transformation Results (First 100 rows)
                                 </span>
                                 <span className="text-xs opacity-75">Click Accept to apply changes to the FULL dataset.</span>
                             </div>
                         )}

                         {/* Code Preview Logic */}
                         {(lastCommittedCode || pendingTransformation) && (
                             <div className="bg-slate-900 p-0 text-xs text-white max-h-48 overflow-y-auto shrink-0 border-b border-slate-700">
                                 <div className="px-4 py-1 bg-slate-800 border-b border-slate-700 text-slate-400 font-mono text-[10px] uppercase tracking-wider flex justify-between">
                                     <span>{pendingTransformation ? "Proposed Python Operation" : "Last Applied Operation"}</span>
                                 </div>
                                 <div className="p-2">
                                    <pre className="font-mono">{pendingTransformation ? pendingTransformation.pythonCode : lastCommittedCode}</pre>
                                 </div>
                             </div>
                         )}

                        {/* CSV Table Preview */}
                        <div className={`flex-1 overflow-auto p-6 ${pendingTransformation ? 'pb-32' : 'pb-24'}`}> 
                            <Card className={`overflow-hidden transition-all ${pendingTransformation ? 'ring-2 ring-yellow-400 shadow-lg' : ''}`}>
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
                                <div className="px-6 py-3 bg-slate-50 text-xs text-slate-500 border-t flex justify-between">
                                    <span>Showing first 100 rows.</span>
                                    <span>{pendingTransformation ? "PREVIEW MODE" : `Version: v${activeFile.versions.length}`}</span>
                                </div>
                            </Card>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-400">
                        Select or upload a file to begin.
                    </div>
                )}
                
                {/* Bottom Action Bar */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-20">
                     <Card className="p-2 shadow-2xl border-accent/20 ring-1 ring-accent/10 bg-white/95 backdrop-blur-sm">
                        
                        {pendingTransformation ? (
                            // REVIEW MODE CONTROLS
                            <div className="flex flex-col gap-2 p-2">
                                <div className="text-sm font-medium text-slate-700 mb-2 text-center">
                                    Does this transformation look correct?
                                </div>
                                <div className="flex gap-3 justify-center">
                                    <Button onClick={handleRejectTransformation} disabled={isProcessingFull} variant="destructive" className="flex-1">
                                        <Icons.X /> <span className="ml-2">Reject & Discard</span>
                                    </Button>
                                    <Button onClick={handleAcceptTransformation} disabled={isProcessingFull} variant="success" className="flex-1">
                                        {isProcessingFull ? <Icons.Spinner /> : <Icons.Check />} 
                                        <span className="ml-2">{isProcessingFull ? "Processing Full Dataset..." : "Accept & Save"}</span>
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            // NORMAL CHAT INPUT MODE
                            <div className="flex gap-2 items-center">
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
                            </div>
                        )}
                     </Card>
                </div>
            </div>
        </div>
    );
};

export default TransformationView;