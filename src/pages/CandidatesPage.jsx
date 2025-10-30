import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Button, Card, CardHeader, CardTitle, CardContent,
  Input, Select, Textarea, Label, Badge, Toast, cn
} from '@/src/components/ui.jsx'; // Corrected alias path
import { FixedSizeList as List } from 'react-window';

const CANDIDATE_STAGES = ["applied", "screen", "tech", "offer", "hired", "rejected"];
const LOCAL_USERS = ['hr_manager', 'tech_lead', 'janet', 'david_p'];

// --- API Helper ---
async function fetchApi(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API error: ${res.statusText} - ${errorText}`);
  }
  if (res.status === 204) return;
  return res.json();
}

// --- Candidate Profile Page ---
function CandidateProfilePage({ id }) {
  const [candidate, setCandidate] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState(`Initial screening notes for @tech_lead:\n- Strong background in React\n- Good communication skills\n- Ask about @david_p's referral.`);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        setError(null);
        const [candidateData, timelineData] = await Promise.all([
          fetchApi(`/api/candidates/${id}`),
          fetchApi(`/api/candidates/${id}/timeline`)
        ]);
        setCandidate(candidateData);
        setTimeline(timelineData);
      } catch (err) {
        setError(err.message);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [id]);

  const renderNote = (text) => text.split(/(@\w+)/g).map((part, i) => 
    part.startsWith('@') && LOCAL_USERS.includes(part.substring(1)) ? 
    <strong key={i} className="text-blue-600 bg-blue-100 rounded-sm px-0.5">{part}</strong> : part
  );

  if (loading && !candidate) return null;
  if (error) return <p className="p-4 text-red-500">Error: {error}</p>;
  if (!candidate) return <p className="p-4 text-[#9CA3AF]">Candidate not found.</p>;

  return (
    <div className="space-y-6">
      <a href="#/candidates" className="text-[#3B82F6] hover:underline">&larr; Back to Candidates</a>
      <div className="flex items-center space-x-4">
        <img src={candidate.avatar} alt={candidate.name} className="w-20 h-20 rounded-full border border-[#374151]" />
        <div>
          <h1 className="text-3xl font-bold text-[#F9FAFB]">{candidate.name}</h1>
          <p className="text-lg text-[#9CA3AF]">{candidate.email}</p>
          <div className="mt-2"><Badge variant={candidate.stage}>{candidate.stage}</Badge></div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-[#1F2937] border-[#374151] text-[#F9FAFB]"><CardHeader><CardTitle>Timeline</CardTitle></CardHeader><CardContent>
          <ul className="space-y-4">
            {timeline.map(item => (
              <li key={item.id} className="relative pl-6 border-l-2 border-[#374151]">
                <span className="absolute -left-[11px] top-1 w-5 h-5 bg-[#1F2937] border-2 border-[#374151] rounded-full"></span>
                <p className="text-sm text-[#9CA3AF]">{item.date}</p>
                <p className="font-medium text-[#F9FAFB] capitalize">{item.stage}</p>
                <p className="text-sm text-[#9CA3AF]">{item.details}</p>
              </li>
            ))}
          </ul>
        </CardContent></Card>
        <Card className="bg-[#1F2937] border-[#374151] text-[#F9FAFB]"><CardHeader><CardTitle>Notes</CardTitle></CardHeader><CardContent className="space-y-4">
          <div className="p-3 border border-[#374151] rounded-md bg-[#232d3a] min-h-[100px] whitespace-pre-wrap">{renderNote(note)}</div>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a new note... (e.g. @hr_manager)" className="min-h-[120px]" />
          <Button disabled>Save Note (Disabled)</Button>
        </CardContent></Card>
      </div>
    </div>
  );
}

// --- Candidate List View ---
function CandidatesListPage() {
  const [candidates, setCandidates] = useState([]);
  const [totalCandidates, setTotalCandidates] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: '', stage: 'all' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const pageSize = 20;
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchTerm }));
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    try {
      setError(null);
      const params = new URLSearchParams({ ...filters, page, pageSize });
      const { data, total } = await fetchApi(`/api/candidates?${params}`);
      setCandidates(data);
      setTotalCandidates(total);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }, [filters, page, pageSize]);

  useEffect(() => { fetchCandidates(); }, [fetchCandidates]);

  const handleStageChange = (e) => {
    setFilters(prev => ({ ...prev, stage: e.target.value }));
    setPage(1);
  };

  if (loading) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <Input name="search" placeholder="Search by name or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-xs" />
        <Select name="stage" value={filters.stage} onChange={handleStageChange}>
          <option value="all">All Stages</option>
          {CANDIDATE_STAGES.map(stage => <option key={stage} value={stage} className="capitalize">{stage}</option>)}
        </Select>
      </div>
      <Card className="bg-[#1F2937] border-[#374151] text-[#F9FAFB]"><CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#1F2937]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="bg-[#1F2937] divide-y divide-[#374151]">
              {error && <tr><td colSpan="3" className="p-4 text-center text-red-500">Error: {error}</td></tr>}
              {!loading && candidates.length === 0 && <tr><td colSpan="3" className="p-4 text-center text-[#9CA3AF]">No candidates found.</td></tr>}
              {!loading && candidates.length > 0 && (
                <tr><td colSpan="3" className="p-0">
                  <List height={600} itemCount={candidates.length} itemSize={64} width={'100%'}>
                    {({ index, style }) => {
                      const candidate = candidates[index];
                      return (
                        <div style={style} className="flex items-center justify-between px-6">
                          <div className="flex items-center">
                            <img className="h-10 w-10 rounded-full border border-[#374151]" src={candidate.avatar} alt="" />
                            <div className="ml-4">
                              <div className="text-sm font-medium text-[#F9FAFB]">{candidate.name}</div>
                              <div className="text-sm text-[#9CA3AF]">{candidate.email}</div>
                            </div>
                          </div>
                          <div className="w-40"><Badge variant={candidate.stage}>{candidate.stage}</Badge></div>
                          <div className="text-right w-40 text-sm font-medium"><a href={`#/candidates/${candidate.id}`} className="text-[#3B82F6] hover:underline">View Profile</a></div>
                        </div>
                      );
                    }}
                  </List>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent></Card>
      <div className="flex items-center justify-between">
        <span className="text-sm text-[#9CA3AF]">Showing {candidates.length} of {totalCandidates} candidates</span>
        <div className="space-x-2">
          <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>Previous</Button>
          <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page * pageSize >= totalCandidates}>Next</Button>
        </div>
      </div>
    </div>
  );
}

