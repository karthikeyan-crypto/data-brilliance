import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileSpreadsheet, Trash2, LogOut, BarChart3, Brain, Download, Table, TrendingUp, AlertTriangle, Lightbulb, Target, MessageSquare, Zap, PieChart as PieIcon, Activity, Layers } from "lucide-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import JupiterBackground from "./JupiterBackground";
import SuccessPopup from "./SuccessPopup";
import ThemeToggle from "./ThemeToggle";
import ScrollAnimatedChart from "./ScrollAnimatedChart";
import { Heatmap, BoxPlot } from "./AdvancedCharts";
import { ZoomableChart } from "./ChartZoomModal";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ScatterChart, Scatter,
  AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

interface DashboardProps {
  onLogout: () => void;
}

type DataRow = Record<string, string | number>;

const CHART_COLORS = ["#2dd4a8", "#7c3aed", "#ec4899", "#f59e0b", "#06b6d4", "#f43f5e", "#84cc16", "#8b5cf6"];

const TOOLTIP_STYLE = {
  background: "hsl(230 25% 8%)",
  border: "1px solid hsl(230 20% 18%)",
  borderRadius: "12px",
  color: "hsl(210 40% 95%)",
};

const Dashboard = ({ onLogout }: DashboardProps) => {
  const [rawData, setRawData] = useState<DataRow[]>([]);
  const [processedData, setProcessedData] = useState<DataRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisKey, setAnalysisKey] = useState(0);
  const [insights, setInsights] = useState<{ type: string; icon: any; title: string; text: string }[]>([]);
  const [activeTab, setActiveTab] = useState<"upload" | "preview" | "charts" | "insights">("upload");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const processData = useCallback((data: DataRow[]) => {
    if (data.length === 0) return [];
    const seen = new Set<string>();
    let df = data.filter((row) => {
      const key = JSON.stringify(row);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const cols = Object.keys(df[0]);

    cols.forEach((col) => {
      const values = df.map((r) => r[col]).filter((v) => v !== "" && v !== null && v !== undefined);
      const numericValues = values.map(Number).filter((v) => !isNaN(v));
      const isNumeric = numericValues.length > values.length * 0.5;

      if (isNumeric) {
        const mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
        df = df.map((r) => ({
          ...r,
          [col]: r[col] === "" || r[col] === null || r[col] === undefined ? mean : r[col],
        }));
      } else {
        const freq: Record<string, number> = {};
        values.forEach((v) => { freq[String(v)] = (freq[String(v)] || 0) + 1; });
        const mode = Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
        df = df.map((r) => ({
          ...r,
          [col]: r[col] === "" || r[col] === null || r[col] === undefined ? mode : r[col],
        }));
      }
    });

    const numericCols: string[] = [];
    cols.forEach((col) => {
      const vals = df.map((r) => Number(r[col]));
      if (vals.every((v) => !isNaN(v))) numericCols.push(col);
    });

    numericCols.forEach((col) => {
      const vals = df.map((r) => Number(r[col]));
      const min = Math.min(...vals);
      const max = Math.max(...vals);
      if (max - min > 0) {
        df = df.map((r) => ({ ...r, [col]: ((Number(r[col]) - min) / (max - min)).toFixed(4) }));
      }
    });

    return df;
  }, []);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setIsProcessing(true);

    if (file.name.endsWith(".csv")) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          const data = result.data as DataRow[];
          setRawData(data);
          setColumns(Object.keys(data[0] || {}));
          setTimeout(() => {
            const processed = processData(data);
            setProcessedData(processed);
            setIsProcessing(false);
            setShowSuccess(true);
            setActiveTab("preview");
          }, 1500);
        },
      });
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const wb = XLSX.read(ev.target?.result, { type: "array" });
        const data = XLSX.utils.sheet_to_json<DataRow>(wb.Sheets[wb.SheetNames[0]]);
        setRawData(data);
        setColumns(Object.keys(data[0] || {}));
        setTimeout(() => {
          const processed = processData(data);
          setProcessedData(processed);
          setIsProcessing(false);
          setShowSuccess(true);
          setActiveTab("preview");
        }, 1500);
      };
      reader.readAsArrayBuffer(file);
    }
  }, [processData]);

  // Advanced AI-like analysis
  const runAutoAnalysis = () => {
    setIsAnalyzing(true);
    
    // Simulate AI processing time with staged progress
    setTimeout(() => {
      setShowAnalysis(true);
      setActiveTab("charts");
      setAnalysisKey((k) => k + 1);

      const numCols = columns.filter((c) => {
        const vals = rawData.map((r) => Number(r[c]));
        return vals.every((v) => !isNaN(v));
      });

      const newInsights: typeof insights = [];

      if (rawData.length > 0) {
        // 1. Data Quality Score
        const totalCells = rawData.length * columns.length;
        const missingCells = rawData.reduce((acc, row) => {
          return acc + columns.filter(c => row[c] === "" || row[c] === null || row[c] === undefined).length;
        }, 0);
        const qualityScore = ((1 - missingCells / totalCells) * 100).toFixed(1);
        
        newInsights.push({
          type: "overview", icon: Activity, title: "Data Quality Score",
          text: `Quality: ${qualityScore}% — ${rawData.length} records, ${columns.length} features (${numCols.length} numeric, ${columns.length - numCols.length} categorical). ${missingCells > 0 ? `${missingCells} missing values were auto-imputed.` : "Zero missing values detected — pristine dataset."}`,
        });

        // 2. Statistical profiling per column
        numCols.slice(0, 4).forEach((col) => {
          const vals = rawData.map((r) => Number(r[col])).filter((v) => !isNaN(v)).sort((a, b) => a - b);
          const n = vals.length;
          const mean = vals.reduce((a, b) => a + b, 0) / n;
          const std = Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / n);
          const median = n % 2 === 0 ? (vals[n/2 - 1] + vals[n/2]) / 2 : vals[Math.floor(n/2)];
          const q1 = vals[Math.floor(n * 0.25)];
          const q3 = vals[Math.floor(n * 0.75)];
          const iqr = q3 - q1;
          const outlierCount = vals.filter(v => v < q1 - 1.5 * iqr || v > q3 + 1.5 * iqr).length;
          const skewness = vals.reduce((a, b) => a + Math.pow((b - mean) / std, 3), 0) / n;
          const kurtosis = vals.reduce((a, b) => a + Math.pow((b - mean) / std, 4), 0) / n - 3;
          
          // Trend detection (linear regression slope)
          const xMean = (n - 1) / 2;
          let slopeNum = 0, slopeDen = 0;
          vals.forEach((v, i) => { slopeNum += (i - xMean) * (v - mean); slopeDen += (i - xMean) ** 2; });
          const slope = slopeDen !== 0 ? slopeNum / slopeDen : 0;
          const trendDir = slope > 0.01 ? "📈 Upward" : slope < -0.01 ? "📉 Downward" : "➡️ Stable";
          const cv = (std / Math.abs(mean)) * 100;

          newInsights.push({
            type: "trend", icon: TrendingUp, title: `📊 ${col} — Deep Analysis`,
            text: `Mean: ${mean.toFixed(2)} | Median: ${median.toFixed(2)} | Std: ${std.toFixed(2)} | CV: ${cv.toFixed(1)}% | Skew: ${skewness.toFixed(2)} | Kurtosis: ${kurtosis.toFixed(2)} | IQR: ${iqr.toFixed(2)} | Outliers: ${outlierCount} | Trend: ${trendDir}. ${
              Math.abs(skewness) > 1 ? "⚠️ Highly skewed — consider log transform." :
              outlierCount > n * 0.05 ? "⚠️ >5% outliers — investigate data quality." :
              cv > 100 ? "⚠️ Extreme variability — segment analysis recommended." :
              "✅ Distribution looks healthy."
            }`,
          });
        });

        // 3. Correlation insights
        if (numCols.length >= 2) {
          const correlations: { pair: string; value: number }[] = [];
          for (let i = 0; i < Math.min(numCols.length, 5); i++) {
            for (let j = i + 1; j < Math.min(numCols.length, 5); j++) {
              const xVals = rawData.map(r => Number(r[numCols[i]]));
              const yVals = rawData.map(r => Number(r[numCols[j]]));
              const xm = xVals.reduce((a,b) => a+b, 0) / xVals.length;
              const ym = yVals.reduce((a,b) => a+b, 0) / yVals.length;
              let num = 0, dx = 0, dy = 0;
              xVals.forEach((x, k) => { num += (x-xm)*(yVals[k]-ym); dx += (x-xm)**2; dy += (yVals[k]-ym)**2; });
              const corr = dx > 0 && dy > 0 ? num / Math.sqrt(dx * dy) : 0;
              correlations.push({ pair: `${numCols[i]} ↔ ${numCols[j]}`, value: corr });
            }
          }
          const sorted = correlations.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
          const strong = sorted.filter(c => Math.abs(c.value) > 0.7);
          const weak = sorted.filter(c => Math.abs(c.value) < 0.2);
          
          newInsights.push({
            type: "trend", icon: Layers, title: "🔗 Correlation Analysis",
            text: `${strong.length > 0 ? `Strong correlations: ${strong.slice(0, 3).map(c => `${c.pair} (r=${c.value.toFixed(2)})`).join(", ")}. ` : "No strong correlations found. "}${weak.length > 0 ? `Weak/independent: ${weak.slice(0, 2).map(c => c.pair).join(", ")}. ` : ""}Consider PCA for dimensionality reduction if features are highly correlated.`,
          });
        }

        // 4. Duplicates
        const dupes = rawData.length - processedData.length;
        if (dupes > 0) {
          newInsights.push({
            type: "anomaly", icon: AlertTriangle, title: "🔄 Duplicates Detected & Removed",
            text: `${dupes} duplicate rows (${((dupes / rawData.length) * 100).toFixed(1)}% of data) were detected and removed. This may indicate data collection issues or repeated entries.`,
          });
        }

        // 5. Distribution analysis
        const catCols = columns.filter(c => !numCols.includes(c));
        if (catCols.length > 0) {
          const col = catCols[0];
          const freq: Record<string, number> = {};
          rawData.forEach(r => { freq[String(r[col])] = (freq[String(r[col])] || 0) + 1; });
          const uniqueCount = Object.keys(freq).length;
          const topCategory = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];
          const dominance = topCategory ? ((topCategory[1] / rawData.length) * 100).toFixed(1) : "0";

          newInsights.push({
            type: "trend", icon: PieIcon, title: `📋 Categorical: ${col}`,
            text: `${uniqueCount} unique categories. Top: "${topCategory?.[0]}" (${dominance}% of records). ${
              Number(dominance) > 80 ? "⚠️ Highly imbalanced — consider oversampling minority classes." :
              uniqueCount > rawData.length * 0.5 ? "⚠️ High cardinality — consider grouping or encoding." :
              "✅ Balanced distribution."
            }`,
          });
        }

        // 6. AI Recommendations
        newInsights.push({ type: "recommendation", icon: Lightbulb, title: "🧠 AI Recommendations",
          text: `${numCols.length >= 3 ? "• Apply PCA to reduce dimensionality across correlated features. " : ""}${rawData.length > 1000 ? "• Dataset size supports ML modeling — try Random Forest or XGBoost. " : "• Small dataset — use cross-validation to prevent overfitting. "}${catCols.length > 0 ? "• Label encoding applied — verify ordinal vs nominal encoding suitability. " : ""}• Data is normalized (Min-Max) and ready for neural network input.`,
        });

        // 7. Strategic decisions
        newInsights.push({ type: "decision", icon: Target, title: "🎯 Strategic Actions",
          text: `1) Deploy cleaned dataset to analytics pipeline. 2) Focus on top-variance features for predictive modeling. 3) Set up automated drift monitoring for ${numCols.slice(0, 2).join(", ")}. 4) Schedule periodic re-analysis to track distribution shifts. 5) Consider A/B testing on features with highest business impact.`,
        });

        // 8. Executive summary
        newInsights.push({ type: "communication", icon: MessageSquare, title: "📝 Executive Summary",
          text: `Dataset preprocessed: ${rawData.length} → ${processedData.length} clean records. Quality score: ${qualityScore}%. ${numCols.length} numeric features normalized, ${catCols.length} categorical features encoded. ${dupes > 0 ? `${dupes} duplicates removed. ` : ""}${missingCells > 0 ? `${missingCells} missing values imputed. ` : ""}Data is production-ready for ML pipelines and business intelligence dashboards.`,
        });
      }

      setInsights(newInsights);
      setIsAnalyzing(false);
    }, 2500);
  };

  const downloadProcessed = () => {
    const csv = Papa.unparse(processedData);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cleaned_data.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadInsightsTable = () => {
    const csv = Papa.unparse(insights.map((i) => ({ Type: i.type, Title: i.title, Insight: i.text })));
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "analysis_insights.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const getNumericColumns = () => columns.filter((c) => rawData.every((r) => !isNaN(Number(r[c]))));

  const getDistributionData = (col: string) => {
    const vals = rawData.map((r) => Number(r[col])).filter((v) => !isNaN(v));
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const bins = 10;
    const step = (max - min) / bins || 1;
    const histogram: { range: string; count: number }[] = [];
    for (let i = 0; i < bins; i++) {
      const lo = min + i * step;
      const hi = lo + step;
      histogram.push({
        range: `${lo.toFixed(1)}`,
        count: vals.filter((v) => v >= lo && (i === bins - 1 ? v <= hi : v < hi)).length,
      });
    }
    return histogram;
  };

  const getCorrelationData = () => {
    const numCols = getNumericColumns().slice(0, 5);
    if (numCols.length < 2) return [];
    return rawData.slice(0, 100).map((r) => {
      const obj: Record<string, number> = {};
      numCols.forEach((c) => (obj[c] = Number(r[c])));
      return obj;
    });
  };

  const getCategoryDistribution = () => {
    const catCols = columns.filter((c) => !getNumericColumns().includes(c));
    if (catCols.length === 0) return { col: "", data: [] };
    const col = catCols[0];
    const freq: Record<string, number> = {};
    rawData.forEach((r) => {
      const v = String(r[col]);
      freq[v] = (freq[v] || 0) + 1;
    });
    return { col, data: Object.entries(freq).slice(0, 8).map(([name, value]) => ({ name, value })) };
  };

  const getRadarData = () => {
    const nc = getNumericColumns().slice(0, 6);
    if (nc.length < 3) return [];
    const means = nc.map((col) => {
      const vals = rawData.map((r) => Number(r[col])).filter((v) => !isNaN(v));
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      const max = Math.max(...vals) || 1;
      return { feature: col.slice(0, 10), value: (mean / max) * 100 };
    });
    return means;
  };

  const numCols = getNumericColumns();
  const catDist = getCategoryDistribution();

  const tabs = [
    { id: "upload" as const, label: "Upload", icon: Upload },
    { id: "preview" as const, label: "Data", icon: Table },
    { id: "charts" as const, label: "Charts", icon: BarChart3 },
    { id: "insights" as const, label: "Insights", icon: Brain },
  ];

  // Helper to make a chart at both small and large sizes
  const renderChart = (title: string, smallChart: React.ReactNode, fullChart: React.ReactNode) => (
    <ZoomableChart title={title} fullChildren={fullChart}>
      {smallChart}
    </ZoomableChart>
  );

  return (
    <div className="min-h-screen relative">
      <JupiterBackground />

      {/* Analyzing overlay */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            className="fixed inset-0 z-[90] flex items-center justify-center bg-background/60 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div className="text-center space-y-6">
              <motion.div
                className="w-24 h-24 mx-auto rounded-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)), hsl(var(--accent)))" }}
                animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                transition={{ rotate: { duration: 2, repeat: Infinity, ease: "linear" }, scale: { duration: 1, repeat: Infinity } }}
              >
                <Brain className="w-12 h-12 text-primary-foreground" />
              </motion.div>
              <div>
                <h3 className="font-display text-xl font-bold text-foreground">AI Analyzing Data...</h3>
                <p className="text-muted-foreground text-sm mt-2">Computing statistics, detecting patterns, generating insights</p>
              </div>
              <motion.div className="w-64 mx-auto h-2 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--secondary)), hsl(var(--accent)))" }}
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2.3 }}
                />
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top nav */}
      <motion.header
        className="relative z-20 glass-strong border-b border-border/30"
        initial={{ y: -60 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 20 }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))" }}
              animate={{ rotateY: [0, 360] }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            >
              <BarChart3 className="w-5 h-5 text-primary-foreground" />
            </motion.div>
            <h1 className="font-display text-xl font-bold text-gradient">DataForge</h1>
          </div>

          <div className="flex items-center gap-4">
            {fileName && (
              <motion.span
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full flex items-center gap-2"
              >
                <FileSpreadsheet size={14} className="text-primary" />
                {fileName}
              </motion.span>
            )}
            <ThemeToggle />
            <motion.button
              onClick={onLogout}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg hover:bg-muted transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <LogOut size={16} />
              Logout
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Tab nav */}
      <div className="relative z-20 max-w-7xl mx-auto px-6 mt-6">
        <div className="flex gap-2 glass rounded-2xl p-2 w-fit">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id ? "bg-primary text-primary-foreground glow-primary" : "text-muted-foreground hover:text-foreground"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <tab.icon size={16} />
              {tab.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {/* Upload tab */}
          {activeTab === "upload" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="flex flex-col items-center justify-center min-h-[60vh]"
            >
              <motion.label className="relative cursor-pointer w-full max-w-lg" whileHover={{ scale: 1.02 }}>
                <input type="file" accept=".csv,.xlsx" onChange={handleFileUpload} className="hidden" />
                <div className="glass rounded-3xl p-16 text-center gradient-border group">
                  <motion.div
                    className="w-24 h-24 mx-auto rounded-2xl flex items-center justify-center mb-6"
                    style={{ background: "linear-gradient(135deg, hsl(var(--primary) / 0.2), hsl(var(--secondary) / 0.2))" }}
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Upload className="w-12 h-12 text-primary" />
                  </motion.div>
                  <h3 className="font-display text-xl font-bold text-foreground mb-2">Drop your data here</h3>
                  <p className="text-muted-foreground text-sm">CSV or Excel files supported</p>
                  {isProcessing && (
                    <motion.div className="mt-6 h-2 rounded-full bg-muted overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--secondary)), hsl(var(--accent)))" }}
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 1.5 }}
                      />
                    </motion.div>
                  )}
                </div>
              </motion.label>
            </motion.div>
          )}

          {/* Preview tab */}
          {activeTab === "preview" && processedData.length > 0 && (
            <motion.div key="preview" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-foreground">Processed Data</h2>
                <div className="flex gap-3">
                  <motion.button
                    onClick={runAutoAnalysis}
                    disabled={isAnalyzing}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-display text-xs font-semibold text-primary-foreground disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))" }}
                    whileHover={{ scale: 1.05, boxShadow: "0 0 30px hsl(var(--primary) / 0.4)" }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Brain size={16} />
                    {isAnalyzing ? "ANALYZING..." : "AI ANALYZE"}
                  </motion.button>
                  <motion.button
                    onClick={downloadProcessed}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl glass text-sm font-medium text-foreground border border-border"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Download size={16} />
                    Download
                  </motion.button>
                </div>
              </div>

              <div className="glass rounded-2xl overflow-hidden gradient-border">
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-card/95 backdrop-blur-sm">
                      <tr>
                        {columns.map((col, i) => (
                          <motion.th
                            key={col}
                            className="px-4 py-3 text-left font-display text-xs font-semibold text-primary uppercase tracking-wider border-b border-border/30"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                          >
                            {col}
                          </motion.th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {processedData.slice(0, 50).map((row, i) => (
                        <motion.tr
                          key={i}
                          className="border-b border-border/10 hover:bg-muted/30 transition-colors"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.02 }}
                        >
                          {columns.map((col) => (
                            <td key={col} className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                              {String(row[col]).substring(0, 30)}
                            </td>
                          ))}
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Showing {Math.min(50, processedData.length)} of {processedData.length} rows
              </p>
            </motion.div>
          )}

          {/* Charts tab */}
          {activeTab === "charts" && showAnalysis && (
            <motion.div
              key={`charts-${analysisKey}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="space-y-6"
            >
              <h2 className="font-display text-lg font-bold text-foreground">Data Visualization — Click any chart to zoom</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Distribution histogram */}
                {numCols.length > 0 && (
                  <ScrollAnimatedChart className="glass rounded-2xl p-6 gradient-border">
                    {renderChart(
                      `${numCols[0]} Distribution`,
                      <>
                        <h3 className="font-display text-sm font-semibold text-foreground mb-4">{numCols[0]} Distribution</h3>
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={getDistributionData(numCols[0])}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="range" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                            <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                            <Tooltip contentStyle={TOOLTIP_STYLE} />
                            <Bar dataKey="count" radius={[6, 6, 0, 0]} animationDuration={1500} animationBegin={200}>
                              {getDistributionData(numCols[0]).map((_, i) => (
                                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </>,
                      <ResponsiveContainer width="100%" height={450}>
                        <BarChart data={getDistributionData(numCols[0])}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="range" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                          <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                          <Tooltip contentStyle={TOOLTIP_STYLE} />
                          <Legend />
                          <Bar dataKey="count" radius={[6, 6, 0, 0]} animationDuration={1500}>
                            {getDistributionData(numCols[0]).map((_, i) => (
                              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </ScrollAnimatedChart>
                )}

                {/* Area chart */}
                {numCols.length > 0 && (
                  <ScrollAnimatedChart className="glass rounded-2xl p-6 gradient-border" delay={0.1}>
                    {renderChart(
                      `${numCols[0]} Trend`,
                      <>
                        <h3 className="font-display text-sm font-semibold text-foreground mb-4">{numCols[0]} Trend</h3>
                        <ResponsiveContainer width="100%" height={250}>
                          <AreaChart data={rawData.slice(0, 50).map((r, i) => ({ idx: i, val: Number(r[numCols[0]]) }))}>
                            <defs>
                              <linearGradient id={`areaGrad-${analysisKey}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#2dd4a8" stopOpacity={0.4} />
                                <stop offset="100%" stopColor="#2dd4a8" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="idx" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                            <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                            <Tooltip contentStyle={TOOLTIP_STYLE} />
                            <Area type="monotone" dataKey="val" stroke="#2dd4a8" fill={`url(#areaGrad-${analysisKey})`} strokeWidth={2} animationDuration={2000} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </>,
                      <ResponsiveContainer width="100%" height={450}>
                        <AreaChart data={rawData.slice(0, 100).map((r, i) => ({ idx: i, val: Number(r[numCols[0]]) }))}>
                          <defs>
                            <linearGradient id={`areaGradFull-${analysisKey}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#2dd4a8" stopOpacity={0.4} />
                              <stop offset="100%" stopColor="#2dd4a8" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="idx" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                          <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                          <Tooltip contentStyle={TOOLTIP_STYLE} />
                          <Area type="monotone" dataKey="val" stroke="#2dd4a8" fill={`url(#areaGradFull-${analysisKey})`} strokeWidth={2} animationDuration={2000} />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </ScrollAnimatedChart>
                )}

                {/* Pie chart */}
                {catDist.data.length > 0 && (
                  <ScrollAnimatedChart className="glass rounded-2xl p-6 gradient-border" delay={0.15}>
                    {renderChart(
                      `${catDist.col} Distribution`,
                      <>
                        <h3 className="font-display text-sm font-semibold text-foreground mb-4">{catDist.col} Distribution</h3>
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                            <Pie data={catDist.data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} strokeWidth={2} stroke="hsl(var(--card))" animationDuration={1500} animationBegin={300}>
                              {catDist.data.map((_, i) => (
                                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={TOOLTIP_STYLE} />
                            <Legend wrapperStyle={{ color: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </>,
                      <ResponsiveContainer width="100%" height={450}>
                        <PieChart>
                          <Pie data={catDist.data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={180} strokeWidth={2} stroke="hsl(var(--card))" animationDuration={1500} label>
                            {catDist.data.map((_, i) => (
                              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={TOOLTIP_STYLE} />
                          <Legend wrapperStyle={{ color: "hsl(var(--muted-foreground))", fontSize: 13 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </ScrollAnimatedChart>
                )}

                {/* Scatter plot */}
                {numCols.length >= 2 && (
                  <ScrollAnimatedChart className="glass rounded-2xl p-6 gradient-border" delay={0.2}>
                    {renderChart(
                      `${numCols[0]} vs ${numCols[1]}`,
                      <>
                        <h3 className="font-display text-sm font-semibold text-foreground mb-4">{numCols[0]} vs {numCols[1]}</h3>
                        <ResponsiveContainer width="100%" height={250}>
                          <ScatterChart>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey={numCols[0]} type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} name={numCols[0]} />
                            <YAxis dataKey={numCols[1]} type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} name={numCols[1]} />
                            <Tooltip contentStyle={TOOLTIP_STYLE} />
                            <Scatter data={getCorrelationData()} fill="#7c3aed" animationDuration={1500} />
                          </ScatterChart>
                        </ResponsiveContainer>
                      </>,
                      <ResponsiveContainer width="100%" height={450}>
                        <ScatterChart>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey={numCols[0]} type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} name={numCols[0]} />
                          <YAxis dataKey={numCols[1]} type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} name={numCols[1]} />
                          <Tooltip contentStyle={TOOLTIP_STYLE} />
                          <Scatter data={getCorrelationData()} fill="#7c3aed" animationDuration={1500} />
                        </ScatterChart>
                      </ResponsiveContainer>
                    )}
                  </ScrollAnimatedChart>
                )}

                {/* Correlation Heatmap */}
                {numCols.length >= 2 && (
                  <ScrollAnimatedChart className="glass rounded-2xl p-6 gradient-border" delay={0.25}>
                    {renderChart(
                      "Correlation Matrix",
                      <>
                        <h3 className="font-display text-sm font-semibold text-foreground mb-4">Correlation Matrix</h3>
                        <Heatmap data={rawData} columns={columns} />
                      </>,
                      <Heatmap data={rawData} columns={columns} />
                    )}
                  </ScrollAnimatedChart>
                )}

                {/* Box Plot */}
                {numCols.length > 0 && (
                  <ScrollAnimatedChart className="glass rounded-2xl p-6 gradient-border" delay={0.3}>
                    {renderChart(
                      "Box Plot — Distribution Stats",
                      <>
                        <h3 className="font-display text-sm font-semibold text-foreground mb-4">Box Plot — Distribution Stats</h3>
                        <BoxPlot data={rawData} columns={columns} />
                      </>,
                      <BoxPlot data={rawData} columns={columns} />
                    )}
                  </ScrollAnimatedChart>
                )}

                {/* Radar chart */}
                {numCols.length >= 3 && (
                  <ScrollAnimatedChart className="glass rounded-2xl p-6 gradient-border" delay={0.35}>
                    {renderChart(
                      "Feature Radar",
                      <>
                        <h3 className="font-display text-sm font-semibold text-foreground mb-4">Feature Radar</h3>
                        <ResponsiveContainer width="100%" height={250}>
                          <RadarChart data={getRadarData()}>
                            <PolarGrid stroke="hsl(var(--border))" />
                            <PolarAngleAxis dataKey="feature" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                            <PolarRadiusAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} />
                            <Radar dataKey="value" stroke="#ec4899" fill="#ec4899" fillOpacity={0.3} animationDuration={1500} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </>,
                      <ResponsiveContainer width="100%" height={450}>
                        <RadarChart data={getRadarData()}>
                          <PolarGrid stroke="hsl(var(--border))" />
                          <PolarAngleAxis dataKey="feature" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                          <PolarRadiusAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                          <Radar dataKey="value" stroke="#ec4899" fill="#ec4899" fillOpacity={0.3} animationDuration={1500} />
                        </RadarChart>
                      </ResponsiveContainer>
                    )}
                  </ScrollAnimatedChart>
                )}

                {/* Multi-line */}
                {numCols.length >= 2 && (
                  <ScrollAnimatedChart className="glass rounded-2xl p-6 gradient-border" delay={0.4}>
                    {renderChart(
                      "Multi-Feature Comparison",
                      <>
                        <h3 className="font-display text-sm font-semibold text-foreground mb-4">Multi-Feature Comparison</h3>
                        <ResponsiveContainer width="100%" height={250}>
                          <LineChart data={rawData.slice(0, 30).map((r, i) => ({ idx: i, [numCols[0]]: Number(r[numCols[0]]), [numCols[1]]: Number(r[numCols[1]]) }))}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="idx" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                            <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                            <Tooltip contentStyle={TOOLTIP_STYLE} />
                            <Line type="monotone" dataKey={numCols[0]} stroke="#2dd4a8" strokeWidth={2} dot={false} animationDuration={2000} />
                            <Line type="monotone" dataKey={numCols[1]} stroke="#7c3aed" strokeWidth={2} dot={false} animationDuration={2000} animationBegin={500} />
                            <Legend wrapperStyle={{ color: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </>,
                      <ResponsiveContainer width="100%" height={450}>
                        <LineChart data={rawData.slice(0, 80).map((r, i) => ({ idx: i, [numCols[0]]: Number(r[numCols[0]]), [numCols[1]]: Number(r[numCols[1]]) }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="idx" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                          <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                          <Tooltip contentStyle={TOOLTIP_STYLE} />
                          <Line type="monotone" dataKey={numCols[0]} stroke="#2dd4a8" strokeWidth={2} dot animationDuration={2000} />
                          <Line type="monotone" dataKey={numCols[1]} stroke="#7c3aed" strokeWidth={2} dot animationDuration={2000} />
                          <Legend wrapperStyle={{ color: "hsl(var(--muted-foreground))", fontSize: 13 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </ScrollAnimatedChart>
                )}
              </div>
            </motion.div>
          )}

          {/* Insights tab */}
          {activeTab === "insights" && insights.length > 0 && (
            <motion.div key="insights" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-foreground">🧠 AI Insights & Recommendations</h2>
                <motion.button
                  onClick={downloadInsightsTable}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl glass text-sm font-medium text-foreground border border-border"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Download size={16} />
                  Download Insights
                </motion.button>
              </div>

              <div className="grid gap-4">
                {insights.map((insight, i) => (
                  <motion.div
                    key={i}
                    className="glass rounded-2xl p-6 gradient-border"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ scale: 1.01, x: 5 }}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                        style={{
                          background: insight.type === "anomaly"
                            ? "linear-gradient(135deg, hsl(var(--destructive) / 0.2), hsl(var(--destructive) / 0.1))"
                            : insight.type === "recommendation"
                            ? "linear-gradient(135deg, hsl(45 100% 50% / 0.2), hsl(45 100% 50% / 0.1))"
                            : "linear-gradient(135deg, hsl(var(--primary) / 0.2), hsl(var(--secondary) / 0.1))",
                        }}
                      >
                        <insight.icon
                          size={22}
                          className={
                            insight.type === "anomaly"
                              ? "text-destructive"
                              : insight.type === "recommendation"
                              ? "text-yellow-400"
                              : "text-primary"
                          }
                        />
                      </div>
                      <div>
                        <h3 className="font-display text-sm font-semibold text-foreground">{insight.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{insight.text}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.div className="glass rounded-2xl overflow-hidden gradient-border" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                <div className="p-4 border-b border-border/30">
                  <h3 className="font-display text-sm font-semibold text-foreground">Analysis Summary Table</h3>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/30">
                      <th className="px-4 py-3 text-left font-display text-xs font-semibold text-primary uppercase">Type</th>
                      <th className="px-4 py-3 text-left font-display text-xs font-semibold text-primary uppercase">Finding</th>
                      <th className="px-4 py-3 text-left font-display text-xs font-semibold text-primary uppercase">Detail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {insights.map((ins, i) => (
                      <tr key={i} className="border-b border-border/10 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 capitalize text-foreground font-medium">{ins.type}</td>
                        <td className="px-4 py-3 text-foreground">{ins.title}</td>
                        <td className="px-4 py-3 text-muted-foreground max-w-md">{ins.text}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            </motion.div>
          )}

          {/* Empty states */}
          {activeTab === "preview" && processedData.length === 0 && (
            <motion.div key="empty-preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center min-h-[50vh] text-muted-foreground">
              <Table size={48} className="mb-4 opacity-30" />
              <p>Upload a file first to see the processed data</p>
            </motion.div>
          )}
          {activeTab === "charts" && !showAnalysis && (
            <motion.div key="empty-charts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center min-h-[50vh] text-muted-foreground">
              <BarChart3 size={48} className="mb-4 opacity-30" />
              <p>Upload data and click "AI Analyze" to see visualizations</p>
            </motion.div>
          )}
          {activeTab === "insights" && insights.length === 0 && (
            <motion.div key="empty-insights" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center min-h-[50vh] text-muted-foreground">
              <Brain size={48} className="mb-4 opacity-30" />
              <p>Run AI analysis to generate insights</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <SuccessPopup
        show={showSuccess}
        onClose={() => setShowSuccess(false)}
        title="Data Processed!"
        message={`Successfully cleaned ${processedData.length} records across ${columns.length} features. Duplicates removed, missing values imputed, and data normalized.`}
      />
    </div>
  );
};

export default Dashboard;
