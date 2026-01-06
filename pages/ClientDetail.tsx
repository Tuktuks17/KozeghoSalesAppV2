
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, Mail, Phone, PlusCircle, 
    FileText, Clock, CheckSquare, MessageSquare, Calendar,
    User, Edit2, Save, X
} from 'lucide-react';
import { api } from '../services/api';
import { Cliente, Proposta, ClientTask, TimelineEvent } from '../types';

// --- Sub-components ---

const MetricCard = ({ label, value, subtext }: any) => (
    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</div>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        {subtext && <div className="text-xs text-slate-500 mt-1">{subtext}</div>}
    </div>
);

const XCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>;

const TimelineItem: React.FC<{ event: TimelineEvent }> = ({ event }) => {
    const icons: any = {
        proposal_created: FileText,
        proposal_sent: Mail,
        proposal_won: CheckSquare,
        proposal_lost: XCircleIcon,
        note_added: MessageSquare,
        status_change: Calendar
    };
    const Icon = icons[event.type] || MessageSquare;
    
    return (
        <div className="flex gap-4 pb-8 relative last:pb-0">
            <div className="absolute left-5 top-8 bottom-0 w-px bg-slate-200 last:hidden"></div>
            <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 z-10">
                <Icon size={16} className="text-slate-500"/>
            </div>
            <div>
                <div className="text-xs text-slate-400 mb-0.5">
                    {new Date(event.timestamp).toLocaleString()} by {event.created_by}
                </div>
                <div className="text-sm text-slate-800 bg-white p-3 rounded-lg border border-slate-100 shadow-sm inline-block">
                    {event.description}
                </div>
            </div>
        </div>
    );
};

const EditInput = ({ label, value, onChange }: any) => (
    <div className="mb-2">
        <label className="block text-xs font-bold text-slate-500 mb-1">{label}</label>
        <input 
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            value={value}
            onChange={e => onChange(e.target.value)}
        />
    </div>
);

