import { useMemo } from "react";
import { motion } from "framer-motion";

type DataRow = Record<string, string | number>;

const HEAT_COLORS = ["#0d1b2e", "#1a3a5c", "#2d6a8e", "#2dd4a8", "#84cc16", "#f59e0b", "#f43f5e"];

function interpolateColor(value: number): string {
  const idx = Math.min(Math.floor(value * (HEAT_COLORS.length - 1)), HEAT_COLORS.length - 2);
  return HEAT_COLORS[idx + 1] || HEAT_COLORS[HEAT_COLORS.length - 1];
}

interface HeatmapProps {
  data: DataRow[];
  columns: string[];
}

export const Heatmap = ({ data, columns }: HeatmapProps) => {
  const matrix = useMemo(() => {
    const numCols = columns.filter((c) => data.every((r) => !isNaN(Number(r[c]))));
    const cols = numCols.slice(0, 6);
    if (cols.length < 2) return null;

    // Compute correlation matrix
    const means: Record<string, number> = {};
    const stds: Record<string, number> = {};
    cols.forEach((c) => {
      const vals = data.map((r) => Number(r[c]));
      means[c] = vals.reduce((a, b) => a + b, 0) / vals.length;
      stds[c] = Math.sqrt(vals.reduce((a, b) => a + (b - means[c]) ** 2, 0) / vals.length) || 1;
    });

    const corr: { row: string; col: string; value: number }[] = [];
    cols.forEach((r) => {
      cols.forEach((c) => {
        const n = data.length;
        let sum = 0;
        for (let i = 0; i < n; i++) {
          sum += ((Number(data[i][r]) - means[r]) / stds[r]) * ((Number(data[i][c]) - means[c]) / stds[c]);
        }
        corr.push({ row: r, col: c, value: sum / n });
      });
    });

    return { cols, corr };
  }, [data, columns]);

  if (!matrix) return <p className="text-muted-foreground text-sm text-center py-8">Need 2+ numeric columns</p>;

  const { cols, corr } = matrix;
  const cellSize = Math.min(50, 280 / cols.length);

  return (
    <div className="flex flex-col items-center">
      <div className="flex">
        <div style={{ width: cellSize }} />
        {cols.map((c, i) => (
          <motion.div
            key={c}
            className="text-[9px] text-muted-foreground font-display truncate text-center"
            style={{ width: cellSize }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            {c.slice(0, 6)}
          </motion.div>
        ))}
      </div>
      {cols.map((row, ri) => (
        <div key={row} className="flex items-center">
          <div className="text-[9px] text-muted-foreground font-display truncate" style={{ width: cellSize }}>
            {row.slice(0, 6)}
          </div>
          {cols.map((col, ci) => {
            const entry = corr.find((c) => c.row === row && c.col === col);
            const val = entry ? entry.value : 0;
            const norm = (val + 1) / 2; // normalize -1..1 to 0..1
            return (
              <motion.div
                key={col}
                className="rounded-sm flex items-center justify-center cursor-default group relative"
                style={{
                  width: cellSize,
                  height: cellSize,
                  backgroundColor: interpolateColor(norm),
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: (ri * cols.length + ci) * 0.02, type: "spring" }}
                whileHover={{ scale: 1.3, zIndex: 10 }}
                title={`${row} × ${col}: ${val.toFixed(2)}`}
              >
                <span className="text-[8px] font-mono text-foreground/80">{val.toFixed(1)}</span>
              </motion.div>
            );
          })}
        </div>
      ))}
      <div className="flex items-center gap-1 mt-3">
        <span className="text-[9px] text-muted-foreground">-1</span>
        <div className="flex h-3 rounded-full overflow-hidden">
          {HEAT_COLORS.map((c, i) => (
            <div key={i} className="w-5 h-full" style={{ backgroundColor: c }} />
          ))}
        </div>
        <span className="text-[9px] text-muted-foreground">+1</span>
      </div>
    </div>
  );
};

interface BoxPlotProps {
  data: DataRow[];
  columns: string[];
}

export const BoxPlot = ({ data, columns }: BoxPlotProps) => {
  const numCols = columns.filter((c) => data.every((r) => !isNaN(Number(r[c])))).slice(0, 5);

  const stats = useMemo(() => {
    return numCols.map((col) => {
      const vals = data.map((r) => Number(r[col])).sort((a, b) => a - b);
      const n = vals.length;
      const q1 = vals[Math.floor(n * 0.25)];
      const median = vals[Math.floor(n * 0.5)];
      const q3 = vals[Math.floor(n * 0.75)];
      const iqr = q3 - q1;
      const min = Math.max(vals[0], q1 - 1.5 * iqr);
      const max = Math.min(vals[n - 1], q3 + 1.5 * iqr);
      const outliers = vals.filter((v) => v < min || v > max);
      return { col, min, q1, median, q3, max, outliers, dataMin: vals[0], dataMax: vals[n - 1] };
    });
  }, [data, numCols]);

  if (stats.length === 0) return <p className="text-muted-foreground text-sm text-center py-8">Need numeric columns</p>;

  const globalMin = Math.min(...stats.map((s) => s.dataMin));
  const globalMax = Math.max(...stats.map((s) => s.dataMax));
  const range = globalMax - globalMin || 1;
  const chartHeight = 200;
  const toY = (v: number) => chartHeight - ((v - globalMin) / range) * chartHeight;
  const boxWidth = Math.min(50, 280 / stats.length);

  const colors = ["#2dd4a8", "#7c3aed", "#ec4899", "#f59e0b", "#06b6d4"];

  return (
    <div className="flex items-end justify-center gap-4">
      {stats.map((s, i) => (
        <div key={s.col} className="flex flex-col items-center">
          <svg width={boxWidth + 10} height={chartHeight + 20} className="overflow-visible">
            {/* Whisker line */}
            <motion.line
              x1={(boxWidth + 10) / 2} y1={toY(s.max)} x2={(boxWidth + 10) / 2} y2={toY(s.min)}
              stroke={colors[i % colors.length]} strokeWidth={1} strokeDasharray="3 2"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
              transition={{ duration: 0.8, delay: i * 0.15 }}
            />
            {/* Box */}
            <motion.rect
              x={5} y={toY(s.q3)} width={boxWidth} height={Math.max(1, toY(s.q1) - toY(s.q3))}
              rx={4} fill={colors[i % colors.length] + "40"} stroke={colors[i % colors.length]} strokeWidth={2}
              initial={{ scaleY: 0, opacity: 0 }} animate={{ scaleY: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: i * 0.15, type: "spring" }}
              style={{ transformOrigin: `center ${toY(s.median)}px` }}
            />
            {/* Median */}
            <motion.line
              x1={5} y1={toY(s.median)} x2={boxWidth + 5} y2={toY(s.median)}
              stroke={colors[i % colors.length]} strokeWidth={3}
              initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
              transition={{ duration: 0.4, delay: i * 0.15 + 0.3 }}
            />
            {/* Whisker caps */}
            {[s.min, s.max].map((v, j) => (
              <motion.line
                key={j}
                x1={(boxWidth + 10) / 2 - 8} y1={toY(v)} x2={(boxWidth + 10) / 2 + 8} y2={toY(v)}
                stroke={colors[i % colors.length]} strokeWidth={2}
                initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                transition={{ delay: i * 0.15 + 0.5 }}
              />
            ))}
            {/* Outliers */}
            {s.outliers.slice(0, 5).map((o, j) => (
              <motion.circle
                key={j}
                cx={(boxWidth + 10) / 2} cy={toY(o)} r={3}
                fill={colors[i % colors.length]} opacity={0.6}
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ delay: i * 0.15 + 0.6 + j * 0.05, type: "spring" }}
              />
            ))}
          </svg>
          <span className="text-[9px] text-muted-foreground font-display mt-1 truncate max-w-[60px]">{s.col}</span>
        </div>
      ))}
    </div>
  );
};
