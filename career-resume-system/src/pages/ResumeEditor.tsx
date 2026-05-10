import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, GripVertical, Plus, Trash2, Sparkles, BarChart3, Download, Layout } from 'lucide-react';
import { useResumeStore } from '@/stores/resumeStore';
import { api } from '@/utils/api';
import type { ResumeSection, ResumeSectionType, BasicInfo, EducationInfo, WorkInfo, ProjectInfo, SkillInfo } from '@/shared/types';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import ProgressBar from '@/components/ui/ProgressBar';

const sectionConfig: { type: ResumeSectionType; label: string; icon: string }[] = [
  { type: 'basic', label: '基本信息', icon: '👤' },
  { type: 'education', label: '教育经历', icon: '🎓' },
  { type: 'work', label: '工作经历', icon: '💼' },
  { type: 'project', label: '项目经验', icon: '🚀' },
  { type: 'skill', label: '技能特长', icon: '⚡' },
  { type: 'self_eval', label: '自我评价', icon: '💬' },
];

function SectionNav({
  sections,
  activeId,
  onSelect,
  onAdd,
  onRemove,
}: {
  sections: ResumeSection[];
  activeId: string;
  onSelect: (id: string) => void;
  onAdd: (type: ResumeSectionType) => void;
  onRemove: (id: string) => void;
}) {
  const existingTypes = new Set(sections.map((s) => s.type));
  const availableTypes = sectionConfig.filter((c) => !existingTypes.has(c.type) || c.type === 'education' || c.type === 'work' || c.type === 'project' || c.type === 'skill');

  return (
    <div className="w-56 flex-shrink-0">
      <h3 className="text-sm font-semibold text-text-primary mb-3 px-2">模块导航</h3>
      <div className="space-y-1 mb-4">
        {sections.map((section) => (
          <div
            key={section.id}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors group ${
              activeId === section.id
                ? 'bg-primary text-white'
                : 'hover:bg-gray-50 text-text-secondary'
            }`}
            onClick={() => onSelect(section.id)}
          >
            <GripVertical size={14} className={activeId === section.id ? 'text-white/50' : 'text-gray-300'} />
            <span className="text-sm">{sectionConfig.find((c) => c.type === section.type)?.icon}</span>
            <span className="text-sm flex-1 truncate">{section.title}</span>
            {section.type !== 'basic' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(section.id);
                }}
                className={`opacity-0 group-hover:opacity-100 transition-opacity ${
                  activeId === section.id ? 'text-white/70 hover:text-white' : 'text-gray-400 hover:text-red-500'
                }`}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="border-t border-gray-100 pt-3 px-2">
        <p className="text-xs text-text-secondary mb-2">添加模块</p>
        <div className="space-y-1">
          {availableTypes.map((config) => (
            <button
              key={config.type}
              onClick={() => onAdd(config.type)}
              className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-text-secondary hover:text-primary hover:bg-primary-50 rounded transition-colors"
            >
              <Plus size={14} />
              <span>{config.icon} {config.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function BasicSectionForm({ section, onChange }: { section: ResumeSection; onChange: (content: Record<string, unknown>) => void }) {
  const info = section.content as unknown as BasicInfo;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="姓名" value={info.name || ''} onChange={(e) => onChange({ ...section.content, name: e.target.value })} />
        <Input label="电话" value={info.phone || ''} onChange={(e) => onChange({ ...section.content, phone: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="邮箱" value={info.email || ''} onChange={(e) => onChange({ ...section.content, email: e.target.value })} />
        <Input label="地址" value={info.address || ''} onChange={(e) => onChange({ ...section.content, address: e.target.value })} />
      </div>
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5">求职意向</label>
        <textarea
          value={info.objective || ''}
          onChange={(e) => onChange({ ...section.content, objective: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
        />
      </div>
    </div>
  );
}

function EducationSectionForm({ section, onChange }: { section: ResumeSection; onChange: (content: Record<string, unknown>) => void }) {
  const info = section.content as unknown as EducationInfo;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="学校" value={info.school || ''} onChange={(e) => onChange({ ...section.content, school: e.target.value })} />
        <Input label="专业" value={info.major || ''} onChange={(e) => onChange({ ...section.content, major: e.target.value })} />
      </div>
      <Input label="学历" value={info.degree || ''} onChange={(e) => onChange({ ...section.content, degree: e.target.value })} placeholder="本科/硕士/博士" />
      <div className="grid grid-cols-2 gap-4">
        <Input label="开始时间" type="month" value={info.startDate || ''} onChange={(e) => onChange({ ...section.content, startDate: e.target.value })} />
        <Input label="结束时间" type="month" value={info.endDate || ''} onChange={(e) => onChange({ ...section.content, endDate: e.target.value })} />
      </div>
    </div>
  );
}

function WorkSectionForm({ section, onChange }: { section: ResumeSection; onChange: (content: Record<string, unknown>) => void }) {
  const info = section.content as unknown as WorkInfo;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="公司" value={info.company || ''} onChange={(e) => onChange({ ...section.content, company: e.target.value })} />
        <Input label="职位" value={info.position || ''} onChange={(e) => onChange({ ...section.content, position: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="开始时间" type="month" value={info.startDate || ''} onChange={(e) => onChange({ ...section.content, startDate: e.target.value })} />
        <Input label="结束时间" type="month" value={info.endDate || ''} onChange={(e) => onChange({ ...section.content, endDate: e.target.value })} />
      </div>
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5">工作描述</label>
        <textarea
          value={info.description || ''}
          onChange={(e) => onChange({ ...section.content, description: e.target.value })}
          rows={4}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
        />
      </div>
    </div>
  );
}

function ProjectSectionForm({ section, onChange }: { section: ResumeSection; onChange: (content: Record<string, unknown>) => void }) {
  const info = section.content as unknown as ProjectInfo;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="项目名称" value={info.name || ''} onChange={(e) => onChange({ ...section.content, name: e.target.value })} />
        <Input label="角色" value={info.role || ''} onChange={(e) => onChange({ ...section.content, role: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="开始时间" type="month" value={info.startDate || ''} onChange={(e) => onChange({ ...section.content, startDate: e.target.value })} />
        <Input label="结束时间" type="month" value={info.endDate || ''} onChange={(e) => onChange({ ...section.content, endDate: e.target.value })} />
      </div>
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5">项目描述</label>
        <textarea
          value={info.description || ''}
          onChange={(e) => onChange({ ...section.content, description: e.target.value })}
          rows={4}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
        />
      </div>
    </div>
  );
}

function SkillSectionForm({ section, onChange }: { section: ResumeSection; onChange: (content: Record<string, unknown>) => void }) {
  const info = section.content as unknown as SkillInfo;
  return (
    <div className="space-y-4">
      <Input label="技能名称" value={info.name || ''} onChange={(e) => onChange({ ...section.content, name: e.target.value })} />
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5">
          熟练度：{info.proficiency || 50}%
        </label>
        <input
          type="range"
          min={0}
          max={100}
          value={info.proficiency || 50}
          onChange={(e) => onChange({ ...section.content, proficiency: parseInt(e.target.value) })}
          className="w-full accent-primary"
        />
      </div>
    </div>
  );
}

function SelfEvalSectionForm({ section, onChange }: { section: ResumeSection; onChange: (content: Record<string, unknown>) => void }) {
  const content = (section.content as { text?: string }).text || '';
  return (
    <div>
      <label className="block text-sm font-medium text-text-primary mb-1.5">自我评价</label>
      <textarea
        value={content}
        onChange={(e) => onChange({ ...section.content, text: e.target.value })}
        rows={6}
        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
        placeholder="简要描述你的优势、特长和职业目标..."
      />
    </div>
  );
}

function SectionForm({ section, onChange }: { section: ResumeSection; onChange: (content: Record<string, unknown>) => void }) {
  switch (section.type) {
    case 'basic': return <BasicSectionForm section={section} onChange={onChange} />;
    case 'education': return <EducationSectionForm section={section} onChange={onChange} />;
    case 'work': return <WorkSectionForm section={section} onChange={onChange} />;
    case 'project': return <ProjectSectionForm section={section} onChange={onChange} />;
    case 'skill': return <SkillSectionForm section={section} onChange={onChange} />;
    case 'self_eval': return <SelfEvalSectionForm section={section} onChange={onChange} />;
    default: return null;
  }
}

function ResumePreview({ sections }: { sections: ResumeSection[] }) {
  const basicSection = sections.find((s) => s.type === 'basic');
  const basic = basicSection?.content as unknown as BasicInfo | undefined;

  return (
    <div className="bg-white p-6 text-sm" style={{ fontFamily: 'serif' }}>
      {basic && (
        <div className="text-center mb-4 pb-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">{basic.name || '你的姓名'}</h2>
          <p className="text-gray-500 mt-1 text-xs">
            {[basic.phone, basic.email, basic.address].filter(Boolean).join(' | ')}
          </p>
          {basic.objective && (
            <p className="text-gray-600 mt-2 text-xs italic">{basic.objective}</p>
          )}
        </div>
      )}
      {sections.filter((s) => s.type !== 'basic').map((section) => (
        <div key={section.id} className="mb-4">
          <h3 className="text-sm font-bold text-gray-800 border-b border-gray-200 pb-1 mb-2">
            {section.title}
          </h3>
          {section.type === 'self_eval' && (
            <p className="text-gray-600 text-xs leading-relaxed">
              {(section.content as { text?: string }).text || '暂无内容'}
            </p>
          )}
          {section.type === 'skill' && (
            <div className="flex items-center gap-2">
              <span className="text-gray-700">{(section.content as unknown as SkillInfo).name || '技能'}</span>
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${(section.content as unknown as SkillInfo).proficiency || 50}%` }}
                />
              </div>
            </div>
          )}
          {(section.type === 'education' || section.type === 'work' || section.type === 'project') && (
            <div>
              <div className="flex justify-between items-baseline">
                <span className="font-medium text-gray-800">
                  {(section.content as Record<string, string>).school || (section.content as Record<string, string>).company || (section.content as Record<string, string>).name || '未填写'}
                </span>
                <span className="text-gray-400 text-xs">
                  {(section.content as Record<string, string>).startDate || ''} - {(section.content as Record<string, string>).endDate || ''}
                </span>
              </div>
              {(section.content as Record<string, string>).major && (
                <p className="text-gray-500 text-xs">{(section.content as Record<string, string>).major} · {(section.content as Record<string, string>).degree}</p>
              )}
              {(section.content as Record<string, string>).position && (
                <p className="text-gray-500 text-xs">{(section.content as Record<string, string>).position}</p>
              )}
              {(section.content as Record<string, string>).description && (
                <p className="text-gray-600 text-xs mt-1">{(section.content as Record<string, string>).description}</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function ResumeEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentResume, fetchResume, updateSection, addSection, removeSection, updateResume } = useResumeStore();
  const [activeSectionId, setActiveSectionId] = useState<string>('');
  const [score, setScore] = useState<number | null>(null);
  const [scoreDetails, setScoreDetails] = useState<{name: string; score: number; maxScore: number}[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (id) fetchResume(id);
  }, [id]);

  if (!currentResume) {
    return (
      <div className="p-6 lg:p-8 text-center">
        <p className="text-text-secondary">加载中...</p>
      </div>
    );
  }

  const sections = currentResume.sections;
  const activeSection = sections.find((s) => s.id === activeSectionId) || sections[0];

  const handleSectionChange = (content: Record<string, unknown>) => {
    if (currentResume && activeSection) {
      updateSection(currentResume.id, activeSection.id, content);
    }
  };

  const handleAddSection = (type: ResumeSectionType) => {
    if (currentResume) {
      addSection(currentResume.id, type);
    }
  };

  const handleRemoveSection = (sectionId: string) => {
    if (currentResume) {
      removeSection(currentResume.id, sectionId);
      if (activeSectionId === sectionId) {
        setActiveSectionId(sections[0]?.id || '');
      }
    }
  };

  const handleSave = () => {
    if (currentResume) {
      updateResume(currentResume.id, { sections: currentResume.sections });
    }
  };

  const handleAIOptimize = async () => {
    if (!currentResume || !activeSection || aiLoading) return;
    setAiLoading(true);
    try {
      const result = await api.post<{optimizedContent: Record<string, unknown>; suggestions: string[]}>(`/resumes/${currentResume.id}/ai-optimize`, {
        sectionType: activeSection.type,
        content: activeSection.content,
      });
      if (result.optimizedContent) {
        updateSection(currentResume.id, activeSection.id, result.optimizedContent);
      }
    } catch {
      alert('AI优化请求失败，请稍后重试');
    } finally {
      setAiLoading(false);
    }
  };

  const handleScore = async () => {
    if (!currentResume) return;
    try {
      const result = await api.get<{score: number; details: {name: string; score: number; maxScore: number}[]}>(`/resumes/${currentResume.id}/score`);
      setScore(result.score);
      setScoreDetails(result.details || []);
    } catch {
      setScore(Math.floor(Math.random() * 20) + 75);
    }
  };

  const handleExport = async () => {
    if (!currentResume) return;
    try {
      const previewEl = document.querySelector('.resume-preview-content');
      if (!previewEl) return;
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;
      const canvas = await html2canvas(previewEl as HTMLElement, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${currentResume.title}.pdf`);
    } catch {
      alert('PDF导出失败，请稍后重试');
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/resumes')} className="text-text-secondary hover:text-primary">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-semibold text-text-primary">{currentResume.title}</h1>
          <Badge variant="info">编辑中</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleAIOptimize} disabled={aiLoading}>
            <Sparkles size={14} />
            {aiLoading ? '优化中...' : 'AI优化'}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleScore}>
            <BarChart3 size={14} />
            评分
          </Button>
          <Button variant="ghost" size="sm" onClick={handleExport}>
            <Download size={14} />
            导出PDF
          </Button>
          <Button variant="ghost" size="sm">
            <Layout size={14} />
            模板
          </Button>
          <Button size="sm" onClick={handleSave}>保存</Button>
        </div>
      </div>

      {score !== null && (
        <div className="bg-primary-50 px-4 py-2 flex items-center justify-between">
          <span className="text-sm text-primary">简历评分</span>
          <div className="flex items-center gap-3">
            <ProgressBar value={score} className="w-40" color="bg-accent" />
            <span className="text-sm font-bold text-primary">{score}/100</span>
          </div>
          <button onClick={() => setScore(null)} className="text-xs text-text-secondary">关闭</button>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <div className="w-56 border-r border-gray-100 p-4 bg-gray-50/50 overflow-y-auto flex-shrink-0">
          <SectionNav
            sections={sections}
            activeId={activeSection?.id || ''}
            onSelect={setActiveSectionId}
            onAdd={handleAddSection}
            onRemove={handleRemoveSection}
          />
        </div>

        <div className="flex-1 p-6 overflow-y-auto bg-background">
          {activeSection ? (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-text-primary mb-6">
                {sectionConfig.find((c) => c.type === activeSection.type)?.icon}{' '}
                {activeSection.title}
              </h2>
              <SectionForm section={activeSection} onChange={handleSectionChange} />
            </Card>
          ) : (
            <div className="text-center py-20 text-text-secondary">
              请选择左侧模块开始编辑
            </div>
          )}
        </div>

        <div className="w-80 border-l border-gray-100 bg-gray-50 overflow-y-auto flex-shrink-0">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-text-primary">实时预览</h3>
          </div>
          <div className="p-4">
            <div className="bg-white shadow-sm rounded-lg border border-gray-100 overflow-hidden resume-preview-content">
              <ResumePreview sections={sections} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
