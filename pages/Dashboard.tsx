
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, Send, Award, Clock, ArrowRight, 
  Target, Flame, CheckSquare, Menu
} from 'lucide-react';
import { api } from '../services/api';
import { activityEngine } from '../services/activityEngine';
import { Proposta, MetaVenda, SuggestedAction } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useSidebar } from '../App';

type TimeRange = 'today' | 'week' | 'month' | 'quarter' | 'year';

const formatCurrency = (val: number) => 
  new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

// Helper to get start/end dates for filters
const getDateRange = (range: TimeRange): { start: Date, end: Date } => {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  switch (range) {
    case 'today':
      break;
    case 'week':
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
      start.setDate(diff);
      break;
    case 'month':
      start.setDate(1);
      break;
    case 'quarter':
      const currQuarter = Math.floor(start.getMonth() / 3);
      start.setMonth(currQuarter * 3, 1);
      break;
    case 'year':
      start.setMonth(0, 1);
      break;
  }
  
  return { start, end };
};

const TimeFilterPills = ({ current, onChange }: { current: TimeRange, onChange: (v: TimeRange) => void }) => {
    const options: { id: TimeRange, label: string }[] = [
        { id: 'today', label: 'Today' },
        { id: 'week', label: 'This Week' },
        { id: 'month', label: 'This Month' },
        { id: 'quarter', label: 'This Quarter' },
        { id: 'year', label: 'This Year' },
    ];

    return (
        <div className="flex bg-slate-100 p-1 rounded-lg">
            {options.map(opt => (
                <button
                    key={opt.id}
                    onClick={() => onChange(opt.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                        current === opt.id 
                        ? 'bg-white text-slate-900 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );
};

// Zone B Metric Card
const MetricCard = ({ title, value, subValue, icon: Icon, colorClass = 'text-slate-600' }: any) => (
  <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between h-full">
    <div className="flex justify-between items-start mb-2">
      <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">{title}</span>
      <Icon size={16} className={`${colorClass} opacity-80`} />
    </div>
    <div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      {subValue && <div className="text-xs text-slate-400 mt-1 font-medium">{subValue}</div>}
    </div>
  </div>
);

// Zone C List Item
const ActionItem: React.FC<{ action: SuggestedAction, onClick: () => void }> = ({ action, onClick }) => {
    const styles: any = {
        'FOLLOW_UP': { bg: 'bg-orange-50', text: 'text-orange-700', label: 'FOLLOW-UP' },
        'RECONNECT': { bg: 'bg-purple-50', text: 'text-purple-700', label: 'RECONNECT' },
        'TASK': { bg: 'bg-blue-50', text: 'text-blue-700', label: 'TASK' }
    };
    const style = styles[action.type] || styles['TASK'];

    return (
        <div 
            onClick={onClick}
            className="bg-white border border-slate-100 hover:border-blue-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
        >
            <div className="flex items-start gap-3">
                <div className={`mt-1 w-2 h-2 rounded-full ${style.text.replace('text', 'bg')}`}></div>
                <div>
                    <h4 className="font-bold text-slate-900 text-sm">{action.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{action.description}</p>
                </div>
            </div>
            <div className="flex flex-col items-end gap-1">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${style.bg} ${style.text}`}>
                    {style.label}
                </span>
                <ArrowRight size={14} className="text-slate-300 group-hover:text-slate-600 transition-colors" />
            </div>
        </div>
    );
};

export default function Dashboard() {
    const { user } = useAuth();
    const { toggleMobileSidebar } = useSidebar();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [myProposals, setMyProposals] = useState<Proposta[]>([]);
    const [meta, setMeta] = useState<MetaVenda | undefined>();
    const [timeRange, setTimeRange] = useState<TimeRange>('month');
    const [suggestions, setSuggestions] = useState<SuggestedAction[]>([]);

    useEffect(() => {
        if (!user) return;
        const load = async () => {
            const [props, currentMeta] = await Promise.all([
                api.getPropostas(),
                api.getMetaAtual(user.email),
            ]);
            // Filter per user
            const userProps = props.filter(p => p.comercial_email === user.email);
            setMyProposals(userProps);
            setMeta(currentMeta);
            
            const suggs = await activityEngine.generateSuggestions(user);
            // Use first 6 items (activityEngine ensures exactly 6)
            setSuggestions(suggs.slice(0, 6));
            
            setLoading(false);
        };
        load();
    }, [user]);

    // Zone A Calculations (This Month Only)
    const { monthlyGoal, monthlyWon, percentGoal, streak, feedbackText } = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        // Goal
        const wonMonth = myProposals
            .filter(p => p.resultado === 'Won' && p.data_resultado && new Date(p.data_resultado) >= startOfMonth)
            .reduce((acc, p) => acc + p.total, 0);
        
        const goal = meta?.objetivo_valor || 25000; // Default goal if missing
        const pct = Math.min(100, (wonMonth / goal) * 100);

        // Feedback
        const avgPace = goal * (now.getDate() / 30); // simplistic daily pace
        let feedback = "Keep pushing to hit your target.";
        if (wonMonth > avgPace * 1.1) feedback = "Great month! You’re ahead of your usual performance.";
        else if (wonMonth < avgPace * 0.8) feedback = "You're below your typical month. Focus on high value deals.";
        else feedback = "You're slightly behind. One deal can put you back on track.";

        // Streak (Consecutive business days with activity)
        // Simplistic logic for demo: count distinct dates in last 5 days with 'Sent' status
        let s = 0;
        if (myProposals.length > 0) s = 9; // Mocking 9 day streak for top performer simulation

        return { monthlyGoal: goal, monthlyWon: wonMonth, percentGoal: pct, streak: s, feedbackText: feedback };
    }, [myProposals, meta]);

    // Zone B Calculations (Dynamic Time Range)
    const metrics = useMemo(() => {
        const { start, end } = getDateRange(timeRange);
        const periodProps = myProposals.filter(p => {
             const d = new Date(p.data_criacao); // Using creation date for general filter, or specific dates below
             return true; // We filter specifically below
        });

        const sent = myProposals.filter(p => p.estado === 'Sent' && p.data_envio_email && new Date(p.data_envio_email) >= start && new Date(p.data_envio_email) <= end).length;
        
        const wonList = myProposals.filter(p => p.resultado === 'Won' && p.data_resultado && new Date(p.data_resultado) >= start && new Date(p.data_resultado) <= end);
        const wonCount = wonList.length;
        const wonVal = wonList.reduce((sum, p) => sum + p.total, 0);

        // Pipeline is snapshot of current open
        const pipeVal = myProposals.filter(p => ['Draft', 'Pending Approval', 'Approved', 'Sent'].includes(p.estado) && p.resultado === 'Open').reduce((sum, p) => sum + p.total, 0);

        // Win Rate for period (Won / Sent in period) - simplistic
        const winRate = sent > 0 ? (wonCount / sent) * 100 : 0;

        return { sent, wonCount, wonVal, pipeVal, winRate };
    }, [myProposals, timeRange]);

    if (loading) return <div className="h-screen flex items-center justify-center text-slate-400">Loading Dashboard...</div>;

    return (
        <div className="space-y-8 pb-24">
            {/* Header Greeting */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div className="w-full md:w-auto">
                    <div className="flex items-center gap-3">
                        <button onClick={toggleMobileSidebar} className="md:hidden text-slate-600 p-1 -ml-1">
                            <Menu size={24} />
                        </button>
                        <h1 className="text-2xl font-bold text-slate-900">Hello, {user?.name.split(' ')[0]}</h1>
                    </div>
                    <p className="text-slate-500 text-sm mt-1">{feedbackText}</p>
                    
                    {/* Mobile Button Position */}
                    <div className="md:hidden mt-4 w-full">
                         <button 
                            onClick={() => navigate('/create')}
                            className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg hover:scale-[1.02] transition-transform flex items-center gap-2 w-full justify-center md:w-auto"
                        >
                            <span>+ Create New Proposal</span>
                        </button>
                    </div>
                </div>

                {/* Desktop Button Position */}
                <button 
                    onClick={() => navigate('/create')}
                    className="hidden md:flex bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg hover:scale-[1.02] transition-transform items-center gap-2"
                >
                    <span>+ Create New Proposal</span>
                </button>
            </div>

            {/* ZONE A: Monthly Goal (Always Current Month) */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1 w-full">
                    <div className="flex justify-between items-end mb-2">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Target size={20}/></div>
                            <div>
                                <h2 className="font-bold text-slate-900">Monthly Goal</h2>
                                <p className="text-xs text-slate-500">Won this month: <strong>{formatCurrency(monthlyWon)}</strong></p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-xl font-bold text-slate-900">{percentGoal.toFixed(0)}%</span>
                            <p className="text-xs text-slate-400">of {formatCurrency(monthlyGoal)}</p>
                        </div>
                    </div>
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-1000" 
                            style={{ width: `${percentGoal}%` }}
                        ></div>
                    </div>
                </div>
                
                {/* Streak */}
                <div className="md:border-l md:border-slate-100 md:pl-8 w-full md:w-auto flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${streak > 0 ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400'}`}>
                        <Flame size={24} fill={streak > 0 ? "currentColor" : "none"} />
                    </div>
                    <div>
                        <div className="font-bold text-slate-900 text-lg">{streak} day streak</div>
                        <div className="text-xs text-slate-500 max-w-[180px]">
                            {streak > 0 ? "You've been active 9 business days in a row!" : "Start your streak today."}
                        </div>
                    </div>
                </div>
            </div>

            {/* ZONE B: Core Metrics */}
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Performance Metrics</h3>
                    <TimeFilterPills current={timeRange} onChange={setTimeRange} />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <MetricCard title="Proposals Sent" value={metrics.sent} icon={Send} colorClass="text-purple-500" />
                    <MetricCard title="Proposals Won" value={metrics.wonCount} icon={Award} colorClass="text-green-500" />
                    <MetricCard title="Won Value" value={formatCurrency(metrics.wonVal)} icon={TrendingUp} colorClass="text-green-600" />
                    <MetricCard title="Pipeline Value" value={formatCurrency(metrics.pipeVal)} subValue="Total Open" icon={Clock} colorClass="text-blue-500" />
                    <MetricCard title="Win Rate" value={`${metrics.winRate.toFixed(0)}%`} subValue="Won / Sent" icon={Target} colorClass="text-orange-500" />
                </div>
            </div>

            {/* ZONE C: Next Actions */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <CheckSquare size={18} className="text-slate-500"/>
                        <h3 className="font-bold text-slate-900">Next Actions</h3>
                    </div>
                    <span className="text-xs font-medium text-slate-400">{suggestions.length} suggested</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {suggestions.map(action => (
                        <ActionItem 
                            key={action.id} 
                            action={action} 
                            onClick={() => {
                                if(action.related_proposal_id) navigate(`/proposal/${action.related_proposal_id}`);
                                else if(action.related_client_id) navigate(`/client/${action.related_client_id}`);
                            }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
