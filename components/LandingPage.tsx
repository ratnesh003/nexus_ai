import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Icons } from './ui';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-primary flex flex-col">
            <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded bg-accent flex items-center justify-center text-white font-bold">D</div>
                    <span className="font-bold text-white text-xl">DataNexus AI</span>
                </div>
                <div className="flex gap-4">
                    <Button variant="ghost" className="text-white hover:text-white/80" onClick={() => navigate('/login')}>Sign In</Button>
                    <Button onClick={() => navigate('/register')}>Get Started</Button>
                </div>
            </nav>

            <main className="flex-1 flex flex-col items-center justify-center text-center px-4">
                <div className="max-w-3xl space-y-8 animate-fade-in">
                    <div className="inline-flex items-center rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-sm font-medium text-accent backdrop-blur-xl">
                        <span className="flex h-2 w-2 rounded-full bg-accent mr-2"></span>
                        New: Gemini 2.5 Integration
                    </div>
                    
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white">
                        Talk to your data like <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">never before.</span>
                    </h1>
                    
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                        Upload CSVs, ask questions in plain English, and generate beautiful dashboards instantly. 
                        Powered by MongoDB for scale and Gemini for intelligence.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                        <Button className="h-12 px-8 text-lg" onClick={() => navigate('/register')}>
                            Start Building Projects <Icons.ChevronRight />
                        </Button>
                        <Button variant="secondary" className="h-12 px-8 text-lg" onClick={() => navigate('/login')}>
                            View Demo
                        </Button>
                    </div>

                    <div className="pt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                        {[
                            { title: "Transformation", desc: "Clean and filter data using natural language prompts.", icon: <Icons.File /> },
                            { title: "Smart Chat", desc: "Ask questions about your sales, revenue, and more.", icon: <Icons.Message /> },
                            { title: "Auto Dashboard", desc: "Generate complex charts and reports in seconds.", icon: <Icons.Chart /> },
                        ].map((feat, i) => (
                            <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-accent/50 transition-colors">
                                <div className="h-10 w-10 rounded-lg bg-accent/20 flex items-center justify-center text-accent mb-4">
                                    {feat.icon}
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">{feat.title}</h3>
                                <p className="text-slate-400">{feat.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            <footer className="py-8 text-center text-slate-600 text-sm">
                © 2025 DataNexus AI. Powered by Google Gemini & MongoDB.
            </footer>
        </div>
    );
};

export default LandingPage;
