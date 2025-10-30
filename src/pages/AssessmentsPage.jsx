import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button, Card, CardHeader, CardTitle, CardDescription, CardContent,
  Input, Textarea, Select, Label, Switch, Checkbox, RadioGroup, RadioGroupItem, Toast
} from '@/src/components/ui.jsx';

async function fetchApi(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  if (res.status === 204) return;
  return res.json();
}

function AssessmentPreviewQuestion({ question, responses, onResponse, all }) {
  if (question.conditional) {
    const { questionId, value } = question.conditional;
    if ((all[questionId] ?? '') !== value) return null;
  }
  const { id, type, text, required, validation } = question;
  const value = responses[id] || (type === 'multi-choice' ? [] : '');
  const safeOptions = Array.isArray(question.options) ? question.options : [];

  const onChange = (e) => {
    const t = e.target;
    if (t.type === 'checkbox') {
      const next = t.checked ? [...(responses[id] || []), t.value] : (responses[id] || []).filter(v => v !== t.value);
      onResponse(id, next);
    } else {
      onResponse(id, t.value);
    }
  };

  return (
    <div className="mb-5 space-y-2">
      <Label htmlFor={id} className="text-base">{text} {required && <span className="text-red-500">*</span>}</Label>
      <div className="mt-1">
        {type === 'short-text' && <Input id={id} value={value} onChange={onChange} required={required} />}
        {type === 'long-text' && <Textarea id={id} value={value} onChange={onChange} required={required} maxLength={validation?.maxLength} />}
        {type === 'numeric' && <Input id={id} type="number" value={value} onChange={onChange} required={required} min={validation?.min} max={validation?.max} />}
        {type === 'single-choice' && (
          <RadioGroup name={id} value={value} onValueChange={(v) => onResponse(id, v)}>
            {safeOptions.map(opt => <RadioGroupItem key={opt} value={opt} id={`${id}-${opt}`} />)}
          </RadioGroup>
        )}
        {type === 'multi-choice' && (
          <div className="space-y-2">
            {safeOptions.map(opt => (
              <div key={opt} className="flex items-center space-x-2">
                <Checkbox id={`${id}-${opt}`} value={opt} checked={value.includes(opt)} onChange={onChange} />
                <Label htmlFor={`${id}-${opt}`}>{opt}</Label>
              </div>
            ))}
          </div>
        )}
        {type === 'file-upload' && <Input id={id} type="file" disabled />}
      </div>
    </div>
  );
}

