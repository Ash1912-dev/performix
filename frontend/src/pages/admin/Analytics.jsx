import { useState } from'react';
import { useQuery } from'@tanstack/react-query';
import {
 BarChart3,
 CheckCircle2,
 PieChart as PieChartIcon,
 TrendingUp,
 Users,
 X,
 Minus,
 Check,
} from'lucide-react';
import {
 BarChart,
 Bar,
 CartesianGrid,
 Cell,
 Legend,
 Line,
 LineChart,
 Pie,
 PieChart,
 ResponsiveContainer,
 Tooltip,
 XAxis,
 YAxis,
} from'recharts';

import {
 getCompletionHeatmap,
 getDepartmentTrends,
 getGoalDistribution,
 getManagerEffectivenessDashboard,
 getOrgOverview,
} from'@/api/analyticsApi';
import LoadingSkeleton from'@/components/shared/LoadingSkeleton';
import StatCard from'@/components/shared/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from'@/components/ui/card';
import { Select } from'@/components/ui/select';

const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#84cc16'];
const QUARTER_LABELS = ['Q1','Q2','Q3','Q4'];

function CustomTooltip({ active, payload, label }) {
 if (active && payload && payload.length) {
 return (
 <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-lg">
 <p className="mb-1 text-sm font-semibold text-gray-900">{label}</p>
 {payload.map((entry, idx) => (
 <p key={idx} className="text-xs text-gray-600">
 <span className="mr-2 inline-block size-2 rounded-full" style={{ backgroundColor: entry.color }} />
 {entry.name}: <span className="font-semibold">{Math.round(entry.value)}%</span>
 </p>
))}
 </div>
);
 }
 return null;
}

