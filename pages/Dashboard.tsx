import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { activityEngine } from '../services/activityEngine';
import { Proposta, MetaVenda, SuggestedAction, TimeRange } from '../types';
import {
    Target, Flame, Send, Award, TrendingUp, Clock,
    ArrowRight, CheckSquare, Wallet, Users, Activity
} from 'lucide-react';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', {
        style: 'currency',
        currency: 'EUR',
    }).format(value);
};

const getDateRange = (range: TimeRange): { start: Date; end: Date } => {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);

    if (range === 'today') {
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
    } else if (range === 'week') {
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1);
        start.setDate(diff);
        start.setHours(0, 0, 0, 0);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
    } else if (range === 'month') {
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(start.getMonth() + 1);
        end.setDate(0);
        end.setHours(23, 59, 59, 999);
    } else if (range === 'quarter') {
        const month = start.getMonth();
        const quarterStartMonth = Math.floor(month / 3) * 3;
        start.setMonth(quarterStartMonth);
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(quarterStartMonth + 3);
        end.setDate(0);
        end.setHours(23, 59, 59, 999);
    } else if (range === 'year') {
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(11, 31);
        end.setHours(23, 59, 59, 999);
    }
    return { start, end };
};

// Top Row Metric Card (Small, Premium)
const StatCard = ({ title, value, subValue, icon: Icon, colorClass = 'text-neutral-600', trend }: any) => (
    <div className="bg-white p-6 rounded-3xl shadow-card border border-neutral-100/50 flex flex-col justify-between h-full hover:shadow-soft transition-all duration-300 group">
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-2xl bg-neutral-50 group-hover:bg-primary-50 transition-colors ${colorClass}`}>
                <Icon size={22} className="group-hover:scale-110 transition-transform duration-300" />
            </div>
            {trend && (
                <span className="text-xs font-bold text-primary-700 bg-primary-50 px-2.5 py-1 rounded-full">
                    {trend}
                </span>
            )}
        </div>
        <div>
            <div className="text-3xl font-bold text-neutral-900 tracking-tight">{value}</div>
            <div className="text-sm font-medium text-neutral-500 mt-1">{title}</div>
        </div>
    </div>
);

// Action Item Row
const ActionItem: React.FC<{ action: SuggestedAction, onClick: () => void }> = ({ action, onClick }) => {
    return (
        <div
            onClick={onClick}
            className="flex items-center justify-between p-4 rounded-2xl border border-neutral-100 bg-neutral-50/50 hover:bg-white hover:border-primary/20 hover:shadow-md transition-all cursor-pointer group"
        >
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-white border border-neutral-100 text-neutral-500 group-hover:text-primary group-hover:border-primary/30 transition-colors`}>
                    <CheckSquare size={18} />
                </div>
                <div>
                    <h4 className="font-bold text-neutral-900 text-sm group-hover:text-primary transition-colors">{action.title}</h4>
                    <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">{action.description}</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-neutral-300 group-hover:text-primary group-hover:translate-x-1 transition-all">
                    <ArrowRight size={16} />
                </div>
            </div>
        </div>
    );
};