function Builder({ model, onChange, onSave }) {
  const [data, setData] = useState(model);
  const [toast, setToast] = useState(null);
  useEffect(() => { onChange(data, false); }, [data, onChange]);

  // Use JSON deep clone for wide compatibility
  const update = (fn) => setData(prev => { const next = JSON.parse(JSON.stringify(prev || { sections: [] })); if (!Array.isArray(next.sections)) next.sections = []; fn(next); return next; });

  const addSection = () => update(n => { n.sections.push({ id: `s${Date.now()}`, title: 'New Section', questions: [] }); });
  const removeSection = (i) => update(n => { n.sections.splice(i,1); if (!Array.isArray(n.sections) || n.sections.length===0) n.sections = [{ id:'s1', title:'Default Section', questions:[] }]; });

  const addQuestion = (s) => update(n => { if (!Array.isArray(n.sections[s].questions)) n.sections[s].questions = []; n.sections[s].questions.push({ id:`q${Date.now()}`, text:'New Question', type:'short-text', required:false }); });
  const removeQuestion = (s,q) => update(n => { n.sections[s].questions.splice(q,1); });
  const move = (arr, from,to)=>{ if(!Array.isArray(arr)) return arr; if(to<0||to>=arr.length) return arr; const copy=[...arr]; const [it]=copy.splice(from,1); copy.splice(to,0,it); return copy; };
  const moveSection = (i,dir)=> update(n=>{ n.sections = move(n.sections,i,i+dir); });
  const moveQuestion = (s,q,dir)=> update(n=>{ n.sections[s].questions = move(n.sections[s].questions,q,q+dir); });

  const setQ = (s,q,key,val)=> update(n=>{ const ref=n.sections?.[s]?.questions?.[q]; if(!ref) return; ref[key]=val; if(key==='type'){ 
        if(['single-choice','multi-choice'].includes(val)){ if(!Array.isArray(ref.options)) ref.options=[]; } else { delete ref.options; delete ref.conditional; if(ref.validation){ delete ref.validation.min; delete ref.validation.max; } } }
        if(key==='options'){ ref.options = Array.isArray(val)?val:[]; } });
  const setValidation = (s,q,k,v)=> update(n=>{ const ref=n.sections?.[s]?.questions?.[q]; if(!ref) return; ref.validation={...(ref.validation||{}),[k]:v}; });
  const setConditional = (s,q,enabled,id,val)=> update(n=>{ const ref=n.sections?.[s]?.questions?.[q]; if(!ref) return; if(!enabled){ delete ref.conditional; } else { ref.conditional={ questionId:id||'', value:val||'' }; } });

  const save = async ()=>{ try{ await onSave(data); setToast({type:'success',message:'Assessment saved'});}catch{ setToast({type:'error',message:'Save failed'});} };

  const allQs = (data.sections||[]).flatMap(sec => (sec.questions||[]).map(q=>({id:q.id,text:q.text})));

  return (
    <Card className="h-full overflow-y-auto">
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={()=>setToast(null)} />}
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Assessment Builder</CardTitle>
          <div className="flex gap-2"><Button variant="secondary" onClick={addSection}>+ Section</Button><Button onClick={save}>Save</Button></div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {(data.sections||[]).map((sec, sIdx)=> (
          <div key={sec.id} className="p-5 border border-[#374151] rounded-lg space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 space-y-1">
                <Label htmlFor={`section-title-${sIdx}`}>Section Title</Label>
                <Input id={`section-title-${sIdx}`} value={sec.title} onChange={(e)=>update(n=>{n.sections[sIdx].title=e.target.value;})} />
              </div>
              <div className="flex gap-2"><Button variant="outline" onClick={()=>moveSection(sIdx,-1)}>Up</Button><Button variant="outline" onClick={()=>moveSection(sIdx,1)}>Down</Button><Button variant="outline" onClick={()=>removeSection(sIdx)}>Remove</Button></div>
            </div>
            {(sec.questions||[]).map((q, qIdx)=> (
              <div key={q.id} className="p-4 border border-[#374151] rounded-md space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1 space-y-1">
                    <Label htmlFor={`q-text-${sIdx}-${qIdx}`}>Question Text</Label>
                    <Input id={`q-text-${sIdx}-${qIdx}`} value={q.text} onChange={(e)=>setQ(sIdx,qIdx,'text',e.target.value)} />
                  </div>
                  <div className="flex items-center gap-2 pt-6"><Switch checked={!!q.required} onCheckedChange={(v)=>setQ(sIdx,qIdx,'required',v)} /><Label htmlFor={`q-required-${sIdx}-${qIdx}`}>Required</Label></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor={`q-type-${sIdx}-${qIdx}`}>Type</Label>
                    <Select id={`q-type-${sIdx}-${qIdx}`} value={q.type} onChange={(e)=>setQ(sIdx,qIdx,'type',e.target.value)}><option value="short-text">Short Text</option><option value="long-text">Long Text</option><option value="numeric">Numeric</option><option value="single-choice">Single-Choice</option><option value="multi-choice">Multi-Choice</option><option value="file-upload">File Upload (Stub)</option></Select>
                  </div>
                  {q.type==='numeric' && (<>
                    <div className="space-y-1">
                      <Label htmlFor={`q-min-${sIdx}-${qIdx}`}>Min</Label>
                      <Input id={`q-min-${sIdx}-${qIdx}`} type="number" value={q.validation?.min ?? ''} onChange={(e)=>setValidation(sIdx,qIdx,'min',e.target.value===''?undefined:Number(e.target.value))} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`q-max-${sIdx}-${qIdx}`}>Max</Label>
                      <Input id={`q-max-${sIdx}-${qIdx}`} type="number" value={q.validation?.max ?? ''} onChange={(e)=>setValidation(sIdx,qIdx,'max',e.target.value===''?undefined:Number(e.target.value))} />
                    </div>
                  </>)}
                  {q.type==='long-text' && (
                    <div className="space-y-1">
                      <Label htmlFor={`q-maxlen-${sIdx}-${qIdx}`}>Max Length</Label>
                      <Input id={`q-maxlen-${sIdx}-${qIdx}`} type="number" value={q.validation?.maxLength ?? ''} onChange={(e)=>setValidation(sIdx,qIdx,'maxLength',e.target.value===''?undefined:Number(e.target.value))} />
                    </div>
                  )}
                </div>
                {(q.type==='single-choice'||q.type==='multi-choice') && (
                  <div className="space-y-1">
                    <Label htmlFor={`q-options-${sIdx}-${qIdx}`}>Options (comma-separated)</Label>
                    <Input id={`q-options-${sIdx}-${qIdx}`} value={(q.options||[]).join(', ')} onChange={(e)=>setQ(sIdx,qIdx,'options',e.target.value.split(',').map(s=>s.trim()).filter(Boolean))} />
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor={`q-cond-dep-${sIdx}-${qIdx}`}>Conditional depends on</Label>
                    <Select id={`q-cond-dep-${sIdx}-${qIdx}`} value={q.conditional?.questionId||''} onChange={(e)=>setConditional(sIdx,qIdx,!!e.target.value,e.target.value,q.conditional?.value)}><option value="">None</option>{allQs.filter(x=>x.id!==q.id).map(x=> <option key={x.id} value={x.id}>{x.text?.slice(0,50) || x.id}</option>)}</Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`q-cond-val-${sIdx}-${qIdx}`}>Equals value</Label>
                    <Input id={`q-cond-val-${sIdx}-${qIdx}`} value={q.conditional?.value||''} onChange={(e)=>setConditional(sIdx,qIdx,true,q.conditional?.questionId,e.target.value)} />
                  </div>
                  <div className="flex items-end gap-2"><Button variant="outline" onClick={()=>moveQuestion(sIdx,qIdx,-1)}>Up</Button><Button variant="outline" onClick={()=>moveQuestion(sIdx,qIdx,1)}>Down</Button><Button variant="outline" onClick={()=>removeQuestion(sIdx,qIdx)}>Remove</Button></div>
                </div>
              </div>
            ))}
            <Button variant="secondary" size="sm" onClick={()=>addQuestion(sIdx)}>+ Add Question</Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function AssessmentsPage() {
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [assessment, setAssessment] = useState(null);
  const [responses, setResponses] = useState({});
  const [isFetching, setIsFetching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(()=>{ (async()=>{
    setIsFetching(true);
    try{ const all = await fetchApi('/api/jobs/all'); setJobs(all); if(all.length>0) setSelectedJobId(all[0].id);}catch{ setError('Failed to load jobs.'); }
    setIsFetching(false);
  })(); },[]);

  useEffect(()=>{ if(!selectedJobId) return; (async()=>{
    setIsFetching(true); setResponses({}); setError(null);
    try{ const data = await fetchApi(`/api/assessments/${selectedJobId}`); setAssessment(data || { id:`a${Date.now()}`, jobId:selectedJobId, sections:[{ id:'s1', title:'Default Section', questions:[] }] }); }
    catch{ setError('Failed to load assessment.'); }
    setIsFetching(false);
  })(); },[selectedJobId]);

  const handleBuilderChange = useCallback((updated, showToast=false)=>{ setAssessment(updated); if(showToast) setToast({type:'success',message:'Updated'}); },[]);
  const handleBuilderSave = useCallback(async(updated)=>{ await fetchApi(`/api/assessments/${updated.jobId}`,{ method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(updated)}); },[]);
  const onResponse = (id,val)=> setResponses(prev=>({ ...prev, [id]: val }));

  const submit = async()=>{
    // validate
    for(const sec of assessment.sections){
      for(const q of sec.questions){
        if(q.conditional){ const dep = responses[q.conditional.questionId]; if(dep!==q.conditional.value) continue; }
        const v = responses[q.id];
        if(q.required && (v===undefined||v===''||(Array.isArray(v)&&v.length===0))){ setToast({type:'error',message:`"${q.text}" is required.`}); return; }
        if(q.type==='numeric' && v!==undefined){ const num=Number(v); if(Number.isNaN(num)){ setToast({type:'error',message:`"${q.text}" must be a number.`}); return; } if(q.validation?.min!==undefined && num<q.validation.min){ setToast({type:'error',message:`"${q.text}" must be ≥ ${q.validation.min}.`}); return;} if(q.validation?.max!==undefined && num>q.validation.max){ setToast({type:'error',message:`"${q.text}" must be ≤ ${q.validation.max}.`}); return; } }
        if(q.type==='long-text' && typeof q.validation?.maxLength==='number' && typeof v==='string' && v.length>q.validation.maxLength){ setToast({type:'error',message:`"${q.text}" must be ≤ ${q.validation.maxLength} chars.`}); return; }
      }
    }
    setIsSubmitting(true);
    try{ await fetchApi(`/api/assessments/${selectedJobId}/submit`,{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(responses)}); setToast({type:'success',message:'Submitted!'}); setResponses({}); }catch{ setToast({type:'error',message:'Submit failed.'}); }
    setIsSubmitting(false);
  };

  return (
    <div className="container mx-auto p-4 h-full">
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={()=>setToast(null)} />}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Assessments</h1>
        <div className="w-72"><Label className="mb-1 block">Select Job to Edit Assessment</Label><Select value={selectedJobId} onChange={(e)=>setSelectedJobId(e.target.value)}>{(jobs||[]).map(j=> <option key={j.id} value={j.id}>{j.title}</option>)}</Select></div>
      </div>
      {error && <p className="text-red-600 mb-4">Error: {error}</p>}
      {assessment && Array.isArray(assessment.sections) && (
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 h-[calc(100%-80px)] transition-opacity duration-300 ${isFetching?'opacity-60 pointer-events-none':'opacity-100'}`}>
          <Builder model={assessment} onChange={handleBuilderChange} onSave={handleBuilderSave} />
          <Card className="h-full overflow-y-auto">
            <CardHeader><CardTitle>Live Preview</CardTitle><CardDescription>This is what the candidate will see.</CardDescription></CardHeader>
            <CardContent className="space-y-8">
              {(assessment.sections||[]).map(sec => (
                <div key={sec.id} className="mb-6">
                  <h2 className="text-xl font-semibold border-b border-[#374151] pb-2 mb-4">{sec.title}</h2>
                  {(sec.questions||[]).map(q => (
                    ['short-text','long-text','numeric','single-choice','multi-choice','file-upload'].includes(q.type)
                      ? <AssessmentPreviewQuestion key={q.id} question={q} responses={responses} onResponse={onResponse} all={responses} />
                      : null
                  ))}
                </div>
              ))}
              <div className="pt-2"><Button onClick={submit} disabled={isSubmitting}>{isSubmitting?'Submitting...':'Submit Preview'}</Button></div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}


