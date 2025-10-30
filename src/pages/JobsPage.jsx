import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Button, Card, CardHeader, CardTitle, CardContent, CardFooter,
  Input, Select, Dialog, DialogTitle, DialogFooter, Label, Badge, Toast, cn
} from '@/components/ui.jsx';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';

// --- API Helper ---
async function fetchApi(url, options = {}) {
  await new Promise(res => setTimeout(res, 500 + Math.random() * 800));
  options.headers = { ...options.headers, 'Content-Type': 'application/json' };
  const response = await fetch(url, options);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'An API error occurred');
  }
  return response.json();
}

// --- Components ---

function EditJobDialog({ job, isOpen, onClose, onSave, onError }) {
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(job || { title: '', slug: '', status: 'active', tags: '' });
    }
  }, [job, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (!formData.title) throw new Error("Title is required.");
      const slug = formData.slug || formData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const jobData = {
        ...formData,
        slug,
        tags: Array.isArray(formData.tags) ? formData.tags : formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        order: job ? job.order : 0
      };
      await onSave(jobData);
    } catch (error) {
      onError({ title: "Validation Error", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="z-50 w-full max-w-lg p-6 bg-[#1F2937] text-[#F9FAFB] border border-[#374151] rounded-lg transition-colors duration-300">
          <DialogTitle className="text-[#F9FAFB]">{job ? 'Edit Job' : 'Create New Job'}</DialogTitle>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <Label htmlFor="title" className="text-[#F9FAFB]">Job Title</Label>
              <Input id="title" name="title" value={formData.title || ''} onChange={handleChange} placeholder="e.g., Senior React Developer" disabled={isLoading} />
            </div>
            <div>
              <Label htmlFor="slug" className="text-[#F9FAFB]">URL Slug (auto-generates if blank)</Label>
              <Input id="slug" name="slug" value={formData.slug || ''} onChange={handleChange} placeholder="e.g., senior-react-developer" disabled={isLoading} />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="status" className="text-[#F9FAFB]">Status</Label>
                <Select id="status" name="status" value={formData.status || 'active'} onValueChange={(value) => handleSelectChange('status', value)} disabled={isLoading}>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </Select>
              </div>
              <div className="flex-1">
                <Label htmlFor="tags" className="text-[#F9FAFB]">Tags (comma-separated)</Label>
                <Input id="tags" name="tags" value={Array.isArray(formData.tags) ? formData.tags.join(', ') : (formData.tags || '')} onChange={handleChange} placeholder="e.g., react, remote, senior" disabled={isLoading} />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="submit" disabled={isLoading}>{isLoading ? 'Saving...' : 'Save Job'}</Button>
            </DialogFooter>
          </form>
        </div>
      </div>
    </Dialog>
  );
}

function JobCard({ job, onEdit, onArchive }) { // Added onArchive prop
  return (
    <Card className="shadow-none transition-colors duration-200 bg-[#1F2937] border-[#374151] text-[#F9FAFB]">
      <CardHeader className="flex-row items-center justify-between bg-[#1F2937] border-b border-[#374151]">
        <CardTitle className="text-lg text-[#F9FAFB]">{job.title}</CardTitle>
        <Badge variant={job.status === 'active' ? 'default' : 'secondary'}>{job.status}</Badge>
      </CardHeader>
      <CardContent className="space-x-2 bg-[#1F2937]">
        {job.tags.map(tag => (
          <Badge key={tag} variant="outline">{tag}</Badge>
        ))}
      </CardContent>
      <CardFooter className="justify-end gap-2 bg-[#1F2937]"> {/* Styling for button alignment */}
        <Button variant="outline" onClick={() => onEdit(job)}>
          Edit
        </Button>
        <Button variant={job.status === 'active' ? 'destructive' : 'secondary'} onClick={() => onArchive(job)}>
          {job.status === 'active' ? 'Archive' : 'Unarchive'}
        </Button>
      </CardFooter>
    </Card>
  );
}

// --- Main Page Component ---

export function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  
  const [editingJob, setEditingJob] = useState(null);
  
  const [searchParams, setSearchParams] = useState({ search: '', status: 'active', page: 1, pageSize: 10 });
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });

  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.search);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchParams(prev => ({ ...prev, search: debouncedSearch, page: 1 }));
    }, 500);
    return () => clearTimeout(handler);
  }, [debouncedSearch]);

  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { search, status, page, pageSize } = searchParams;
      const query = new URLSearchParams({ search, status, page, pageSize }).toString();
      const data = await fetchApi(`/api/jobs?${query}`);
      setJobs(data.jobs);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
      setToast({ variant: "destructive", title: "Fetch Error", description: err.message });
    } finally {
      setIsLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);
  
  const handleFilterChange = (name, value) => {
    setSearchParams(prev => ({ ...prev, [name]: value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setSearchParams(prev => ({ ...prev, page: newPage }));
  };

  const handleSaveJob = useCallback(async (jobData) => {
    const prevJobs = [...jobs];
    const currentStatusFilter = searchParams.status;
    if (jobData.id) {
      if (jobData.status !== currentStatusFilter && currentStatusFilter !== 'all' && currentStatusFilter !== '') {
        setJobs(prev => prev.filter(j => j.id !== jobData.id));
      } else {
        setJobs(prev => prev.map(j => j.id === jobData.id ? { ...j, ...jobData } : j));
      }
    }
    try {
      const url = jobData.id ? `/api/jobs/${jobData.id}` : '/api/jobs';
      const method = jobData.id ? 'PATCH' : 'POST';
      await fetchApi(url, { method, body: JSON.stringify(jobData) });
      setToast({ title: "Success", description: `Job ${jobData.id ? 'updated' : 'created'}.` });
      fetchJobs(); 
    } catch (error) {
      setToast({ variant: "destructive", title: "Error", description: error.message });
      setJobs(prevJobs);
    } finally {
      setEditingJob(null);
    }
  }, [jobs, fetchJobs, searchParams]);

  const handleArchiveToggle = (job) => {
    const updatedJob = { 
      ...job, 
      status: job.status === 'active' ? 'archived' : 'active' 
    };
    handleSaveJob(updatedJob);
  };

  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = jobs.findIndex(j => j.id === active.id);
    const newIndex = jobs.findIndex(j => j.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const prevJobs = [...jobs];
    // optimistic reorder by order field
    const moved = jobs[oldIndex];
    const newOrder = jobs[newIndex].order;
    const oldOrder = moved.order;
    const reordered = jobs.map(j => ({ ...j }));
    // shift orders locally
    reordered.forEach(j => {
      if (oldOrder < newOrder) {
        if (j.order > oldOrder && j.order <= newOrder) j.order -= 1;
      } else {
        if (j.order < oldOrder && j.order >= newOrder) j.order += 1;
      }
    });
    reordered[oldIndex].order = newOrder;
    reordered.sort((a,b)=>a.order-b.order);
    setJobs(reordered);
    try {
      await fetchApi(`/api/jobs/${active.id}/reorder`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fromOrder: oldOrder, toOrder: newOrder }) });
    } catch (e) {
      // rollback
      setJobs(prevJobs);
    }
  };

  return (
    <main className="flex-1 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Jobs Board</h1>
        <Button variant="default" onClick={() => setEditingJob({})}>Create New Job</Button>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <Input placeholder="Search by title..." value={debouncedSearch} onChange={(e) => setDebouncedSearch(e.target.value)} className="max-w-xs" />
        <Select value={searchParams.status} onValueChange={(value) => handleFilterChange('status', value)}>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
          <option value="all">All Statuses</option>
        </Select>
      </div>

      {isLoading && <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" aria-label="Loading jobs skeleton"></div>}
      {error && !isLoading && <p className="text-red-500">{error}</p>}
      {!isLoading && !error && (
        <>
          <DndContext collisionDetection={closestCenter} sensors={sensors} onDragEnd={handleDragEnd}>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {jobs.map(job => (
                <div key={job.id} id={job.id} draggable>
                  <JobCard
                    job={job}
                    onEdit={setEditingJob}
                    onArchive={handleArchiveToggle}
                  />
                </div>
              ))}
            </div>
          </DndContext>
          {jobs.length === 0 && (<p>No jobs found matching your criteria.</p>)}

          <div className="flex items-center justify-end gap-2 mt-6">
            <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page <= 1}>Previous</Button>
            <span>Page {pagination.page} of {Math.ceil(pagination.total / pagination.pageSize)}</span>
            <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page * pagination.pageSize >= pagination.total}>Next</Button>
          </div>
        </>
      )}

      <EditJobDialog isOpen={!!editingJob} job={editingJob} onClose={() => setEditingJob(null)} onSave={handleSaveJob} onError={setToast} />
      
      {toast && (<Toast variant={toast.variant} title={toast.title} description={toast.description} onOpenChange={() => setToast(null)} />)}
    </main>
  );
}