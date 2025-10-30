import React, { useState, useEffect, useMemo, useCallback, createContext, useContext, useRef } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// --- Shadcn/UI `cn` Utility ---
function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// --- Mock Database & API ---

// --- Seed Data ---
const SEED_JOBS = [
  { id: 'j1', title: 'Senior Frontend Engineer', slug: 'senior-frontend-engineer', status: 'active', tags: ['React', 'TypeScript'], order: 1 },
  { id: 'j2', title: 'Product Manager', slug: 'product-manager', status: 'active', tags: ['Agile', 'Strategy'], order: 2 },
  { id: 'j3', title: 'UX/UI Designer', slug: 'ux-ui-designer', status: 'archived', tags: ['Figma', 'Research'], order: 3 },
  { id: 'j4', title: 'Full-Stack Developer', slug: 'full-stack-developer', status: 'active', tags: ['React', 'Node.js'], order: 4 },
  { id: 'j5', title: 'DevOps Engineer', slug: 'devops-engineer', status: 'active', tags: ['AWS', 'Kubernetes'], order: 5 },
];

const CANDIDATE_STAGES = ["applied", "screen", "tech", "offer", "hired", "rejected"];
const FIRST_NAMES = ['Aisha', 'Bob', 'Charlie', 'David', 'Eva', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack'];
const LAST_NAMES = ['Smith', 'Johnson', 'Brown', 'Lee', 'Wilson', 'Patel', 'Kim', 'Garcia', 'Davis', 'Miller'];
const LOCAL_USERS = ['hr_manager', 'tech_lead', 'janet', 'david_p']; // For @mentions

function generateSeedCandidates(count = 1000) {
  const candidates = [];
  for (let i = 1; i <= count; i++) {
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
    const lastName = LAST_NAMES[i % LAST_NAMES.length];
    const name = `${firstName} ${lastName}`;
    candidates.push({
      id: `c${i}`, name,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
      stage: CANDIDATE_STAGES[i % CANDIDATE_STAGES.length],
      jobId: SEED_JOBS[i % SEED_JOBS.length].id,
      avatar: `https://placehold.co/40x40/E2E8F0/4A5568?text=${firstName[0]}${lastName[0]}`
    });
  }
  return candidates;
}

const SEED_TIMELINES = {
  'c1': [{ id: 't1', date: '2023-10-01', stage: 'applied', details: 'Applied to Senior Frontend Engineer' }, { id: 't2', date: '2023-10-03', stage: 'screen', details: 'Completed initial HR screening' }],
  'c2': [{ id: 't3', date: '2023-10-02', stage: 'applied', details: 'Applied to Senior Frontend Engineer' }],
  'c3': [{ id: 't4', date: '2023-10-01', stage: 'applied', details: 'Applied to Full-Stack Developer' }, { id: 't5', date: '2023-10-04', stage: 'screen', details: 'Completed initial HR screening' }, { id: 't6', date: '2023-10-07', stage: 'tech', details: 'Passed technical interview' }],
};

const SEED_ASSESSMENTS = {
  'j1': { // Assessment for Senior Frontend Engineer
    id: 'a1', jobId: 'j1',
    sections: [
      { id: 's1', title: 'Personal Information', questions: [
          { id: 'q1', text: 'Full Name', type: 'short-text', required: true },
          { id: 'q2', text: 'Portfolio URL', type: 'short-text', required: true, validation: { type: 'url' } },
        ]
      },
      { id: 's2', title: 'Technical Skills', questions: [
          { id: 'q3', text: 'Years of React Experience', type: 'numeric', required: true, validation: { min: 1, max: 20 } },
          { id: 'q4', text: 'Which state management libraries have you used?', type: 'multi-choice', required: true, options: ['Redux', 'Zustand', 'Jotai', 'Recoil', 'Context API'] },
          { id: 'q5', text: 'Do you have TypeScript experience?', type: 'single-choice', required: true, options: ['Yes', 'No'] },
          { id: 'q6', text: 'If "Yes", please rate your TypeScript proficiency (1-5)', type: 'numeric', required: false, validation: { min: 1, max: 5 }, conditional: { questionId: 'q5', value: 'Yes' } },
          { id: 'q7', text: 'Describe a complex problem you solved with React.', type: 'long-text', required: true, validation: { maxLength: 1000 } },
        ]
      }
    ]
  },
  'j2': { // Assessment for Product Manager
    id: 'a2', jobId: 'j2',
    sections: [
      { id: 's3', title: 'Background', questions: [
          { id: 'q8', text: 'How many years of PM experience do you have?', type: 'numeric', required: true },
          { id: 'q9', text: 'What is your preferred prioritization framework?', type: 'short-text', required: true },
          { id: 'q10', text: 'Describe your process for gathering user requirements.', type: 'long-text', required: true },
        ]
      }
    ]
  }
};
// --- End Seed Data ---

// --- API Context ---
const ApiContext = createContext();

// Our mock API functions
const useMockApi = () => {
  const [jobs, setJobs] = useState(SEED_JOBS);
  const [candidates, setCandidates] = useState(generateSeedCandidates(1000));
  const [timelines, setTimelines] = useState(SEED_TIMELINES);
  const [assessments, setAssessments] = useState(SEED_ASSESSMENTS);
  const [assessmentResponses, setAssessmentResponses] = useState({});
  const [loading, setLoading] = useState(false);

  const delay = (ms) => new Promise(res => setTimeout(res, ms));
  const randomDelay = () => Math.floor(Math.random() * 1000) + 200;

  // --- Jobs API ---
  const getJobs = useCallback(async ({ search = '', status = 'all', page = 1, pageSize = 10, sort = 'order' }) => {
    setLoading(true);
    const minDelay = 400;
    const start = Date.now();
    await delay(randomDelay());
    let filteredJobs = [...jobs];
    if (search) filteredJobs = filteredJobs.filter(job => job.title.toLowerCase().includes(search.toLowerCase()));
    if (status !== 'all') filteredJobs = filteredJobs.filter(job => job.status === status);
    filteredJobs.sort((a, b) => a[sort] - b[sort]);
    const totalJobs = filteredJobs.length;
    const paginatedJobs = filteredJobs.slice((page - 1) * pageSize, page * pageSize);
    // Wait for minimum visible spinner
    const elapsed = Date.now() - start;
    if (elapsed < minDelay) await delay(minDelay - elapsed);
    setLoading(false);
    return { data: paginatedJobs, total: totalJobs, page, pageSize };
  }, [jobs]);
  
  const getAllJobs = useCallback(async () => {
    setLoading(true);
    await delay(randomDelay() / 2);
    setLoading(false);
    return [...jobs];
  }, [jobs]);

  const createJob = useCallback(async (jobData) => {
    setLoading(true);
    await delay(randomDelay());
    const newJob = {
      ...jobData, id: `j${jobs.length + 1}`,
      slug: jobData.title.toLowerCase().replace(/\s+/g, '-'),
      order: jobs.length + 1, status: 'active',
      tags: jobData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
    };
    setJobs(prev => [...prev, newJob]);
    setLoading(false);
    return newJob;
  }, [jobs]);
  
const updateJob = useCallback(async (jobId, jobData) => {
    setLoading(true);
    await delay(randomDelay());
    let updatedJob = null;
    setJobs(prev => prev.map(job => {
      if (job.id === jobId) {
        // Start with the merged data
        updatedJob = { ...job, ...jobData };

        // **FIX:** Only process tags if they are provided as a string.
        // This prevents errors when only the status is being updated.
        if (typeof jobData.tags === 'string') {
          updatedJob.tags = jobData.tags.split(',').map(tag => tag.trim()).filter(Boolean);
        }
        
        return updatedJob;
      }
      return job;
    }));
    setLoading(false);
    return updatedJob;
  }, []);

  const archiveJob = useCallback(async (jobId) => updateJob(jobId, { status: 'archived' }), [updateJob]);
  const unarchiveJob = useCallback(async (jobId) => updateJob(jobId, { status: 'active' }), [updateJob]);
  const reorderJobs = useCallback(async (jobId, fromOrder, toOrder) => console.log("Reordering job..."), []);

  // --- Candidates API ---
  const getCandidates = useCallback(async ({ search = '', stage = 'all', page = 1, pageSize = 20 }) => {
    setLoading(true);
    const minDelay = 400;
    const start = Date.now();
    await delay(randomDelay());
    let filteredCandidates = [...candidates];
    if (search) {
      search = search.toLowerCase();
      filteredCandidates = filteredCandidates.filter(c => c.name.toLowerCase().includes(search) || c.email.toLowerCase().includes(search));
    }
    if (stage !== 'all') filteredCandidates = filteredCandidates.filter(c => c.stage === stage);
    const totalCandidates = filteredCandidates.length;
    const paginatedCandidates = filteredCandidates.slice((page - 1) * pageSize, page * pageSize);
    const elapsed = Date.now() - start;
    if (elapsed < minDelay) await delay(minDelay - elapsed);
    setLoading(false);
    return { data: paginatedCandidates, total: totalCandidates, page, pageSize };
  }, [candidates]);
  
  const getAllCandidates = useCallback(async ({ search = '' }) => {
    setLoading(true);
    const minDelay = 300;
    const start = Date.now();
    await delay(randomDelay());
    let filteredCandidates = [...candidates];
    if (search) {
      search = search.toLowerCase();
      filteredCandidates = filteredCandidates.filter(c => c.name.toLowerCase().includes(search) || c.email.toLowerCase().includes(search));
    }
    const elapsed = Date.now() - start;
    if (elapsed < minDelay) await delay(minDelay - elapsed);
    setLoading(false);
    return { data: filteredCandidates };
  }, [candidates]);

  const getCandidate = useCallback(async (id) => {
    setLoading(true);
    await delay(randomDelay() / 2);
    const candidate = candidates.find(c => c.id === id);
    setLoading(false);
    if (!candidate) throw new Error("Candidate not found.");
    return candidate;
  }, [candidates]);

  const getCandidateTimeline = useCallback(async (id) => {
    setLoading(true);
    await delay(randomDelay() / 2);
    setLoading(false);
    return timelines[id] || [];
  }, [timelines]);

  const updateCandidateStage = useCallback(async (id, stage) => {
    setLoading(true);
    await delay(randomDelay());
    if (Math.random() < 0.1) { setLoading(false); throw new Error("Failed to update candidate stage."); }
    let updatedCandidate = null;
    setCandidates(prev => prev.map(c => c.id === id ? (updatedCandidate = { ...c, stage }) : c));
    const newTimelineEntry = { id: `t${Date.now()}`, date: new Date().toISOString().split('T')[0], stage, details: `Moved to ${stage} stage` };
    setTimelines(prev => ({ ...prev, [id]: [...(prev[id] || []), newTimelineEntry] }));
    setLoading(false);
    return updatedCandidate;
  }, []);

  // Add: Candidate Notes API
  const addCandidateNote = useCallback(async (id, noteText) => {
    setLoading(true);
    await delay(randomDelay() / 2);
    const entry = { id: `n${Date.now()}`, date: new Date().toISOString().split('T')[0], stage: 'note', details: noteText };
    setTimelines(prev => ({ ...prev, [id]: [...(prev[id] || []), entry] }));
    setLoading(false);
    return entry;
  }, []);

  // --- Assessments API (New in Step 3) ---
  const getAssessment = useCallback(async (jobId) => {
    setLoading(true);
    await delay(randomDelay() / 2);
    setLoading(false);
    return assessments[jobId] || null; // Return assessment or null
  }, [assessments]);
  
  const updateAssessment = useCallback(async (jobId, assessmentData) => {
    setLoading(true);
    await delay(randomDelay());
    if (Math.random() < 0.05) { setLoading(false); throw new Error("Failed to save assessment."); }
    setAssessments(prev => ({ ...prev, [jobId]: assessmentData }));
    setLoading(false);
    return assessmentData;
  }, []);
  
  const submitAssessment = useCallback(async (jobId, responses) => {
    setLoading(true);
    await delay(randomDelay());
    if (Math.random() < 0.05) { setLoading(false); throw new Error("Failed to submit assessment."); }
    // Store response locally, keyed by jobId and a timestamp
    const submissionId = `sub_${Date.now()}`;
    setAssessmentResponses(prev => ({
      ...prev,
      [jobId]: { ...prev[jobId], [submissionId]: responses }
    }));
    console.log("Assessment submitted:", { jobId, submissionId, responses });
    setLoading(false);
    return { submissionId };
  }, []);


  return {
    loading,
    getJobs, getAllJobs, createJob, updateJob, archiveJob, unarchiveJob, reorderJobs, // Jobs
    getCandidates, getAllCandidates, getCandidate, getCandidateTimeline, updateCandidateStage, addCandidateNote, // Candidates
    getAssessment, updateAssessment, submitAssessment // Assessments
  };
};

// --- Simple Hash-Based Router ---
const useHashRouter = (routes) => {
  const [currentPath, setCurrentPath] = useState(window.location.hash || '#/');
  useEffect(() => {
    const handleHashChange = () => setCurrentPath(window.location.hash || '#/');
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
  const routeConfig = useMemo(() => {
    const matchedRoute = Object.keys(routes).find(route => new RegExp(`^${route.replace(/:[^\s/]+/g, '([\\w-]+)')}$`).test(currentPath));
    if (!matchedRoute) return { Component: () => <div>404 - Page Not Found</div>, params: {} };
    const routeRegex = new RegExp(`^${matchedRoute.replace(/:[^\s/]+/g, '([\\w-]+)')}$`);
    const paramValues = (currentPath.match(routeRegex) || []).slice(1);
    const paramKeys = (matchedRoute.match(/:[^\s/]+/g) || []).map(key => key.substring(1));
    const params = Object.fromEntries(paramKeys.map((key, index) => [key, paramValues[index]]));
    return { Component: routes[matchedRoute], params };
  }, [currentPath, routes]);
  return routeConfig;
};

// --- Re-created Shadcn/UI Components ---

// Button
const Button = React.forwardRef(({ className, variant = 'default', size = 'default', asChild = false, ...props }, ref) => {
  const Comp = asChild ? 'span' : 'button';
  const variants = { default: "bg-blue-600 text-white hover:bg-blue-700", destructive: "bg-red-600 text-white hover:bg-red-700", outline: "border border-gray-300 hover:bg-gray-100", secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300", ghost: "hover:bg-gray-100", link: "text-blue-600 underline-offset-4 hover:underline" };
  const sizes = { default: "h-10 px-4 py-2", sm: "h-9 rounded-md px-3", lg: "h-11 rounded-md px-8", icon: "h-10 w-10" };
  return <Comp className={cn("inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none", variants[variant], sizes[size], className)} ref={ref} {...props} />
});
// Card
const Card = React.forwardRef(({ className, ...props }, ref) => <div ref={ref} className={cn("rounded-lg border bg-white text-gray-900 shadow-sm", className)} {...props} />);
const CardHeader = React.forwardRef(({ className, ...props }, ref) => <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />);
const CardTitle = React.forwardRef(({ className, ...props }, ref) => <h3 ref={ref} className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />);
const CardDescription = React.forwardRef(({ className, ...props }, ref) => <p ref={ref} className={cn("text-sm text-gray-600", className)} {...props} />);
const CardContent = React.forwardRef(({ className, ...props }, ref) => <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />);
const CardFooter = React.forwardRef(({ className, ...props }, ref) => <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />);
// Input
const Input = React.forwardRef(({ className, type, ...props }, ref) => <input type={type} className={cn("flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", className)} ref={ref} {...props} />);
// Textarea
const Textarea = React.forwardRef(({ className, ...props }, ref) => <textarea className={cn("flex min-h-[80px] w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", className)} ref={ref} {...props} />);
// Label
const Label = React.forwardRef(({ className, ...props }, ref) => <label ref={ref} className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)} {...props} />);
// Select
const Select = React.forwardRef(({ className, children, ...props }, ref) => <select className={cn("flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", className)} ref={ref} {...props}>{children}</select>);
// Dialog
const DialogContext = createContext();
const Dialog = ({ open, onOpenChange, children }) => {
  if (!open) return null;
  return (<DialogContext.Provider value={{ onOpenChange }}><div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => onOpenChange(false)} /><div className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-white p-6 shadow-lg">{children}</div></DialogContext.Provider>);
};
const DialogTitle = ({ className, ...props }) => <h2 className={cn("text-lg font-semibold text-gray-900", className)} {...props} />;
const DialogDescription = ({ className, ...props }) => <p className={cn("text-sm text-gray-900", className)} {...props} />;
const DialogFooter = ({ className, ...props }) => <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4 text-gray-900", className)} {...props} />;
// Badge
const Badge = ({ className, variant = 'default', ...props }) => {
  const variants = { default: "bg-gray-200 text-gray-800", active: "bg-green-100 text-green-800", archived: "bg-yellow-100 text-yellow-800", applied: "bg-blue-100 text-blue-800", screen: "bg-indigo-100 text-indigo-800", tech: "bg-purple-100 text-purple-800", offer: "bg-green-100 text-green-800", hired: "bg-green-200 text-green-900 font-bold", rejected: "bg-red-100 text-red-800" };
  return <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors", variants[variant], className)} {...props} />
};
// Toast
function Toast({ message, type = 'error', onDismiss }) {
  const colors = { error: 'bg-red-600', success: 'bg-green-600' };
  useEffect(() => { const timer = setTimeout(onDismiss, 3000); return () => clearTimeout(timer); }, [onDismiss]);
  return <div className={cn("fixed bottom-4 right-4 z-50 max-w-sm rounded-lg shadow-lg text-white px-4 py-3", colors[type])}>{message}</div>
}
// Checkbox (New)
const Checkbox = React.forwardRef(({ className, ...props }, ref) => (
  <input
    type="checkbox"
    ref={ref}
    className={cn(
      "h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500",
      className
    )}
    {...props}
  />
));
// RadioGroup (New)
const RadioGroup = ({ children }) => <div className="space-y-2">{children}</div>;
const RadioGroupItem = React.forwardRef(({ className, value, ...props }, ref) => (
  <div className="flex items-center space-x-2">
    <input
      type="radio"
      ref={ref}
      value={value}
      className={cn(
        "h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500",
        className
      )}
      {...props}
    />
    <Label htmlFor={props.id}>{value}</Label>
  </div>
));
// Switch (New)
const Switch = React.forwardRef(({ className, checked, onCheckedChange, ...props }, ref) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onCheckedChange(!checked)}
    className={cn(
      "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
      checked ? 'bg-blue-600' : 'bg-gray-200',
      className
    )}
    ref={ref}
    {...props}
  >
    <span
      aria-hidden="true"
      className={cn(
        "inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
        checked ? 'translate-x-5' : 'translate-x-0'
      )}
    />
  </button>
));


