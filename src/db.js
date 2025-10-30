import Dexie from 'dexie';

// --- SEED DATA (from original file) ---
const SEED_JOBS = [
  { id: 'j1', title: 'Senior Frontend Engineer', slug: 'senior-frontend-engineer', status: 'active', tags: ['React', 'TypeScript'], order: 1 },
  { id: 'j2', title: 'Product Manager', slug: 'product-manager', status: 'active', tags: ['Agile', 'Strategy'], order: 2 },
  { id: 'j3', title: 'UX/UI Designer', slug: 'ux-ui-designer', status: 'archived', tags: ['Figma', 'Research'], order: 3 },
  { id: 'j4', title: 'Full-Stack Developer', slug: 'full-stack-developer', status: 'active', tags: ['React', 'Node.js'], order: 4 },
  { id: 'j5', title: 'DevOps Engineer', slug: 'devops-engineer', status: 'active', tags: ['AWS', 'Kubernetes'], order: 5 },
  { id: 'j6', title: 'Data Scientist', slug: 'data-scientist', status: 'active', tags: ['Python', 'ML'], order: 6 },
  { id: 'j7', title: 'Junior Backend Engineer', slug: 'junior-backend-engineer', status: 'archived', tags: ['Node.js', 'PostgreSQL'], order: 7 },
  { id: 'j8', title: 'Marketing Lead', slug: 'marketing-lead', status: 'active', tags: ['SEO', 'Content'], order: 8 },
  { id: 'j9', title: 'Head of People', slug: 'head-of-people', status: 'active', tags: ['HR', 'Culture'], order: 9 },
  { id: 'j10', title: 'Customer Support Rep', slug: 'customer-support-rep', status: 'active', tags: ['Zendesk', 'Comms'], order: 10 },
];

const CANDIDATE_STAGES = ["applied", "screen", "tech", "offer", "hired", "rejected"];
const FIRST_NAMES = ['Aisha', 'Bob', 'Charlie', 'David', 'Eva', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack', 'Ken', 'Liam', 'Mia', 'Nora', 'Oscar', 'Pria'];
const LAST_NAMES = ['Smith', 'Johnson', 'Brown', 'Lee', 'Wilson', 'Patel', 'Kim', 'Garcia', 'Davis', 'Miller', 'Chen', 'Wang', 'Ali', 'Khan'];

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
  'c3': [{ id: 't4', date: '2023-10-01', stage: 'applied', details: 'Full-Stack Developer' }, { id: 't5', date: '2023-10-04', stage: 'screen', details: 'Completed initial HR screening' }, { id: 't6', date: '2023-10-07', stage: 'tech', details: 'Passed technical interview' }],
};

const SEED_ASSESSMENTS = {
  'j1': {
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
  'j2': {
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
// --- END SEED DATA ---

export const db = new Dexie('TalentFlowDB');

// Define database schema
db.version(1).stores({
  jobs: 'id, title, status, order', // Indexed properties
  candidates: 'id, name, email, stage, jobId',
  timelines: 'id, candidateId, date', // We'll store timelines as {id, candidateId, entries: [...]}
  assessments: 'jobId', // Keyed by jobId
  assessmentResponses: 'id++, jobId, submissionId', // Auto-incrementing primary key
});

// Function to populate the database
export async function initDB() {
  const jobCount = await db.jobs.count();
  if (jobCount === 0) {
    console.log('Database is empty, seeding...');
    
    // Seed Jobs
    await db.jobs.bulkPut(SEED_JOBS);
    
    // Seed Candidates
    const seedCandidates = generateSeedCandidates(1000);
    await db.candidates.bulkPut(seedCandidates);
    
    // Seed Timelines
    const timelineEntries = Object.entries(SEED_TIMELINES).map(([candidateId, entries]) => ({
      id: `tl_${candidateId}`,
      candidateId,
      entries
    }));
    await db.timelines.bulkPut(timelineEntries);
    
    // Seed Assessments
    const assessmentEntries = Object.values(SEED_ASSESSMENTS);
    await db.assessments.bulkPut(assessmentEntries);
    
    console.log('Database seeded successfully!');
  } else {
    console.log('Database already populated.');
  }
}