export default function ClientDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [client, setClient] = useState<Cliente | null>(null);
    const [proposals, setProposals] = useState<Proposta[]>([]);
    const [tasks, setTasks] = useState<ClientTask[]>([]);
    const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
    const [activeTab, setActiveTab] = useState('Overview');
    const [loading, setLoading] = useState(true);

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<Partial<Cliente>>({});
    const [saving, setSaving] = useState(false);

    // Inputs for CRM actions
    const [newTask, setNewTask] = useState('');
    const [note, setNote] = useState('');
    const [internalNotes, setInternalNotes] = useState('');

    useEffect(() => {
        if(id) loadData();
    }, [id]);

    const loadData = async () => {
        if(!id) return;
        const [c, p, t, tl] = await Promise.all([
            api.getClienteById(id),
            api.getPropostas(),
            api.getTasks(id),
            api.getTimeline(id)
        ]);
        if(c) {
            setClient(c);
            setEditForm(c);
            setInternalNotes(c.notes || '');
        }
        setProposals(p.filter(x => x.cliente_id === id).sort((a,b) => new Date(b.data_criacao).getTime() - new Date(a.data_criacao).getTime()));
        setTasks(t);
        setTimeline(tl);
        setLoading(false);
    };

    // Auto-update language when country changes in edit form
    useEffect(() => {
        if (!isEditing || !editForm.pais) return;
        const p = editForm.pais.toLowerCase().trim();
        let lang: any = 'English';
        if (p === 'portugal') lang = 'Portuguese';
        else if (p === 'spain' || p === 'espanha') lang = 'Spanish';
        
        // Only update if it seems like a default action, or simplify and just update.
        // To be safe and helpful, we update it.
        setEditForm(prev => ({ ...prev, preferred_language: lang }));
    }, [editForm.pais, isEditing]);


    const handleStatusChange = async (e: any) => {
        if(!client) return;
        const s = e.target.value;
        await api.updateClientStatus(client.cliente_id, s);
        loadData();
    };

    const handleAddTask = async () => {
        if(!newTask || !client) return;
        await api.addTask({ client_id: client.cliente_id, client_name: client.nome_empresa, description: newTask });
        setNewTask('');
        loadData();
    };

    const handleToggleTask = async (tid: string) => {
        await api.toggleTask(tid);
        loadData();
    };

    const handleAddNote = async () => {
        if(!note || !client) return;
        await api.addTimelineEvent({ client_id: client.cliente_id, type: 'note_added', description: note });
        setNote('');
        loadData();
    };

    const handleSaveInternalNotes = async () => {
        if(!client) return;
        await api.saveClientNotes(client.cliente_id, internalNotes);
    };

    const handleSaveEdit = async () => {
        if (!client || !editForm) return;
        setSaving(true);
        const updatedClient = { ...client, ...editForm } as Cliente;
        await api.updateCliente(updatedClient);
        await loadData();
        setSaving(false);
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        if (client) setEditForm(client);
        setIsEditing(false);
    };

    if (loading) return <div className="p-10 text-center">Loading...</div>;
    if (!client) return <div className="p-10 text-center">Client not found.</div>;

    const tabs = ['Overview', 'Proposals', 'History', 'Tasks', 'Notes'];

    return (
        <div className="max-w-6xl mx-auto pb-20">
            <button onClick={() => navigate('/clients')} className="flex items-center text-slate-500 hover:text-slate-900 text-sm mb-4">
                <ArrowLeft size={16} className="mr-1"/> Back to Clients
            </button>

            {/* Header */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-6 transition-all">
                <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                    <div className="flex-1 w-full">
                        {isEditing ? (
                            <div className="space-y-4 animate-fade-in">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Editing Client Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <EditInput label="Company Name" value={editForm.nome_empresa} onChange={(v:any) => setEditForm({...editForm, nome_empresa: v})} />
                                    <EditInput label="Contact Name" value={editForm.nome_contacto} onChange={(v:any) => setEditForm({...editForm, nome_contacto: v})} />
                                    <EditInput label="Email" value={editForm.email} onChange={(v:any) => setEditForm({...editForm, email: v})} />
                                    <EditInput label="Phone" value={editForm.telefone} onChange={(v:any) => setEditForm({...editForm, telefone: v})} />
                                    
                                    <EditInput label="Website" value={editForm.website} onChange={(v:any) => setEditForm({...editForm, website: v})} />
                                    <EditInput label="Tax ID (NIF)" value={editForm.nif} onChange={(v:any) => setEditForm({...editForm, nif: v})} />
                                    <EditInput label="Industry" value={editForm.segmento} onChange={(v:any) => setEditForm({...editForm, segmento: v})} />
                                    <EditInput label="Company Size" value={editForm.company_size} onChange={(v:any) => setEditForm({...editForm, company_size: v})} />
                                    
                                    <EditInput label="Address" value={editForm.morada_faturacao} onChange={(v:any) => setEditForm({...editForm, morada_faturacao: v})} />
                                    <EditInput label="Country" value={editForm.pais} onChange={(v:any) => setEditForm({...editForm, pais: v})} />
                                    
                                    <div className="mb-2">
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Preferred Proposal Language</label>
                                        <select 
                                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                                            value={editForm.preferred_language}
                                            onChange={(e) => setEditForm({...editForm, preferred_language: e.target.value as any})}
                                        >
                                            {['Portuguese','English','Spanish','French'].map(s=><option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div className="mb-2">
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Market</label>
                                        <select 
                                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                                            value={editForm.market}
                                            onChange={(e) => setEditForm({...editForm, market: e.target.value as any})}
                                        >
                                            {['National','International'].map(s=><option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>

                                    <div className="mb-2">
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Client Status</label>
                                        <select 
                                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                                            value={editForm.status}
                                            onChange={(e) => setEditForm({...editForm, status: e.target.value as any})}
                                        >
                                            {['Lead','Prospect','Active Client','Inactive Client'].map(s=><option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Internal Notes</label>
                                        <textarea 
                                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                                            value={editForm.notes}
                                            onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                                            rows={3}
                                        />
                                    </div>

                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button onClick={handleSaveEdit} disabled={saving} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 flex items-center gap-2">
                                        {saving ? 'Saving...' : <><Save size={16}/> Save Changes</>}
                                    </button>
                                    <button onClick={handleCancelEdit} className="text-slate-500 hover:text-slate-900 px-4 py-2 rounded-lg text-sm font-medium">Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h1 className="text-3xl font-bold text-slate-900">{client.nome_empresa}</h1>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                        client.status === 'Active Client' ? 'bg-green-50 text-green-700' : 
                                        client.status === 'Inactive Client' ? 'bg-slate-100 text-slate-500' :
                                        client.status === 'Lead' ? 'bg-blue-50 text-blue-700' :
                                        'bg-yellow-50 text-yellow-700'
                                    }`}>{client.status}</span>
                                </div>
                                <div className="flex flex-wrap gap-4 text-sm text-slate-500 mt-2">
                                    <span className="flex items-center gap-1"><User size={14}/> {client.nome_contacto}</span>
                                    <span className="flex items-center gap-1"><Mail size={14}/> {client.email}</span>
                                    <span className="flex items-center gap-1"><Phone size={14}/> {client.telefone}</span>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                        {!isEditing && (
                            <>
                                <button 
                                    onClick={() => setIsEditing(true)}
                                    className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors text-sm"
                                >
                                    <Edit2 size={16}/> Edit Client
                                </button>
                                <button 
                                    onClick={() => navigate(`/create?clientId=${client.cliente_id}`)} 
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors text-sm shadow-sm"
                                >
                                    <PlusCircle size={18}/> New Proposal
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 mb-6 overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                            activeTab === tab 
                            ? 'border-slate-900 text-slate-900' 
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="min-h-[400px]">
                {activeTab === 'Overview' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <MetricCard label="Pipeline Value" value={`${client.metrics?.total_value_pipeline}€`} subtext={`${proposals.filter(p=>p.resultado==='Open').length} open proposals`}/>
                            <MetricCard label="Won Value" value={`${client.metrics?.total_value_won}€`} subtext={`${client.metrics?.total_proposals_won} won`}/>
                            <MetricCard label="Win Rate" value={`${client.metrics?.win_rate_percent.toFixed(0)}%`} />
                            <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-center">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Quick Status Update</label>
                                <select className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm" value={client.status} onChange={handleStatusChange}>
                                    {['Lead','Prospect','Active Client','Inactive Client'].map(s=><option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                <h3 className="font-bold text-slate-900 mb-4">Company Info</h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between border-b border-slate-50 pb-2">
                                        <span className="text-slate-500">Market</span>
                                        <span>{client.market}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-50 pb-2">
                                        <span className="text-slate-500">Proposal Language</span>
                                        <span>{client.preferred_language}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-50 pb-2">
                                        <span className="text-slate-500">Industry</span>
                                        <span>{client.segmento || '-'}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-50 pb-2">
                                        <span className="text-slate-500">Tax ID</span>
                                        <span>{client.nif || '-'}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-50 pb-2">
                                        <span className="text-slate-500">Address</span>
                                        <span className="text-right max-w-[200px]">{client.morada_faturacao || '-'}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-50 pb-2">
                                        <span className="text-slate-500">Country</span>
                                        <span>{client.pais || '-'}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-50 pb-2">
                                        <span className="text-slate-500">Company Size</span>
                                        <span>{client.company_size || '-'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Website</span>
                                        <a href={`https://${client.website}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{client.website || '-'}</a>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-slate-900">Recent Activity</h3>
                                    <button onClick={() => setActiveTab('History')} className="text-xs text-blue-600 font-medium hover:underline">View All</button>
                                </div>
                                <div className="space-y-4">
                                    {timeline.slice(0, 3).map(e => (
                                        <div key={e.event_id} className="flex gap-3 text-sm">
                                            <Clock size={16} className="text-slate-400 mt-0.5 shrink-0"/>
                                            <div>
                                                <p className="text-slate-800">{e.description}</p>
                                                <p className="text-xs text-slate-400">{new Date(e.timestamp).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {timeline.length === 0 && <p className="text-slate-400 text-sm italic">No activity recorded yet.</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'Proposals' && (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-fade-in">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Reference / Subject</th>
                                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Created</th>
                                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {proposals.map(p => (
                                    <tr key={p.proposta_id} className="hover:bg-slate-50 cursor-pointer" onClick={() => navigate(`/proposal/${p.proposta_id}`)}>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900">{p.proposta_id}</div>
                                            <div className="text-xs text-slate-500">{p.assunto || 'No subject'}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{new Date(p.data_criacao).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-sm"><span className="px-2 py-1 bg-slate-100 rounded text-xs font-bold text-slate-600">{p.estado}</span></td>
                                        <td className="px-6 py-4 text-right font-medium text-slate-900">{p.total.toFixed(2)}€</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {proposals.length === 0 && <div className="p-8 text-center text-slate-400">No proposals found for this client.</div>}
                    </div>
                )}

                {activeTab === 'History' && (
                    <div className="animate-fade-in max-w-3xl">
                        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-8 shadow-sm">
                            <div className="mb-2">
                                <label className="text-xs font-bold text-slate-500">Add a note</label>
                            </div>
                            <textarea 
                                className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-slate-900 outline-none mb-2 placeholder:text-slate-300" 
                                rows={3} 
                                placeholder="Add a note or meeting summary..."
                                value={note}
                                onChange={e => setNote(e.target.value)}
                            />
                            <div className="flex justify-end">
                                <button onClick={handleAddNote} disabled={!note} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center gap-2">
                                    <MessageSquare size={14} /> Add to History
                                </button>
                            </div>
                        </div>
                        <div className="pl-4">
                            {timeline.map(e => <TimelineItem key={e.event_id} event={e} />)}
                            {timeline.length === 0 && <div className="text-slate-400 italic text-sm">No history events yet.</div>}
                        </div>
                    </div>
                )}

                {activeTab === 'Tasks' && (
                    <div className="animate-fade-in max-w-3xl">
                        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 flex gap-2">
                            <input 
                                className="flex-1 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                                placeholder="Add a new task..."
                                value={newTask}
                                onChange={e => setNewTask(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                            />
                            <button onClick={handleAddTask} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold">Add</button>
                        </div>
                        <div className="space-y-2">
                            {tasks.map(t => (
                                <div key={t.task_id} className={`bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-4 ${t.is_done ? 'opacity-60' : ''}`}>
                                    <button onClick={() => handleToggleTask(t.task_id)} className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${t.is_done ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 hover:border-blue-500'}`}>
                                        {t.is_done && <CheckSquare size={14}/>}
                                    </button>
                                    <div className="flex-1">
                                        <p className={`text-sm font-medium text-slate-900 ${t.is_done ? 'line-through text-slate-500' : ''}`}>{t.description}</p>
                                        <p className="text-xs text-slate-400">Created by {t.created_by} on {new Date(t.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            ))}
                            {tasks.length === 0 && <div className="text-center py-10 text-slate-400 italic">No tasks. High five! ✋</div>}
                        </div>
                    </div>
                )}

                {activeTab === 'Notes' && (
                    <div className="animate-fade-in h-full">
                        <p className="text-xs text-slate-500 mb-2">Internal long-form notes for this client. These are persistent and editable.</p>
                        <textarea 
                            className="w-full h-[400px] border border-slate-200 rounded-xl p-6 text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-inner bg-white"
                            value={internalNotes}
                            onChange={e => setInternalNotes(e.target.value)}
                            onBlur={handleSaveInternalNotes}
                            placeholder="Start typing..."
                        />
                    </div>
                )}
            </div>
            <div className="h-10"></div>
        </div>
    );
}