function AnalyticsPage() {
 const [cycleYear, setCycleYear] = useState(new Date().getFullYear().toString());

 const { data: orgData, isLoading: orgLoading } = useQuery({
 queryKey: ['orgOverview', cycleYear],
 queryFn: () => getOrgOverview(cycleYear),
 });

 const { data: deptTrends, isLoading: deptLoading } = useQuery({
 queryKey: ['departmentTrends', cycleYear],
 queryFn: () => getDepartmentTrends({ cycleYear }),
 });

 const { data: goalDist, isLoading: distLoading } = useQuery({
 queryKey: ['goalDistribution', cycleYear],
 queryFn: () => getGoalDistribution({ cycleYear }),
 });

 const { data: heatmapData, isLoading: heatmapLoading } = useQuery({
 queryKey: ['completionHeatmap', cycleYear],
 queryFn: () => getCompletionHeatmap(cycleYear),
 });

 const { data: mgrData, isLoading: mgrLoading } = useQuery({
 queryKey: ['managerEffectivenessAnalytics'],
 queryFn: getManagerEffectivenessDashboard,
 });

 const overview = orgData || {};
 const deptData = deptTrends?.trends || [];
 const goalDistribution = goalDist || {};
 const heatmapRows = heatmapData || [];
 const mgrEffectiveness = mgrData?.managers || [];

 const trendChartData = QUARTER_LABELS.map(q => ({
 quarter: q,
 ...deptData.reduce((acc, d) => ({ ...acc, [d.department]: d[q] }), {})
 }));
 const deptNames = deptData.map(d => d.department);

 const thrustAreaDist = goalDistribution?.byThrustArea?.map(item => ({ thrustArea: item.thrustArea, count: item.count })) ?? [];
 const uomDist = goalDistribution?.byUomType?.map(item => ({ uom: item.uomType, count: item.count })) ?? [];

 const barColor = (rate) => {
 if (rate >= 80) return'#10b981';
 if (rate >= 50) return'#f59e0b';
 return'#ef4444';
 };


 if (orgLoading) {
 return (
 <div className="space-y-6 p-6 text-gray-900">
 <LoadingSkeleton type="card" />
 <LoadingSkeleton type="table" rows={5} />
 </div>
);
 }

 return (
 <div className="space-y-6 p-6 text-gray-900">
 {/* Header */}
 <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
 <div>
 <h1 className="m-0 text-3xl font-bold tracking-tight text-gray-900">
 Analytics
 </h1>
 <p className="mt-1 text-sm text-gray-500">
 Visualize performance trends, distributions, and completion patterns.
 </p>
 </div>
 <div className="w-40">
 <Select value={cycleYear} onChange={(e) => setCycleYear(e.target.value)}>
 <option value="2024">2024</option>
 <option value="2025">2025</option>
 <option value="2026">2026</option>
 </Select>
 </div>
 </div>

 {/* Row 1: Org Overview Cards */}
 <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
 <StatCard title="Total Employees" value={overview.totalEmployees || 0} icon={Users} color="blue" />
 <StatCard title="Total Goals" value={overview.totalGoals || 0} icon={TrendingUp} color="green" />
 <StatCard title="Avg Score" value={`${Math.round(overview.avgScore || 0)}%`} icon={BarChart3} color="amber" />
 <StatCard title="Completion Rate" value={`${Math.round(overview.completionRate || 0)}%`} icon={CheckCircle2} color="red" />
 </div>

 {/* Row 2: QoQ Trend Chart */}
 <Card>
 <CardHeader className="p-6 pb-3">
 <div className="flex items-center gap-3">
 <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
 <TrendingUp className="size-5" />
 </div>
 <CardTitle className="text-xl">Quarter-over-Quarter Department Trends</CardTitle>
 </div>
 </CardHeader>
 <CardContent className="p-6 pt-2">
 {deptLoading ? (
 <div className="flex h-72 items-center justify-center">
 <LoadingSkeleton type="card" />
 </div>
) : trendChartData.length > 0 && deptNames.length > 0 ? (
 <ResponsiveContainer width="100%" height={350}>
 <LineChart data={trendChartData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
 <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
 <XAxis dataKey="quarter" tick={{ fill:'#64748b', fontSize: 13 }} />
 <YAxis tick={{ fill:'#64748b', fontSize: 13 }} domain={[0, 100]} unit="%" />
 <Tooltip content={<CustomTooltip />} />
 <Legend
 verticalAlign="top"
 height={36}
 iconType="circle"
 wrapperStyle={{ fontSize: 13, color:'#475569' }}
 />
 {deptNames.map((dept, idx) => (
 <Line
 key={dept}
 type="monotone"
 dataKey={dept}
 stroke={COLORS[idx % COLORS.length]}
 strokeWidth={2.5}
 dot={{ r: 4, fill: COLORS[idx % COLORS.length] }}
 activeDot={{ r: 6 }}
 />
))}
 </LineChart>
 </ResponsiveContainer>
) : (
 <p className="py-12 text-center text-sm text-gray-500">No trend data available</p>
)}
 </CardContent>
 </Card>

 {/* Row 3: Goal Distribution */}
 <div className="grid gap-6 xl:grid-cols-2">
 {/* Pie Chart by Thrust Area */}
 <Card>
 <CardHeader className="p-6 pb-3">
 <div className="flex items-center gap-3">
 <div className="flex size-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
 <PieChartIcon className="size-5" />
 </div>
 <CardTitle className="text-xl">Goals by Thrust Area</CardTitle>
 </div>
 </CardHeader>
 <CardContent className="p-6 pt-2">
 {distLoading ? (
 <div className="flex h-64 items-center justify-center"><LoadingSkeleton type="card" /></div>
) : thrustAreaDist.length > 0 ? (
 <ResponsiveContainer width="100%" height={300}>
 <PieChart>
 <Pie
 data={thrustAreaDist}
 dataKey="count"
 nameKey="thrustArea"
 cx="50%"
 cy="50%"
 outerRadius={100}
 innerRadius={50}
 paddingAngle={3}
 label={({ thrustArea, percent }) => `${thrustArea} (${(percent * 100).toFixed(0)}%)`}
 labelLine={false}
 >
 {thrustAreaDist.map((_, idx) => (
 <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
))}
 </Pie>
 <Tooltip
 contentStyle={{ borderRadius: 12, border:'1px solid #e2e8f0', fontSize: 13 }}
 formatter={(value, name) => [`${value} goals`, name]}
 />
 <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 12 }} />
 </PieChart>
 </ResponsiveContainer>
) : (
 <p className="py-12 text-center text-sm text-gray-500">No distribution data</p>
)}
 </CardContent>
 </Card>

 {/* Bar Chart by UoM */}
 <Card>
 <CardHeader className="p-6 pb-3">
 <div className="flex items-center gap-3">
 <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
 <BarChart3 className="size-5" />
 </div>
 <CardTitle className="text-xl">Goals by Unit of Measure</CardTitle>
 </div>
 </CardHeader>
 <CardContent className="p-6 pt-2">
 {distLoading ? (
 <div className="flex h-64 items-center justify-center"><LoadingSkeleton type="card" /></div>
) : uomDist.length > 0 ? (
 <ResponsiveContainer width="100%" height={300}>
 <BarChart data={uomDist} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
 <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
 <XAxis dataKey="uom" tick={{ fill:'#64748b', fontSize: 12 }} />
 <YAxis tick={{ fill:'#64748b', fontSize: 13 }} />
 <Tooltip
 contentStyle={{ borderRadius: 12, border:'1px solid #e2e8f0', fontSize: 13 }}
 formatter={(value) => [`${value} goals`]}
 />
 <Bar dataKey="count" radius={[8, 8, 0, 0]}>
 {uomDist.map((_, idx) => (
 <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
))}
 </Bar>
 </BarChart>
 </ResponsiveContainer>
) : (
 <p className="py-12 text-center text-sm text-gray-500">No UoM data</p>
)}
 </CardContent>
 </Card>
 </div>

 {/* Row 4: Completion Heatmap */}
 <Card>
 <CardHeader className="p-6 pb-3">
 <CardTitle className="text-xl">Completion Heatmap</CardTitle>
 </CardHeader>
 <CardContent className="p-6 pt-0">
 {heatmapLoading ? (
 <LoadingSkeleton type="table" rows={5} />
) : heatmapRows.length > 0 ? (
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead>
 <tr className="border-b border-slate-100">
 <th className="px-4 py-3 text-left font-semibold text-gray-500">Employee</th>
 <th className="px-4 py-3 text-left font-semibold text-gray-500">Department</th>
 {QUARTER_LABELS.map((q) => (
 <th key={q} className="px-4 py-3 text-center font-semibold text-gray-500">{q}</th>
))}
 </tr>
 </thead>
 <tbody>
 {heatmapRows.map((emp, idx) => (
 <tr key={emp._id || idx} className="border-b border-slate-50 last:border-0">
 <td className="px-4 py-3 font-medium text-gray-900">{emp.name || emp.employeeName}</td>
 <td className="px-4 py-3 text-gray-600">{emp.department}</td>
 {QUARTER_LABELS.map((q) => {
 const status = emp.quarters?.[q] ?? emp[q];
 return (
 <td key={q} className="px-4 py-3 text-center">
 {status ==='completed' || status === true ? (
 <span className="inline-flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
 <Check className="size-4" />
 </span>
) : status ==='not_completed' || status === false ? (
 <span className="inline-flex size-8 items-center justify-center rounded-lg bg-rose-50 text-rose-500">
 <X className="size-4" />
 </span>
) : (
 <span className="inline-flex size-8 items-center justify-center rounded-lg bg-slate-50 text-gray-600">
 <Minus className="size-4" />
 </span>
)}
 </td>
);
 })}
 </tr>
))}
 </tbody>
 </table>
 </div>
) : (
 <p className="py-8 text-center text-sm text-gray-500">No heatmap data available</p>
)}
 </CardContent>
 </Card>

 {/* Row 5: Manager Effectiveness */}
 <Card>
 <CardHeader className="p-6 pb-3">
 <div className="flex items-center gap-3">
 <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
 <Users className="size-5" />
 </div>
 <CardTitle className="text-xl">Manager Effectiveness</CardTitle>
 </div>
 </CardHeader>
 <CardContent className="p-6 pt-2">
 {mgrLoading ? (
 <div className="flex h-64 items-center justify-center"><LoadingSkeleton type="card" /></div>
) : mgrEffectiveness.length > 0 ? (
 <ResponsiveContainer width="100%" height={350}>
 <BarChart
 data={mgrEffectiveness}
 margin={{ top: 10, right: 20, left: 0, bottom: 40 }}
 >
 <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
 <XAxis
 dataKey={mgrEffectiveness[0]?.managerName ?'managerName' :'name'}
 tick={{ fill:'#64748b', fontSize: 12 }}
 angle={-25}
 textAnchor="end"
 height={60}
 />
 <YAxis tick={{ fill:'#64748b', fontSize: 13 }} domain={[0, 100]} unit="%" />
 <Tooltip
 contentStyle={{ borderRadius: 12, border:'1px solid #e2e8f0', fontSize: 13 }}
 formatter={(value) => [`${Math.round(value)}%`,'Completion Rate']}
 />
 <Bar
 dataKey="overallCheckInCompletionRate"
 radius={[8, 8, 0, 0]}
 maxBarSize={48}
 >
 {mgrEffectiveness.map((mgr, idx) => (
 <Cell key={idx} fill={barColor(mgr.overallCheckInCompletionRate || 0)} />
))}
 </Bar>
 </BarChart>
 </ResponsiveContainer>
) : (
 <p className="py-12 text-center text-sm text-gray-500">No manager data available</p>
)}
 </CardContent>
 </Card>
 </div>
);
}

export default AnalyticsPage;