// --- Page Components ---

// --- JobsPage (from Step 1) ---
function JobForm({ job, onSave, onCancel }) {
  const api = useContext(ApiContext);
  const [formData, setFormData] = useState({ title: job?.title || '', tags: job?.tags?.join(', ') || '' });
  const [errors, setErrors] = useState({});
  const validate = () => { const newErrors = {}; if (!formData.title) newErrors.title = 'Title is required'; setErrors(newErrors); return Object.keys(newErrors).length === 0; };
  const handleSubmit = async (e) => {
    e.preventDefault(); if (!validate()) return;
    try {
      if (job) await api.updateJob(job.id, formData);
      else await api.createJob(formData);
      onSave();
    } catch (error) { setErrors({ form: 'Failed to save job.' }); }
  };
  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.form && <p className="text-sm text-red-600">{errors.form}</p>}
      <div className="space-y-2"><Label htmlFor="title">Job Title</Label><Input id="title" name="title" value={formData.title} onChange={handleChange} />{errors.title && <p className="text-sm text-red-600">{errors.title}</p>}</div>
      <div className="space-y-2"><Label htmlFor="tags">Tags (comma-separated)</Label><Input id="tags" name="tags" value={formData.tags} onChange={handleChange} /></div>
      <DialogFooter><Button type="button" variant="outline" onClick={onCancel}>Cancel</Button><Button type="submit" disabled={api.loading}>{api.loading ? 'Saving...' : 'Save Job'}</Button></DialogFooter>
    </form>
  );
}
function JobsPage() {
  const api = useContext(ApiContext);
  const [jobs, setJobs] = useState([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: '', status: 'all' });
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const pageSize = 10;
  const fetchJobs = useCallback(async () => { try { setError(null); const { data, total } = await api.getJobs({ ...filters, page, pageSize }); setJobs(data); setTotalJobs(total); } catch (err) { setError(err.message); } }, [api, filters, page, pageSize]);
  useEffect(() => { fetchJobs(); }, [fetchJobs]);
  const handleFilterChange = (e) => { setFilters(prev => ({ ...prev, [e.target.name]: e.target.value })); setPage(1); };
  const openEditModal = (job) => { setEditingJob(job); setIsModalOpen(true); };
  const openCreateModal = () => { setEditingJob(null); setIsModalOpen(true); };
  const handleSaveJob = () => { setIsModalOpen(false); setEditingJob(null); fetchJobs(); };
  const handleArchive = async (job) => { try { await (job.status === 'active' ? api.archiveJob(job.id) : api.unarchiveJob(job.id)); fetchJobs(); } catch (err) { setError("Failed to update job status."); } };
  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between"><h1 className="text-3xl font-bold">Jobs Board</h1><Button onClick={openCreateModal}>Create Job</Button></div>
      <div className="flex items-center space-x-4"><Input name="search" placeholder="Search by title..." value={filters.search} onChange={handleFilterChange} className="max-w-xs" /><Select name="status" value={filters.status} onChange={handleFilterChange}><option value="all">All Statuses</option><option value="active">Active</option><option value="archived">Archived</option></Select></div>
      {api.loading && null}{error && <p className="text-red-600">Error: {error}</p>}
      <div className="space-y-4">
        {jobs.map(job => (
          <Card key={job.id}>
            <CardHeader><div className="flex items-center justify-between"><CardTitle>{job.title}</CardTitle><Badge variant={job.status}>{job.status}</Badge></div><div className="flex space-x-2 pt-2">{job.tags.map(tag => <Badge key={tag}>{tag}</Badge>)}</div></CardHeader>
            <CardFooter className="flex justify-end space-x-2"><Button variant="outline" size="sm" onClick={() => openEditModal(job)}>Edit</Button><Button variant={job.status === 'active' ? 'destructive' : 'secondary'} size="sm" onClick={() => handleArchive(job)}>{job.status === 'active' ? 'Archive' : 'Unarchive'}</Button></CardFooter>
          </Card>
        ))}
      </div>
      <div className="flex items-center justify-between"><span className="text-sm text-gray-700">Showing {jobs.length} of {totalJobs} jobs</span><div className="space-x-2"><Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>Previous</Button><Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page * pageSize >= totalJobs}>Next</Button></div></div>
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}><DialogTitle>{editingJob ? 'Edit Job' : 'Create New Job'}</DialogTitle><JobForm job={editingJob} onSave={handleSaveJob} onCancel={() => setIsModalOpen(false)} /></Dialog>
    </div>
  );
}

