import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Icons, Card } from './ui';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, AreaChart, Area } from 'recharts';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    // --- Dashboard Animation State ---
    const [isLoaded, setIsLoaded] = useState(false);
    
    useEffect(() => {
        // Initial Loading Phase (2s) then pop everything up
        const loadTimer = setTimeout(() => setIsLoaded(true), 2000);
        return () => clearTimeout(loadTimer);
    }, []);

    // Mock Data for Dashboard
    const barData = [{name:'Q1', v:400}, {name:'Q2', v:300}, {name:'Q3', v:550}, {name:'Q4', v:450}];
    const lineData = [{name:'Jan', v:100}, {name:'Feb', v:230}, {name:'Mar', v:180}, {name:'Apr', v:320}, {name:'May', v:450}];
    const pieData = [{name:'Mobile', v:400}, {name:'Desktop', v:300}, {name:'Tablet', v:100}];
    const areaData = [{name:'1', v:400}, {name:'2', v:300}, {name:'3', v:200}, {name:'4', v:278}, {name:'5', v:189}, {name:'6', v:239}, {name:'7', v:349}];
    const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'];

    // --- Chat Animation State ---
    // We want an infinite loop of messages sliding up
    const [visibleMessages, setVisibleMessages] = useState<any[]>([]);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const chatScenarios = [
        { role: 'user', text: "Filter sales > $5000" },
        { role: 'bot', text: "Filtered. 450 rows remain.", code: "df = df[df['Sales'] > 5000]" },
        { role: 'user', text: "Group by Region and sum Profit" },
        { role: 'bot', text: "Here is the summary.", code: "df.groupby('Region')['Profit'].sum()" },
        { role: 'user', text: "Visualize the trend of Users" },
        { role: 'bot', text: "Generating Line Chart...", code: "px.line(df, x='Date', y='Users')" },
        { role: 'user', text: "Find outliers in Transaction Amount" },
        { role: 'bot', text: "Detected 3 anomalies.", code: "df[np.abs(zscore(df['Amount'])) > 3]" },
    ];

    useEffect(() => {
        let index = 0;
        const interval = setInterval(() => {
            const nextMsg = chatScenarios[index % chatScenarios.length];
            
            setVisibleMessages(prev => {
                const newArr = [...prev, { ...nextMsg, id: Date.now() }];
                if (newArr.length > 5) return newArr.slice(newArr.length - 5); // Keep last 5 to prevent DOM bloat
                return newArr;
            });

            index++;
        }, 2000); // New message every 2 seconds

        return () => clearInterval(interval);
    }, []);

    // Auto-scroll logic (though we use flex-col-reverse visual trick usually, here we just let it animate in)
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [visibleMessages]);


    return (
        // Fixed: Use h-screen overflow-y-auto to allow scrolling within the fixed body container
        <div className="h-screen overflow-y-auto bg-slate-950 flex flex-col text-slate-50 selection:bg-blue-500 selection:text-white">
            
            {/* Navigation */}
            <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-slate-900/80 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-900/20">D</div>
                        <span className="font-bold text-white text-xl tracking-tight">DataNexus AI</span>
                    </div>
                    <div className="flex gap-4">
                        <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/5" onClick={() => navigate('/login')}>Sign In</Button>
                        <Button className="bg-blue-600 hover:bg-blue-500 text-white border-0" onClick={() => navigate('/register')}>Get Started</Button>
                    </div>
                </div>
            </nav>

            <main className="flex-1 w-full">
                
                {/* Hero Section */}
                <div className="relative pt-20 pb-32 overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-500/20 rounded-[100%] blur-[100px] -z-10 opacity-50 pointer-events-none"></div>
                    
                    <div className="max-w-4xl mx-auto px-6 text-center space-y-8">
                        <div className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400 backdrop-blur-xl animate-fade-in-up">
                            <span className="flex h-2 w-2 rounded-full bg-blue-400 mr-2 animate-pulse"></span>
                            Powered by Gemini 2.5 Flash
                        </div>
                        
                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.1] animate-slide-up">
                            Your Personal <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">AI Data Analyst</span>
                        </h1>
                        
                        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed animate-slide-up" style={{animationDelay: '0.1s'}}>
                            Stop wrestling with spreadsheets. Just ask questions in plain English, 
                            and let our AI clean, analyze, and visualize your insights in seconds.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8 animate-slide-up" style={{animationDelay: '0.2s'}}>
                            <Button className="h-12 px-8 text-lg bg-blue-600 hover:bg-blue-500 border-0 shadow-lg shadow-blue-900/40" onClick={() => navigate('/register')}>
                                Start Analyzing for Free <Icons.ChevronRight />
                            </Button>
                            <Button variant="secondary" className="h-12 px-8 text-lg bg-slate-800 hover:bg-slate-700 text-white border border-slate-700" onClick={() => navigate('/login')}>
                                View Live Demo
                            </Button>
                        </div>

                        {/* 3D Dashboard Preview Container */}
                        <div className="mt-16 perspective-1000">
                             <div className={`rotate-x-12 transform-style-3d transition-all duration-1000 ${isLoaded ? 'rotate-x-0' : 'rotate-x-12'}`}>
                                 <div className="rounded-xl border border-white/10 bg-slate-900/90 shadow-2xl backdrop-blur-sm p-4 overflow-hidden relative min-h-[500px] flex flex-col">
                                     
                                     {/* Header Mockup */}
                                     <div className="flex items-center gap-4 border-b border-white/5 pb-4 mb-4">
                                         <div className="h-3 w-3 rounded-full bg-red-500"></div>
                                         <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                                         <div className="h-3 w-3 rounded-full bg-green-500"></div>
                                         <div className="ml-4 h-6 w-64 bg-slate-800 rounded-md"></div>
                                     </div>

                                     {/* SKELETON LOADER (Visible only when !isLoaded) */}
                                     {!isLoaded && (
                                         <div className="absolute inset-0 top-16 flex flex-col items-center justify-center bg-slate-900/50 z-20 backdrop-blur-sm">
                                             <div className="flex gap-1 mb-4">
                                                 <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
                                                 <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                                 <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                             </div>
                                             <div className="text-blue-400 font-mono text-sm animate-pulse">Generating Dashboard...</div>
                                         </div>
                                     )}

                                     {/* MAIN DASHBOARD GRID (ALL CHARTS POP UP AT ONCE) */}
                                     <div className={`grid grid-cols-12 gap-4 flex-1 transition-all duration-700 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                                         
                                         {/* Sidebar Mockup */}
                                         <div className="col-span-2 bg-slate-800/50 rounded-lg p-3 space-y-3 hidden md:block">
                                             <div className="h-8 bg-blue-500/20 rounded w-full"></div>
                                             <div className="h-8 bg-slate-800 rounded w-full"></div>
                                             <div className="h-8 bg-slate-800 rounded w-full"></div>
                                             <div className="h-8 bg-slate-800 rounded w-full"></div>
                                         </div>

                                         {/* Charts Area */}
                                         <div className="col-span-12 md:col-span-10 grid grid-cols-2 grid-rows-2 gap-4 h-full">
                                             
                                             {/* Chart 1: Revenue (Area) */}
                                             <div className="col-span-2 md:col-span-1 bg-slate-800/50 rounded-lg p-4 border border-white/5 relative overflow-hidden group hover:border-blue-500/30 transition-colors">
                                                 <h3 className="text-xs text-slate-400 uppercase font-semibold mb-2">Revenue Trend</h3>
                                                 <ResponsiveContainer width="100%" height="80%">
                                                     <AreaChart data={areaData}>
                                                         <defs>
                                                             <linearGradient id="colorV" x1="0" y1="0" x2="0" y2="1">
                                                                 <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                                                 <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                                             </linearGradient>
                                                         </defs>
                                                         <Area type="monotone" dataKey="v" stroke="#3b82f6" fillOpacity={1} fill="url(#colorV)" />
                                                     </AreaChart>
                                                 </ResponsiveContainer>
                                             </div>

                                             {/* Chart 2: Distribution (Pie) */}
                                             <div className="col-span-1 bg-slate-800/50 rounded-lg p-4 border border-white/5 relative overflow-hidden group hover:border-purple-500/30 transition-colors hidden sm:block">
                                                  <h3 className="text-xs text-slate-400 uppercase font-semibold mb-2">Category Share</h3>
                                                  <ResponsiveContainer width="100%" height="80%">
                                                     <PieChart>
                                                         <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="v" paddingAngle={5}>
                                                             {pieData.map((entry, index) => (
                                                                 <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                             ))}
                                                         </Pie>
                                                     </PieChart>
                                                 </ResponsiveContainer>
                                             </div>

                                             {/* Chart 3: Quarterly (Bar) */}
                                             <div className="col-span-2 bg-slate-800/50 rounded-lg p-4 border border-white/5 relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
                                                 <h3 className="text-xs text-slate-400 uppercase font-semibold mb-2">Performance by Quarter</h3>
                                                 <ResponsiveContainer width="100%" height="80%">
                                                     <BarChart data={barData}>
                                                         <Bar dataKey="v" fill="#10b981" radius={[4, 4, 0, 0]} />
                                                     </BarChart>
                                                 </ResponsiveContainer>
                                             </div>

                                         </div>
                                     </div>

                                 </div>
                             </div>
                        </div>
                    </div>
                </div>

                {/* Features Grid */}
                <div className="py-24 bg-slate-900/50 border-y border-white/5">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold text-white">Everything you need to master your data</h2>
                            <p className="text-slate-400 mt-4">Replace your entire data stack with one intelligent platform.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                { 
                                    title: "Natural Language ETL", 
                                    desc: "Clean messy data without writing a single line of code. Just tell the AI: 'Remove duplicates and format dates.'", 
                                    icon: <Icons.File />,
                                    color: "text-blue-400 bg-blue-400/10"
                                },
                                { 
                                    title: "Conversational Insights", 
                                    desc: "Chat with your CSVs like a colleague. Ask 'Why did sales drop in Q3?' and get evidence-backed answers.", 
                                    icon: <Icons.Message />,
                                    color: "text-purple-400 bg-purple-400/10"
                                },
                                { 
                                    title: "Instant Dashboards", 
                                    desc: "The AI automatically detects patterns and generates professional Bar, Line, and Radar charts for you.", 
                                    icon: <Icons.Chart />,
                                    color: "text-emerald-400 bg-emerald-400/10"
                                },
                            ].map((feat, i) => (
                                <div key={i} className="group p-8 rounded-2xl bg-slate-900 border border-white/5 hover:border-blue-500/30 hover:bg-slate-800/50 transition-all duration-300">
                                    <div className={`h-12 w-12 rounded-lg ${feat.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                        {feat.icon}
                                    </div>
                                    <h3 className="text-xl font-semibold text-white mb-3">{feat.title}</h3>
                                    <p className="text-slate-400 leading-relaxed">{feat.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* How it works */}
                <div className="py-24 max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div className="space-y-8">
                            <h2 className="text-3xl md:text-4xl font-bold text-white">Your AI Data Scientist,<br/>Available 24/7</h2>
                            <p className="text-lg text-slate-400">
                                DataNexus acts as an intelligent layer between you and your raw files. 
                                It understands context, writes Python code in the background, and delivers results securely.
                            </p>
                            
                            <div className="space-y-6">
                                {[
                                    { step: "01", title: "Upload Data", text: "Drag & drop CSV files securely. We handle the parsing." },
                                    { step: "02", title: "Ask Questions", text: "Type queries in English. No SQL or Python knowledge required." },
                                    { step: "03", title: "Get Results", text: "Receive cleaned datasets, answers, and visualizations instantly." }
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="font-mono text-blue-500 font-bold text-xl pt-1">{item.step}</div>
                                        <div>
                                            <h4 className="text-white font-semibold text-lg">{item.title}</h4>
                                            <p className="text-slate-500">{item.text}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Animated Chat Infinite Loop */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-blue-500/20 blur-[100px] rounded-full opacity-30"></div>
                            <div className="relative bg-slate-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl h-[400px] flex flex-col">
                                {/* Chat Header */}
                                <div className="p-4 border-b border-white/5 bg-slate-800/50 flex items-center gap-3">
                                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                                    <div className="text-sm font-medium text-slate-300">DataNexus Assistant</div>
                                </div>
                                
                                {/* Messages Area */}
                                <div ref={chatContainerRef} className="flex-1 p-4 space-y-4 overflow-y-hidden flex flex-col justify-end">
                                    {visibleMessages.map((msg, i) => (
                                        <div key={msg.id} className={`flex gap-3 animate-slide-up ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                            <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-600' : 'bg-green-600'}`}>
                                                {msg.role === 'user' ? 'U' : <Icons.Bot />}
                                            </div>
                                            <div className={`max-w-[80%] rounded-2xl p-3 text-sm ${msg.role === 'user' ? 'bg-blue-600/20 text-blue-100 rounded-tr-none' : 'bg-slate-800 text-slate-300 rounded-tl-none'}`}>
                                                <p>{msg.text}</p>
                                                {msg.code && (
                                                    <div className="mt-2 bg-black/30 p-2 rounded border border-white/5 font-mono text-xs text-green-400">
                                                        {msg.code}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-3 bg-slate-800/30 border-t border-white/5">
                                    <div className="h-2 w-24 bg-slate-700 rounded animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Testimonials */}
                <div className="py-24 bg-slate-900/50 border-t border-white/5">
                    <div className="max-w-7xl mx-auto px-6 text-center">
                         <h2 className="text-3xl font-bold text-white mb-16">Trusted by Analysts at Innovative Companies</h2>
                         
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                {
                                    quote: "DataNexus cut my reporting time by 90%. I just upload the weekly export and ask it to generate the slide deck charts.",
                                    author: "Sarah J.",
                                    role: "Marketing Director",
                                    company: "TechFlow"
                                },
                                {
                                    quote: "The ability to transform messy CSVs with just a sentence is a game changer. No more spending hours in Excel cleaning rows.",
                                    author: "David Chen",
                                    role: "Operations Lead",
                                    company: "LogiStream"
                                },
                                {
                                    quote: "It's like having a junior data scientist who never sleeps. The Python code transparency gives me confidence in the results.",
                                    author: "Emily R.",
                                    role: "Financial Analyst",
                                    company: "Apex Capital"
                                }
                            ].map((t, i) => (
                                <div key={i} className="bg-slate-950 p-6 rounded-xl border border-white/5 text-left">
                                    <div className="flex gap-1 text-yellow-500 mb-4">★★★★★</div>
                                    <p className="text-slate-300 mb-6 italic">"{t.quote}"</p>
                                    <div>
                                        <div className="font-semibold text-white">{t.author}</div>
                                        <div className="text-xs text-slate-500">{t.role}, {t.company}</div>
                                    </div>
                                </div>
                            ))}
                         </div>
                    </div>
                </div>

                {/* CTA */}
                <div className="py-24 px-6 text-center">
                    <div className="max-w-3xl mx-auto bg-gradient-to-br from-blue-900/50 to-indigo-900/50 border border-blue-500/30 rounded-3xl p-12 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 blur-[80px] -mr-32 -mt-32"></div>
                        <div className="relative z-10 space-y-6">
                            <h2 className="text-3xl font-bold text-white">Ready to unlock your data's potential?</h2>
                            <p className="text-blue-100 text-lg">Join thousands of users making smarter decisions with DataNexus AI.</p>
                            <Button className="h-12 px-8 text-lg bg-white text-blue-900 hover:bg-blue-50" onClick={() => navigate('/register')}>
                                Get Started for Free
                            </Button>
                        </div>
                    </div>
                </div>

            </main>

            <footer className="py-8 text-center text-slate-600 text-sm bg-slate-950 border-t border-white/5">
                <div className="flex justify-center gap-6 mb-4">
                    <a href="#" className="hover:text-white transition-colors">Privacy</a>
                    <a href="#" className="hover:text-white transition-colors">Terms</a>
                    <a href="#" className="hover:text-white transition-colors">Contact</a>
                </div>
                <p>© 2025 DataNexus AI. Powered by Google Gemini & MongoDB.</p>
            </footer>
        </div>
    );
};

export default LandingPage;