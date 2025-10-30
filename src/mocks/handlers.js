import { http, HttpResponse } from 'msw';
import { db, initDB } from '../db.js';

const delay = (ms) => new Promise(r => setTimeout(r, ms));
const randomDelay = () => Math.floor(Math.random() * 1000) + 200;
const writeErrorRate = 0.1;

// Initialize Dexie database (no top-level await for Vite)
initDB();

// Helpers
async function getJobsFiltered({ search = '', status = 'all', page = 1, pageSize = 10, sort = 'order' }) {
  let jobs = await db.jobs.toArray();
  if (status !== 'all') jobs = jobs.filter(j => j.status === status);
  if (search) jobs = jobs.filter(j => j.title.toLowerCase().includes(search.toLowerCase()));
  jobs.sort((a, b) => (a[sort] ?? 0) - (b[sort] ?? 0));
  const total = jobs.length;
  const data = jobs.slice((page - 1) * pageSize, page * pageSize);
  return { data, total, page, pageSize };
}

export const handlers = [
  http.get('/', () => HttpResponse.text('OK')),

  // Jobs
  http.get('/api/jobs', async ({ request }) => {
    await delay(randomDelay());
    const url = new URL(request.url);
    const resp = await getJobsFiltered({
      search: url.searchParams.get('search') || '',
      status: url.searchParams.get('status') || 'all',
      page: parseInt(url.searchParams.get('page') || '1', 10),
      pageSize: parseInt(url.searchParams.get('pageSize') || '10', 10),
      sort: url.searchParams.get('sort') || 'order',
    });
    return HttpResponse.json(resp);
  }),

  http.get('/api/jobs/all', async () => {
    await delay(randomDelay() / 2);
    const allJobs = await db.jobs.toArray();
    return HttpResponse.json(allJobs);
  }),

  http.post('/api/jobs', async ({ request }) => {
    await delay(randomDelay());
    if (Math.random() < writeErrorRate) return new HttpResponse('Server Error', { status: 500 });
    const jobData = await request.json();
    const all = await db.jobs.toArray();
    const newJob = { ...jobData, id: `j${Date.now()}`, slug: jobData.title.toLowerCase().replace(/\s+/g, '-'), order: all.length + 1, status: 'active', tags: (jobData.tags || '').split(',').map(t=>t.trim()).filter(Boolean) };
    await db.jobs.put(newJob);
    return HttpResponse.json(newJob, { status: 201 });
  }),

  http.patch('/api/jobs/:id', async ({ params, request }) => {
    await delay(randomDelay());
    if (Math.random() < writeErrorRate) return new HttpResponse('Server Error', { status: 500 });
    const id = params.id;
    const patch = await request.json();
    const job = await db.jobs.get(id);
    if (!job) return new HttpResponse('Not Found', { status: 404 });
    const updated = { ...job, ...patch };
    if (typeof patch.tags === 'string') updated.tags = patch.tags.split(',').map(t=>t.trim()).filter(Boolean);
    await db.jobs.put(updated);
    return HttpResponse.json(updated);
  }),

  http.patch('/api/jobs/:id/reorder', async ({ params, request }) => {
    await delay(randomDelay());
    if (Math.random() < 0.1) return new HttpResponse('Reorder Failed', { status: 500 });
    const id = params.id;
    const { fromOrder, toOrder } = await request.json();
    const jobs = await db.jobs.toArray();
    const moved = jobs.find(j => j.id === id);
    if (!moved) return new HttpResponse('Not Found', { status: 404 });
    jobs.forEach(j => {
      if (fromOrder < toOrder) {
        if (j.order > fromOrder && j.order <= toOrder) j.order -= 1;
      } else if (fromOrder > toOrder) {
        if (j.order < fromOrder && j.order >= toOrder) j.order += 1;
      }
    });
    moved.order = toOrder;
    await db.jobs.bulkPut(jobs);
    return HttpResponse.json({ ok: true });
  }),

  // Candidates
  http.get('/api/candidates', async ({ request }) => {
    await delay(randomDelay());
    const url = new URL(request.url);
    const search = (url.searchParams.get('search') || '').toLowerCase();
    const stage = url.searchParams.get('stage') || 'all';
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20', 10);
    let list = await db.candidates.toArray();
    if (search) list = list.filter(c => c.name.toLowerCase().includes(search) || c.email.toLowerCase().includes(search));
    if (stage !== 'all') list = list.filter(c => c.stage === stage);
    const total = list.length;
    const data = list.slice((page - 1) * pageSize, page * pageSize);
    return HttpResponse.json({ data, total });
  }),

  http.get('/api/candidates/all', async ({ request }) => {
    await delay(randomDelay());
    const url = new URL(request.url);
    const search = (url.searchParams.get('search') || '').toLowerCase();
    let list = await db.candidates.toArray();
    if (search) list = list.filter(c => c.name.toLowerCase().includes(search) || c.email.toLowerCase().includes(search));
    return HttpResponse.json({ data: list });
  }),

  http.get('/api/candidates/:id', async ({ params }) => {
    await delay(randomDelay()/2);
    const c = await db.candidates.get(params.id);
    if (!c) return new HttpResponse('Not Found', { status: 404 });
    return HttpResponse.json(c);
  }),

  http.get('/api/candidates/:id/timeline', async ({ params }) => {
    await delay(randomDelay()/2);
    const tl = await db.timelines.get(`tl_${params.id}`);
    return HttpResponse.json(tl?.entries || []);
  }),

  http.patch('/api/candidates/:id', async ({ params, request }) => {
    await delay(randomDelay());
    if (Math.random() < writeErrorRate) return new HttpResponse('Server Error', { status: 500 });
    const id = params.id;
    const patch = await request.json();
    const cand = await db.candidates.get(id);
    if (!cand) return new HttpResponse('Not Found', { status: 404 });
    const updated = { ...cand, ...patch };
    await db.candidates.put(updated);
    // append timeline entry
    if (patch.stage) {
      const tl = (await db.timelines.get(`tl_${id}`)) || { id: `tl_${id}`, candidateId: id, entries: [] };
      tl.entries = [...(tl.entries || []), { id: `t_${Date.now()}`, date: new Date().toISOString().split('T')[0], stage: patch.stage, details: `Moved to ${patch.stage}` }];
      await db.timelines.put(tl);
    }
    return HttpResponse.json(updated);
  }),

  // Assessments
  http.get('/api/assessments/:jobId', async ({ params }) => {
    await delay(randomDelay()/2);
    const a = await db.assessments.get(params.jobId);
    return HttpResponse.json(a || null);
  }),

  http.put('/api/assessments/:jobId', async ({ params, request }) => {
    await delay(randomDelay());
    if (Math.random() < writeErrorRate) return new HttpResponse('Server Error', { status: 500 });
    const body = await request.json();
    const record = { ...body, jobId: params.jobId };
    await db.assessments.put(record);
    return HttpResponse.json(record);
  }),

  http.post('/api/assessments/:jobId/submit', async ({ params, request }) => {
    await delay(randomDelay());
    const responses = await request.json();
    const entry = { id: undefined, jobId: params.jobId, submissionId: `sub_${Date.now()}`, responses };
    await db.assessmentResponses.add(entry);
    return HttpResponse.json({ submissionId: entry.submissionId }, { status: 201 });
  }),
];