// --- Candidate Kanban View ---
function CandidatesKanbanPage() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const dragCandidate = useRef(null);

  const fetchAllCandidates = useCallback(async () => {
    setLoading(true);
    try {
      setError(null);
      const params = new URLSearchParams({ search });
      const { data } = await fetchApi(`/api/candidates/all?${params}`);
      setCandidates(data);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }, [search]);

  useEffect(() => { fetchAllCandidates(); }, [fetchAllCandidates]);

  const candidatesByStage = useMemo(() => CANDIDATE_STAGES.reduce((acc, stage) => { acc[stage] = candidates.filter(c => c.stage === stage); return acc; }, {}), [candidates]);
  const handleDragStart = (e, candidate) => { e.dataTransfer.setData('candidateId', candidate.id); dragCandidate.current = candidate; };
  const handleDragOver = (e) => e.preventDefault();

  const handleDrop = async (e, newStage) => {
    e.preventDefault(); const candidateId = e.dataTransfer.getData('candidateId'); if (!candidateId) return;
    const candidate = candidates.find(c => c.id === candidateId); if (!candidate || candidate.stage === newStage) return;
    
    const oldCandidates = [...candidates];
    setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, stage: newStage } : c)); // Optimistic update
    
    try {
      await fetchApi(`/api/candidates/${candidateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      });
      setToast({ type: 'success', message: `${candidate.name} moved to ${newStage}` });
    } catch (err) { 
      setToast({ type: 'error', message: `Failed to move ${candidate.name}. Rolling back.` }); 
      setCandidates(oldCandidates); // Rollback
    }
    dragCandidate.current = null;
  };

  if (loading) return null;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
      <div className="flex-shrink-0 mb-4"><Input name="search" placeholder="Search all candidates..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" /></div>
      <div className="flex-grow flex space-x-4 overflow-x-auto pb-4">
        {CANDIDATE_STAGES.map(stage => (
          <div key={stage} className="w-72 flex-shrink-0 bg-[#1F2937] border border-[#374151] rounded-lg" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, stage)}>
            <h3 className="font-semibold p-3 border-b border-[#374151] capitalize text-[#F9FAFB]">{stage} ({candidatesByStage[stage]?.length || 0})</h3>
            <div className="p-2 space-y-2 h-full overflow-y-auto">
              {candidatesByStage[stage]?.map(candidate => <Card key={candidate.id} className="p-3 cursor-grab bg-[#1F2937] border-[#374151] text-[#F9FAFB]" draggable onDragStart={(e) => handleDragStart(e, candidate)}><div className="flex items-center space-x-2"><img src={candidate.avatar} alt={candidate.name} className="w-8 h-8 rounded-full border border-[#374151]" /><div><p className="text-sm font-medium text-[#F9FAFB]">{candidate.name}</p><p className="text-xs text-[#9CA3AF]">{candidate.email}</p></div></div></Card>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Parent Candidates Page ---
export function CandidatesPage({ params }) {
  const [view, setView] = useState('list');
  if (params.id) return <div className="container mx-auto p-4"><CandidateProfilePage id={params.id} /></div>;
  return (
    <div className="container mx-auto p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold text-[#F9FAFB]">Candidates</h1>
        <div className="flex space-x-2 p-1 border border-[#374151] rounded-lg">
          <Button variant={view === 'list' ? 'default' : 'ghost'} size="sm" onClick={() => setView('list')} className={view === 'list' ? '' : ''}>List</Button>
          <Button variant={view === 'kanban' ? 'default' : 'ghost'} size="sm" onClick={() => setView('kanban')} className={view === 'kanban' ? '' : ''}>Kanban</Button>
        </div>
      </div>
      {view === 'list' ? <CandidatesListPage /> : <CandidatesKanbanPage />}
    </div>
  );
}