export default function Dashboard() {
    const { user } = useAuth();
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
            setSuggestions(suggs.slice(0, 6));

            setLoading(false);
        };
        load();
    }, [user]);

    const { monthlyGoal, monthlyWon, percentGoal, streak, feedbackText } = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const wonMonth = myProposals
            .filter(p => p.resultado === 'Won' && p.data_resultado && new Date(p.data_resultado) >= startOfMonth)
            .reduce((acc, p) => acc + p.total, 0);
        const goal = meta?.objetivo_valor || 25000;
        const pct = Math.min(100, (wonMonth / goal) * 100);

        // Feedback
        const avgPace = goal * (now.getDate() / 30);
        let feedback = "Keep pushing to hit your target.";
        if (wonMonth > avgPace * 1.1) feedback = "Great month! You’re ahead of your usual performance.";
        else if (wonMonth < avgPace * 0.8) feedback = "You're below your typical month. Focus on high value deals.";
        else feedback = "You're slightly behind. One deal can put you back on track.";

        const s = 9; // Mock streak
        return { monthlyGoal: goal, monthlyWon: wonMonth, percentGoal: pct, streak: s, feedbackText: feedback };
    }, [myProposals, meta]);

    const metrics = useMemo(() => {
        const { start, end } = getDateRange(timeRange);
        const sent = myProposals.filter(p => p.estado === 'Sent' && p.data_envio_email && new Date(p.data_envio_email) >= start && new Date(p.data_envio_email) <= end).length;
        const wonList = myProposals.filter(p => p.resultado === 'Won' && p.data_resultado && new Date(p.data_resultado) >= start && new Date(p.data_resultado) <= end);
        const wonCount = wonList.length;
        const wonVal = wonList.reduce((sum, p) => sum + p.total, 0);
        const pipeVal = myProposals.filter(p => ['Draft', 'Pending Approval', 'Approved', 'Sent'].includes(p.estado) && p.resultado === 'Open').reduce((sum, p) => sum + p.total, 0);
        const winRate = sent > 0 ? (wonCount / sent) * 100 : 0;
        return { sent, wonCount, wonVal, pipeVal, winRate };
    }, [myProposals, timeRange]);

    if (loading) return <div className="h-full flex items-center justify-center text-neutral-400">Loading Dashboard...</div>;

    const timeOptions = [
        { id: 'today', label: 'Today' },
        { id: 'week', label: 'Week' },
        { id: 'month', label: 'Month' },
        { id: 'quarter', label: 'Quarter' },
        { id: 'year', label: 'Year' },
    ];

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto pt-2">
            {/* Dashboard Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-2">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Hello, {user?.name.split(' ')[0]}!</h1>
                    <p className="text-neutral-500 mt-1">Here is what's happening with your sales.</p>
                </div>
                <div className="bg-white p-1 rounded-full border border-neutral-200 shadow-sm">
                    <SegmentedControl
                        options={timeOptions}
                        value={timeRange}
                        onChange={setTimeRange}
                        size="sm"
                    />
                </div>
            </div>

            {/* Row 1: Key Stats (Reference: Top row small cards) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Revenue"
                    value={formatCurrency(metrics.wonVal)}
                    icon={Wallet}
                    colorClass="text-primary-600"
                    trend="+12%"
                />
                <StatCard
                    title="Deals Won"
                    value={metrics.wonCount}
                    icon={Award}
                    colorClass="text-purple-600"
                    trend={metrics.wonCount > 0 ? "+2" : undefined}
                />
                <StatCard
                    title="Pipeline Value"
                    value={formatCurrency(metrics.pipeVal)}
                    icon={TrendingUp}
                    colorClass="text-blue-600"
                />
                <StatCard
                    title="Win Rate"
                    value={`${metrics.winRate.toFixed(0)}%`}
                    icon={Activity}
                    colorClass="text-orange-600"
                />
            </div>

            {/* Row 2: Main Content (Monthly Goal + Secondary) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Monthly Goal - Light Premium Style */}
                <div className="lg:col-span-2 bg-white rounded-3xl p-8 shadow-card border border-neutral-100/50 relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-8 relative z-10">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-xl font-bold text-neutral-900 tracking-tight">Monthly Goal</h3>
                                {percentGoal >= 100 && <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">Completed</span>}
                            </div>
                            <p className="text-neutral-500 text-sm">{feedbackText}</p>
                        </div>
                    </div>

                    <div className="flex items-end gap-3 mb-4 relative z-10">
                        <span className="text-5xl font-bold text-neutral-900 tracking-tighter">{formatCurrency(monthlyWon)}</span>
                        <span className="text-lg text-neutral-400 font-medium mb-1.5">/ {formatCurrency(monthlyGoal)}</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-4 w-full bg-neutral-100 rounded-full overflow-hidden mb-6 relative z-10">
                        <div
                            className="h-full bg-primary rounded-full shadow-lg shadow-primary/20 transition-all duration-1000 ease-out"
                            style={{ width: `${percentGoal}%` }}
                        ></div>
                    </div>

                    <div className="flex items-center gap-4 relative z-10">
                        <div className="flex items-center gap-1.5 bg-orange-50 text-orange-600 px-3 py-1.5 rounded-full text-sm font-bold border border-orange-100">
                            <Flame size={16} fill="currentColor" /> {streak} Day Streak
                        </div>
                    </div>

                    {/* Background Decor */}
                    <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity duration-700">
                        <Target size={250} />
                    </div>
                </div>

                {/* Right Column: CTA / Profile / secondary */}
                <div className="bg-primary text-white rounded-3xl p-8 shadow-xl shadow-primary/20 flex flex-col justify-between relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 text-white border border-white/20">
                            <Send size={24} />
                        </div>
                        <h3 className="text-2xl font-bold mb-2">Create New Proposal</h3>
                        <p className="text-primary-100 text-sm leading-relaxed mb-6">
                            Start a new sales opportunity. Configure products, set pricing, and send to client in seconds.
                        </p>
                    </div>

                    <button
                        onClick={() => navigate('/create')}
                        className="relative z-10 w-full bg-white text-primary font-bold py-3.5 rounded-xl hover:bg-primary-50 transition-colors shadow-lg"
                    >
                        Start Now
                    </button>

                    {/* Decor */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                    <div className="absolute bottom-0 right-0 w-32 h-32 bg-black/10 rounded-full blur-2xl"></div>
                </div>
            </div>

            {/* Row 3: Next Actions */}
            <div className="bg-white rounded-3xl p-8 shadow-card border border-neutral-100/50">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-neutral-900">Recommended Actions</h3>
                        <p className="text-sm text-neutral-500">AI-driven suggestions to close more deals</p>
                    </div>
                    <Button variant="ghost" size="sm">View All</Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {suggestions.map(action => (
                        <ActionItem
                            key={action.id}
                            action={action}
                            onClick={() => {
                                if (action.related_proposal_id) navigate(`/proposal/${action.related_proposal_id}`);
                                else if (action.related_client_id) navigate(`/client/${action.related_client_id}`);
                            }}
                        />
                    ))}
                    {suggestions.length === 0 && (
                        <div className="col-span-3 py-8 text-center text-neutral-400">
                            All caught up! No pending actions.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
