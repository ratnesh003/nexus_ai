import React, { useState, useEffect } from "react";
import { db } from "../services/mockDb";
import { generateDashboardData } from "../services/geminiService";
import { DataFile, DashboardData, ChartConfig } from "../types";
import { Button, Card, Icons, Badge } from "./ui";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  RadialBarChart,
  RadialBar,
} from "recharts";

interface DashboardViewProps {
  projectId: string;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

const DashboardView: React.FC<DashboardViewProps> = ({ projectId }) => {
  const [project, setProject] = useState<any>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [appending, setAppending] = useState(false); // State for adding more analysis
  const [activeTab, setActiveTab] = useState("main"); // 'main', 'bar', 'pie', 'line', 'radar', 'radial'

  useEffect(() => {
    loadProjectData();
  }, [projectId]);

  const loadProjectData = async () => {
    const p = await db.getProjectById(projectId);
    setProject(p);

    // If the project already has dashboard data saved, load it!
    if (
      p &&
      p.dashboardData &&
      (p.dashboardData.mainStats.length > 0 ||
        p.dashboardData.charts.length > 0)
    ) {
      setData(p.dashboardData);
    } else if (p && p.files.length > 0) {
      // Initial generation if no data exists
      generateFreshDashboard(p.files[0]);
    }
  };

  const generateFreshDashboard = async (file: DataFile) => {
    setLoading(true);
    try {
      const dashboardData = await generateDashboardData(file.content);
      setData(dashboardData);
      await db.saveDashboardData(projectId, dashboardData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshAnalysis = async () => {
    const activeFile = project?.files[0];
    if (activeFile) {
      // This wipes the current data and starts fresh
      await generateFreshDashboard(activeFile);
    }
  };

  const handleAddAnalysis = async () => {
    const activeFile = project?.files[0];
    if (!activeFile) return;

    setAppending(true);
    try {
      // Generate NEW set of charts
      const newDashboardData = await generateDashboardData(activeFile.content);

      // Append to existing state
      setData((prev) => {
        if (!prev) return newDashboardData;
        const merged: DashboardData = {
          mainStats: [...prev.mainStats, ...newDashboardData.mainStats],
          charts: [...prev.charts, ...newDashboardData.charts],
        };
        // Persist merged data
        db.saveDashboardData(projectId, merged);
        return merged;
      });
    } catch (e) {
      console.error("Failed to append analysis", e);
    } finally {
      setAppending(false);
    }
  };

  const renderChart = (config: ChartConfig) => {
    const CommonTooltip = () => (
      <ReTooltip
        contentStyle={{
          borderRadius: "8px",
          border: "none",
          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
        }}
      />
    );
    const type = config.type.toLowerCase();

    switch (type) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={config.data}
              margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e2e8f0"
              />
              <XAxis
                dataKey="name"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis fontSize={12} tickLine={false} axisLine={false} />
              <CommonTooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      case "line":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={config.data}
              margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e2e8f0"
              />
              <XAxis
                dataKey="name"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis fontSize={12} tickLine={false} axisLine={false} />
              <CommonTooltip />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#8884d8"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      case "pie":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={config.data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {config.data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <CommonTooltip />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        );
      case "radar":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={config.data}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="name" fontSize={11} />
              <PolarRadiusAxis angle={30} domain={[0, "auto"]} />
              <Radar
                name={config.title}
                dataKey="value"
                stroke="#82ca9d"
                fill="#82ca9d"
                fillOpacity={0.6}
              />
              <CommonTooltip />
            </RadarChart>
          </ResponsiveContainer>
        );
      case "radial":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="10%"
              outerRadius="80%"
              barSize={10}
              data={config.data}
            >
              <RadialBar
                label={{ position: "insideStart", fill: "#fff" }}
                background
                dataKey="value"
              />
              <Legend
                iconSize={10}
                layout="vertical"
                verticalAlign="middle"
                wrapperStyle={{
                  top: "50%",
                  right: 0,
                  transform: "translate(0, -50%)",
                  lineHeight: "24px",
                }}
              />
              <CommonTooltip />
            </RadialBarChart>
          </ResponsiveContainer>
        );
      default:
        return (
          <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
            Unsupported chart type: {type}
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
        <p className="text-muted-foreground animate-pulse">
          AI is analyzing your data and generating visualizations...
        </p>
      </div>
    );
  }

  if (!data)
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full text-center space-y-4">
        <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
          <Icons.Chart />
        </div>
        <p className="text-muted-foreground">
          No dashboard data generated yet.
        </p>
        {project?.files.length > 0 ? (
          <Button onClick={handleRefreshAnalysis} variant="secondary">
            Retry Generation
          </Button>
        ) : (
          <p className="text-sm text-slate-400">
            Upload a CSV file in the Transformation tab to begin.
          </p>
        )}
      </div>
    );

  const getChartsForTab = () => {
    const allCharts = [...(data.mainStats || []), ...(data.charts || [])];

    if (activeTab === "main") {
      // Main tab logic: Show first chart of every available type
      const types = ["bar", "pie", "line", "radar", "radial"];
      const distinctCharts = [];

      // Always include the first 'mainStats' item if it exists
      if (data.mainStats && data.mainStats.length > 0) {
        distinctCharts.push(data.mainStats[0]);
      }

      // Then find the first of each other type from the rest
      types.forEach((t) => {
        const found = allCharts.find(
          (c) => c.type.toLowerCase() === t && c !== data.mainStats[0]
        );
        if (found) distinctCharts.push(found);
      });

      // Deduplicate just in case
      return Array.from(new Set(distinctCharts));
    }

    return allCharts.filter((c) => c.type.toLowerCase() === activeTab);
  };

  return (
    <div className="flex h-full bg-slate-50">
      {/* Dashboard Sidebar */}
      <div className="w-56 bg-white border-r border-border p-4 space-y-1 flex-shrink-0">
        <div className="text-xs font-semibold text-muted-foreground uppercase mb-3 px-2">
          Visualization Type
        </div>
        {["main", "bar", "pie", "line", "radar", "radial"].map((type) => (
          <button
            key={type}
            onClick={() => setActiveTab(type)}
            className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors flex justify-between items-center ${
              activeTab === type
                ? "bg-accent/10 text-accent"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span>{type.charAt(0).toUpperCase() + type.slice(1)} Charts</span>
            {activeTab === type && (
              <div className="h-1.5 w-1.5 rounded-full bg-accent"></div>
            )}
          </button>
        ))}
      </div>

      {/* Main Dashboard Area */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-primary">
              {activeTab === "main"
                ? "Executive Overview"
                : `${
                    activeTab.charAt(0).toUpperCase() + activeTab.slice(1)
                  } Analytics`}
            </h2>
            <p className="text-muted-foreground">
              AI-generated insights for {project?.files[0]?.name}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleAddAnalysis}
              disabled={appending}
            >
              {appending ? <Icons.Spinner /> : <Icons.Plus />}{" "}
              <span className="ml-2">Add Analysis</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleRefreshAnalysis}>
              <Icons.Spinner /> <span className="ml-2">Reset & Refresh</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 pb-10">
          {getChartsForTab().map((chart, idx) => (
            <Card
              key={idx}
              className={`p-6 flex flex-col h-80 shadow-sm hover:shadow-md transition-shadow ${
                activeTab === "main" && idx === 0
                  ? "md:col-span-2 border-l-4 border-l-accent"
                  : ""
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <h4
                  className="font-medium text-slate-800 truncate"
                  title={chart.title}
                >
                  {chart.title}
                </h4>
                <Badge variant="outline">{chart.type}</Badge>
              </div>
              <p className="text-xs text-slate-500 mb-4 truncate">
                {chart.description}
              </p>
              <div className="flex-1 w-full min-h-0 relative">
                {renderChart(chart)}
              </div>
            </Card>
          ))}

          {getChartsForTab().length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 border-2 border-dashed rounded-lg bg-slate-50/50">
              No charts available for this category. The AI did not generate a{" "}
              {activeTab} chart for this data.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
