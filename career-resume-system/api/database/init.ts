import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbDir = path.resolve(__dirname, '../../data')
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

const dbPath = path.join(dbDir, 'career.db')

const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    username TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    avatar TEXT DEFAULT '',
    membership_type TEXT DEFAULT 'free',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS assessments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    status TEXT DEFAULT 'in_progress',
    answers TEXT DEFAULT '[]',
    result_data TEXT DEFAULT '{}',
    started_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS assessment_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assessment_id INTEGER NOT NULL,
    result_code TEXT NOT NULL,
    analysis TEXT DEFAULT '{}',
    recommendations TEXT DEFAULT '[]',
    skill_scores TEXT DEFAULT '{}',
    FOREIGN KEY (assessment_id) REFERENCES assessments(id)
  );

  CREATE TABLE IF NOT EXISTS resumes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    template_id INTEGER DEFAULT 1,
    title TEXT NOT NULL,
    status TEXT DEFAULT 'draft',
    completeness_score REAL DEFAULT 0,
    ai_optimized INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS resume_sections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resume_id INTEGER NOT NULL,
    section_type TEXT NOT NULL,
    section_order INTEGER DEFAULT 0,
    content TEXT DEFAULT '{}',
    ai_suggestions TEXT DEFAULT '{}',
    FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS resume_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    style TEXT DEFAULT '{}',
    thumbnail TEXT DEFAULT '',
    structure TEXT DEFAULT '{}'
  );

  CREATE TABLE IF NOT EXISTS chat_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    messages TEXT DEFAULT '[]',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`)

const templateCount = db.prepare('SELECT COUNT(*) as count FROM resume_templates').get() as { count: number }

if (templateCount.count === 0) {
  const insertTemplate = db.prepare(`
    INSERT INTO resume_templates (name, category, style, thumbnail, structure) VALUES (?, ?, ?, ?, ?)
  `)

  const templates = [
    [
      '现代简约',
      '通用',
      JSON.stringify({ fontFamily: 'Helvetica', primaryColor: '#2D3436', layout: 'single-column' }),
      '/templates/modern.png',
      JSON.stringify({ sections: ['personal', 'summary', 'experience', 'education', 'skills'] })
    ],
    [
      '经典商务',
      '商务',
      JSON.stringify({ fontFamily: 'Georgia', primaryColor: '#1B4F72', layout: 'two-column' }),
      '/templates/classic.png',
      JSON.stringify({ sections: ['personal', 'summary', 'experience', 'education', 'skills', 'certifications'] })
    ],
    [
      '创意设计',
      '创意',
      JSON.stringify({ fontFamily: 'Montserrat', primaryColor: '#E74C3C', layout: 'creative' }),
      '/templates/creative.png',
      JSON.stringify({ sections: ['personal', 'portfolio', 'experience', 'skills', 'education'] })
    ],
    [
      '科技极客',
      '科技',
      JSON.stringify({ fontFamily: 'Roboto Mono', primaryColor: '#00B894', layout: 'tech' }),
      '/templates/tech.png',
      JSON.stringify({ sections: ['personal', 'summary', 'projects', 'experience', 'skills', 'education'] })
    ],
    [
      '金融精英',
      '金融',
      JSON.stringify({ fontFamily: 'Times New Roman', primaryColor: '#2C3E50', layout: 'formal' }),
      '/templates/finance.png',
      JSON.stringify({ sections: ['personal', 'summary', 'experience', 'education', 'certifications', 'skills'] })
    ],
    [
      '学术研究',
      '学术',
      JSON.stringify({ fontFamily: 'Computer Modern', primaryColor: '#34495E', layout: 'academic' }),
      '/templates/academic.png',
      JSON.stringify({ sections: ['personal', 'research', 'publications', 'education', 'awards', 'skills'] })
    ]
  ]

  const insertMany = db.transaction((items: any[][]) => {
    for (const item of items) {
      insertTemplate.run(...item)
    }
  })

  insertMany(templates)
}

export default db
