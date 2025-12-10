import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/mockDb';
import { chatWithData } from '../services/geminiService';
import { ChatMessage, DataFile, Project } from '../types';
import { Button, Input, Card, Icons, CodeBlock } from './ui';

interface ChatDataViewProps {
    projectId: string;
}

const ChatDataView: React.FC<ChatDataViewProps> = ({ projectId }) => {
    const [project, setProject] = useState<Project | undefined>(undefined);
    const [activeFile, setActiveFile] = useState<DataFile | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: '1', role: 'assistant', content: 'Hello! Ask me any question about your data.', timestamp: new Date().toISOString() }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadProject = async () => {
            try {
                const fetchedProject = await db.getProjectById(projectId);
                setProject(fetchedProject);
                if (fetchedProject && fetchedProject.files.length > 0) {
                    setActiveFile(fetchedProject.files[0]);
                }
            } catch (e) {
                console.error("Failed to load project", e);
            }
        };
        loadProject();
    }, [projectId]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || !activeFile) return;
        
        const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: input, timestamp: new Date().toISOString() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const history = messages.map(m => ({ role: m.role, content: m.content }));
            const response = await chatWithData(activeFile.content, history, userMsg.content);
            
            const botMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response.answer,
                codeSnippet: response.pythonCode,
                timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: "Error processing request.", timestamp: new Date().toISOString() }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!project) return <div className="h-full flex items-center justify-center"><Icons.Spinner /></div>;

    return (
        <div className="flex flex-col h-full bg-slate-50">
             <div className="border-b bg-white p-4 flex justify-between items-center">
                <h2 className="font-semibold text-lg">Data Chat</h2>
                <div className="text-sm text-slate-500">
                    Context: <span className="font-medium text-foreground">{activeFile?.name}</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex gap-3 max-w-3xl ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-accent text-white' : 'bg-green-600 text-white'}`}>
                                {msg.role === 'user' ? <span className="text-xs font-bold">U</span> : <Icons.Bot />}
                            </div>
                            <div className={`space-y-2 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                                <Card className={`p-4 ${msg.role === 'user' ? 'bg-accent text-black border-accent' : 'bg-white'}`}>
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                </Card>
                                {msg.codeSnippet && (
                                    <div className="w-full text-left">
                                        <div className="text-xs text-slate-500 mb-1 ml-1">Analysis Logic:</div>
                                        <CodeBlock code={msg.codeSnippet} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="flex gap-3">
                            <div className="h-8 w-8 rounded-full bg-green-600 text-white flex items-center justify-center"><Icons.Bot /></div>
                            <Card className="p-4 bg-white flex items-center"><Icons.Spinner /></Card>
                        </div>
                    </div>
                )}
                <div ref={scrollRef} />
            </div>

            <div className="p-4 bg-white border-t">
                <div className="flex gap-2 max-w-4xl mx-auto">
                    <Input 
                        value={input} 
                        onChange={(e) => setInput(e.target.value)} 
                        placeholder="Ask about sales, trends, or stats..." 
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <Button onClick={handleSend} disabled={isLoading || !activeFile}>
                        <Icons.Send />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ChatDataView;