// --- CandidatesPage (from Step 2) ---
function CandidateProfilePage({ id }) {
  const api = useContext(ApiContext);
  const [candidate, setCandidate] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [error, setError] = useState(null);
  const [note, setNote] = useState(`Initial screening notes for @tech_lead:\n- Strong background in React\n- Good communication skills\n- Ask about @david_p's referral.`);
  useEffect(() => { const fetchProfile = async () => { try { setError(null); const [candidateData, timelineData] = await Promise.all([api.getCandidate(id), api.getCandidateTimeline(id)]); setCandidate(candidateData); setTimeline(timelineData); } catch (err) { setError(err.message); } }; fetchProfile(); }, [api, id]);
  const renderNote = (text) => text.split(/(@\w+)/g).map((part, i) => part.startsWith('@') && LOCAL_USERS.includes(part.substring(1)) ? <strong key={i} className="text-blue-600 bg-blue-100 rounded-sm px-0.5">{part}</strong> : part);
  if (api.loading && !candidate) return <p className="p-4">Loading candidate profile...</p>;
  if (error) return <p className="p-4 text-red-600">Error: {error}</p>;
  if (!candidate) return <p className="p-4">Candidate not found.</p>;
  const handleSaveNote = async () => {
    try {
      const entry = await api.addCandidateNote(candidate.id, note);
      setTimeline(prev => [...prev, entry]);
    } catch (e) {
      // swallow; could show toast
    }
  };
  return (
    <div className="space-y-6">
      <a href="#/candidates" className="text-blue-600 hover:underline">&larr; Back to Candidates</a>
      <div className="flex items-center space-x-4"><img src={candidate.avatar} alt={candidate.name} className="w-20 h-20 rounded-full border" /><div><h1 className="text-3xl font-bold">{candidate.name}</h1><p className="text-lg text-gray-600">{candidate.email}</p><div className="mt-2"><Badge variant={candidate.stage}>{candidate.stage}</Badge></div></div></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card><CardHeader><CardTitle>Timeline</CardTitle></CardHeader><CardContent><ul className="space-y-4">{timeline.map(item => <li key={item.id} className="relative pl-6 border-l-2 border-gray-200"><span className="absolute -left-[11px] top-1 w-5 h-5 bg-white border-2 border-gray-300 rounded-full"></span><p className="text-sm text-gray-500">{item.date}</p><p className="font-medium text-gray-800 capitalize">{item.stage}</p><p className="text-sm text-gray-600">{item.details}</p></li>)}</ul></CardContent></Card>
        <Card><CardHeader><CardTitle>Notes</CardTitle></CardHeader><CardContent className="space-y-4"><div className="p-3 border rounded-md bg-gray-50 min-h-[100px] whitespace-pre-wrap">{renderNote(note)}</div><Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a new note... (e.g. @hr_manager)" className="min-h-[120px]" /><Button onClick={handleSaveNote}>Save Note</Button></CardContent></Card>
      </div>
    </div>
  );
}
function CandidatesListPage() {
  const api = useContext(ApiContext);
  const [candidates, setCandidates] = useState([]);
  const [totalCandidates, setTotalCandidates] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: '', stage: 'all' });
  const [error, setError] = useState(null);
  const pageSize = 20;
  const [searchTerm, setSearchTerm] = useState('');
  useEffect(() => { const handler = setTimeout(() => { setFilters(prev => ({ ...prev, search: searchTerm })); setPage(1); }, 300); return () => clearTimeout(handler); }, [searchTerm]);
  const fetchCandidates = useCallback(async () => { try { setError(null); const { data, total } = await api.getCandidates({ ...filters, page, pageSize }); setCandidates(data); setTotalCandidates(total); } catch (err) { setError(err.message); } }, [api, filters, page, pageSize]);
  useEffect(() => { fetchCandidates(); }, [fetchCandidates]);
  const handleStageChange = (e) => { setFilters(prev => ({ ...prev, stage: e.target.value })); setPage(1); };
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4"><Input name="search" placeholder="Search by name or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-xs" /><Select name="stage" value={filters.stage} onChange={handleStageChange}><option value="all">All Stages</option>{CANDIDATE_STAGES.map(stage => <option key={stage} value={stage} className="capitalize">{stage}</option>)}</Select></div>
      <Card><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th></tr></thead><tbody className="bg-white divide-y divide-gray-200">{error && <tr><td colSpan="3" className="p-4 text-center text-red-600">Error: {error}</td></tr>}{!api.loading && candidates.length === 0 && <tr><td colSpan="3" className="p-4 text-center">No candidates found.</td></tr>}{candidates.map(candidate => <tr key={candidate.id}><td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center"><img className="h-10 w-10 rounded-full" src={candidate.avatar} alt="" /><div className="ml-4"><div className="text-sm font-medium text-gray-900">{candidate.name}</div><div className="text-sm text-gray-500">{candidate.email}</div></div></div></td><td className="px-6 py-4 whitespace-nowGrap"><Badge variant={candidate.stage}>{candidate.stage}</Badge></td><td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"><a href={`#/candidates/${candidate.id}`} className="text-blue-600 hover:text-blue-900">View Profile</a></td></tr>)}</tbody></table></div></CardContent></Card>
      <div className="flex items-center justify-between"><span className="text-sm text-gray-700">Showing {candidates.length} of {totalCandidates} candidates</span><div className="space-x-2"><Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>Previous</Button><Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page * pageSize >= totalCandidates}>Next</Button></div></div>
    </div>
  );
}
function CandidatesKanbanPage() {
  const api = useContext(ApiContext);
  const [candidates, setCandidates] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const dragCandidate = useRef(null);
  const fetchAllCandidates = useCallback(async () => { try { setError(null); const { data } = await api.getAllCandidates({ search }); setCandidates(data); } catch (err) { setError(err.message); } }, [api, search]);
  useEffect(() => { fetchAllCandidates(); }, [fetchAllCandidates]);
  const candidatesByStage = useMemo(() => CANDIDATE_STAGES.reduce((acc, stage) => { acc[stage] = candidates.filter(c => c.stage === stage); return acc; }, {}), [candidates]);
  const handleDragStart = (e, candidate) => { e.dataTransfer.setData('candidateId', candidate.id); dragCandidate.current = candidate; };
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = async (e, newStage) => {
    e.preventDefault(); const candidateId = e.dataTransfer.getData('candidateId'); if (!candidateId) return;
    const candidate = candidates.find(c => c.id === candidateId); if (!candidate || candidate.stage === newStage) return;
    const oldCandidates = [...candidates];
    setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, stage: newStage } : c));
    try {
      await api.updateCandidateStage(candidateId, newStage);
      setToast({ type: 'success', message: `${candidate.name} moved to ${newStage}` });
    } catch (err) { setToast({ type: 'error', message: `Failed to move ${candidate.name}. Rolling back.` }); setCandidates(oldCandidates); }
    dragCandidate.current = null;
  };
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
      <div className="flex-shrink-0 mb-4"><Input name="search" placeholder="Search all candidates..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" /></div>
      {api.loading && null}{error && <p className="text-red-600">Error: {error}</p>}
      <div className="flex-grow flex space-x-4 overflow-x-auto pb-4">
        {CANDIDATE_STAGES.map(stage => (
          <div key={stage} className="w-72 flex-shrink-0 bg-gray-500 rounded-lg" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, stage)}>
            <h3 className="font-semibold p-3 border-b capitalize">{stage} ({candidatesByStage[stage]?.length || 0})</h3>
            <div className="p-2 space-y-2 h-full overflow-y-auto">
              {candidatesByStage[stage]?.map(candidate => <Card key={candidate.id} className="p-3 cursor-grab" draggable onDragStart={(e) => handleDragStart(e, candidate)}><div className="flex items-center space-x-2"><img src={candidate.avatar} alt={candidate.name} className="w-8 h-8 rounded-full" /><div><p className="text-sm font-medium">{candidate.name}</p><p className="text-xs text-gray-500">{candidate.email}</p></div></div></Card>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
function CandidatesPage() {
  const { params } = useHashRouter(routes);
  const [view, setView] = useState('list');
  if (params.id) return <div className="container mx-auto p-4"><CandidateProfilePage id={params.id} /></div>;
  return (
    <div className="container mx-auto p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4"><h1 className="text-3xl font-bold">Candidates</h1><div className="flex space-x-2 p-1 bg-gray-200 rounded-lg"><Button variant={view === 'list' ? 'default' : 'ghost'} size="sm" onClick={() => setView('list')} className={view === 'list' ? 'bg-white text-blue-600 shadow-sm' : ''}>List</Button><Button variant={view === 'kanban' ? 'default' : 'ghost'} size="sm" onClick={() => setView('kanban')} className={view === 'kanban' ? 'bg-white text-blue-600 shadow-sm' : ''}>Kanban</Button></div></div>
      {view === 'list' ? <CandidatesListPage /> : <CandidatesKanbanPage />}
    </div>
  );
}


// --- AssessmentsPage (New in Step 3) ---

// Component to render a single question in the PREVIEW pane
function AssessmentPreviewQuestion({ question, responses, onResponseChange, allResponses }) {
  // Check conditional logic
  if (question.conditional) {
    const { questionId, value } = question.conditional;
    const dependencyResponse = allResponses[questionId];
    if (dependencyResponse !== value) {
      return null; // Don't render this question
    }
  }

  const { id, type, text, options, required, validation } = question;
  const value = responses[id] || (type === 'multi-choice' ? [] : '');

  const handleChange = (e) => {
    const { value, type, checked } = e.target;
    if (type === 'checkbox') {
      const newValue = checked
        ? [...(responses[id] || []), value]
        : (responses[id] || []).filter(v => v !== value);
      onResponseChange(id, newValue);
    } else {
      onResponseChange(id, value);
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <Label htmlFor={id} className="text-base">
          {text} {required && <span className="text-red-500">*</span>}
        </Label>
      </CardHeader>
      <CardContent>
        {type === 'short-text' && (
          <Input id={id} value={value} onChange={handleChange} required={required} />
        )}
        {type === 'long-text' && (
          <Textarea id={id} value={value} onChange={handleChange} required={required} maxLength={validation?.maxLength} />
        )}
        {type === 'numeric' && (
          <Input id={id} type="number" value={value} onChange={handleChange} required={required} min={validation?.min} max={validation?.max} />
        )}
        {type === 'single-choice' && (
          <RadioGroup name={id} onValueChange={(val) => onResponseChange(id, val)} value={value}>
            {options.map(opt => <RadioGroupItem key={opt} value={opt} id={`${id}-${opt}`} name={id} />)}
          </RadioGroup>
        )}
        {type === 'multi-choice' && (
          <div className="space-y-2">
            {options.map(opt => (
              <div key={opt} className="flex items-center space-x-2">
                <Checkbox id={`${id}-${opt}`} value={opt} checked={value.includes(opt)} onChange={handleChange} />
                <Label htmlFor={`${id}-${opt}`}>{opt}</Label>
              </div>
            ))}
          </div>
        )}
        {/* 'file-upload' stub */}
        {type === 'file-upload' && (
          <Input id={id} type="file" disabled />
        )}
      </CardContent>
    </Card>
  );
}

// Component to render the BUILDER UI
function AssessmentBuilder({ assessment, onSave }) {
  const api = useContext(ApiContext);
  const [data, setData] = useState(assessment);
  const [toast, setToast] = useState(null);
  
  // This syncs the builder state *back* to the parent (AssessmentsPage)
  // so the preview pane can update in real-time.
  useEffect(() => {
    onSave(data, false); // false = don't show toast
  }, [data, onSave]);

  const handleSave = async () => {
    try {
      await api.updateAssessment(data.jobId, data);
      setToast({ type: 'success', message: 'Assessment saved!' });
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to save.' });
    }
  };

  const handleQuestionChange = (sectionIndex, questionIndex, field, value) => {
    const newData = { ...data };
    newData.sections[sectionIndex].questions[questionIndex][field] = value;
    setData(newData);
  };
  
  const handleAddQuestion = (sectionIndex) => {
    const newQuestion = {
      id: `q${Date.now()}`,
      text: 'New Question',
      type: 'short-text',
      required: false,
      options: [],
    };
    const newData = { ...data };
    newData.sections[sectionIndex].questions.push(newQuestion);
    setData(newData);
  };
  
  // (More functions needed for full builder: addSection, removeQuestion, etc.)

  return (
    <Card className="h-full overflow-y-auto">
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Assessment Builder</CardTitle>
          <Button onClick={handleSave} disabled={api.loading}>
            {api.loading ? 'Saving...' : 'Save Assessment'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {data.sections.map((section, sIdx) => (
          <div key={section.id} className="p-4 border rounded-lg space-y-4">
            <h3 className="text-lg font-semibold">{section.title}</h3>
            {section.questions.map((q, qIdx) => (
              <div key={q.id} className="p-3 border bg-gray-50 rounded-md space-y-3">
                <div className="space-y-1">
                  <Label>Question Text</Label>
                  <Input 
                    value={q.text} 
                    onChange={(e) => handleQuestionChange(sIdx, qIdx, 'text', e.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <div className="space-y-1 flex-1">
                    <Label>Question Type</Label>
                    <Select 
                      value={q.type}
                      onChange={(e) => handleQuestionChange(sIdx, qIdx, 'type', e.target.value)}
                    >
                      <option value="short-text">Short Text</option>
                      <option value="long-text">Long Text</option>
                      <option value="numeric">Numeric</option>
                      <option value="single-choice">Single-Choice</option>
                      <option value="multi-choice">Multi-Choice</option>
                      <option value="file-upload">File Upload (Stub)</option>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <Switch
                      checked={q.required}
                      onCheckedChange={(val) => handleQuestionChange(sIdx, qIdx, 'required', val)}
                    />
                    <Label>Required</Label>
                  </div>
                </div>
                {(q.type === 'single-choice' || q.type === 'multi-choice') && (
                  <div className="space-y-1">
                    <Label>Options (comma-separated)</Label>
                    <Input
                      value={(q.options || []).join(', ')}
                      onChange={(e) => handleQuestionChange(sIdx, qIdx, 'options', e.target.value.split(',').map(s => s.trim()))}
                    />
                  </div>
                )}
                 {/* (Conditional logic UI would go here) */}
              </div>
            ))}
            <Button variant="secondary" size="sm" onClick={() => handleAddQuestion(sIdx)}>
              + Add Question
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// Main Assessments Page
function AssessmentsPage() {
  const api = useContext(ApiContext);
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [assessment, setAssessment] = useState(null); // For builder
  const [responses, setResponses] = useState({}); // For preview
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Fetch all jobs for the dropdown
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const allJobs = await api.getAllJobs();
        setJobs(allJobs);
        if (allJobs.length > 0) {
          setSelectedJobId(allJobs[0].id); // Select the first job by default
        }
      } catch (err) {
        setError('Failed to load jobs.');
      }
    };
    fetchJobs();
  }, [api]);

  // Fetch assessment when job ID changes
  useEffect(() => {
    if (!selectedJobId) return;
    const fetchAssessment = async () => {
      try {
        setError(null);
        setResponses({}); // Clear old responses
        const data = await api.getAssessment(selectedJobId);
        if (data) {
          setAssessment(data);
        } else {
          // Create a new blank assessment for this job
          setAssessment({
            id: `a${Date.now()}`,
            jobId: selectedJobId,
            sections: [{ id: 's1', title: 'Default Section', questions: [] }]
          });
        }
      } catch (err) {
        setError('Failed to load assessment.');
      }
    };
    fetchAssessment();
  }, [api, selectedJobId]);

  // Callback for the builder to update the assessment state in real-time
  const handleBuilderUpdate = useCallback((updatedAssessment, showToast = true) => {
    setAssessment(updatedAssessment);
    if (showToast) {
      setToast({ type: 'success', message: 'Assessment updated!' });
    }
  }, []);
  
  const handleResponseChange = (questionId, value) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  };
  
  const handleSubmitPreview = async () => {
    // Basic validation
    for (const section of assessment.sections) {
      for (const q of section.questions) {
        if (q.required && !responses[q.id]) {
          setToast({ type: 'error', message: `Question "${q.text}" is required.` });
          return;
        }
      }
    }
    
    try {
      await api.submitAssessment(selectedJobId, responses);
      setToast({ type: 'success', message: 'Preview submitted successfully!' });
      setResponses({}); // Clear form
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to submit preview.' });
    }
  };

  if (api.loading && !assessment) return <p className="p-4">Loading...</p>;

  return (
    <div className="container mx-auto p-4 h-full">
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">Assessments</h1>
        <div className="w-72">
          <Label>Select Job to Edit Assessment</Label>
          <Select value={selectedJobId} onChange={(e) => setSelectedJobId(e.target.value)}>
            {jobs.map(job => <option key={job.id} value={job.id}>{job.title}</option>)}
          </Select>
        </div>
      </div>
      
      {error && <p className="text-red-600">Error: {error}</p>}
      
      {!assessment && !error && <p>Select a job to begin.</p>}
      
      {assessment && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[calc(100%-80px)]">
          {/* Builder */}
          <AssessmentBuilder assessment={assessment} onSave={handleBuilderUpdate} />
          
          {/* Live Preview */}
          <Card className="h-full overflow-y-auto">
            <CardHeader>
              <CardTitle>Live Preview</CardTitle>
              <CardDescription>This is what the candidate will see.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => e.preventDefault()}>
                {assessment.sections.map(section => (
                  <div key={section.id} className="mb-6">
                    <h2 className="text-xl font-semibold border-b pb-2 mb-4">{section.title}</h2>
                    {section.questions.map(q => (
                      <AssessmentPreviewQuestion 
                        key={q.id}
                        question={q}
                        responses={responses}
                        onResponseChange={handleResponseChange}
                        allResponses={responses}
                      />
                    ))}
                  </div>
                ))}
                <Button onClick={handleSubmitPreview} disabled={api.loading}>
                  {api.loading ? 'Submitting...' : 'Submit Preview'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}


// --- Main Layout & App Component ---
const routes = {
  '#/': JobsPage,
  '#/jobs': JobsPage,
  '#/jobs/:jobId': JobsPage, // (Simplified)
  '#/candidates': CandidatesPage,
  '#/candidates/:id': CandidatesPage, // Handled by CandidatesPage
  '#/assessments': AssessmentsPage,
};

// Remove ThemeContext, ThemeProvider, and theme toggle logic
// In Layout()
function Layout() {
  const { Component, params } = useHashRouter(routes);
  const path = window.location.hash || '#/';
  const getLinkClass = (href) => cn(
    'text-[#F9FAFB] hover:text-[#3B82F6] px-3 py-2 rounded-md text-sm font-medium',
    { 'bg-[#374151] text-[#3B82F6]': path.startsWith(href) }
  );
  return (
    <div className="min-h-screen flex flex-col h-screen bg-[#111827] text-[#F9FAFB]">
      <nav className="bg-[#1F2937] border-b border-[#374151] shadow-sm flex-shrink-0">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0 flex items-center">
              <img className='' src="/logoipsum-297.svg" alt="LOGO" />
            </div>
            <div className="flex space-x-4">
              <a href="#/jobs" className={getLinkClass('#/jobs')}>Jobs</a>
              <a href="#/candidates" className={getLinkClass('#/candidates')}>Candidates</a>
              <a href="#/assessments" className={getLinkClass('#/assessments')}>Assessments</a>
            </div>
          </div>
        </div>
      </nav>
      <main className="flex-grow bg-[#111827] overflow-auto">
        <Component {...params} />
      </main>
    </div>
  );
}
// In main App export, just return ApiContext.Provider/Layout combo:
export default function App() {
  const api = useMockApi();
  return (
      <ApiContext.Provider value={api}>
        <Layout />
      </ApiContext.Provider>
  );
}

