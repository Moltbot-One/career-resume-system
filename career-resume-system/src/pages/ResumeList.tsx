import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Trash2, Edit3, MoreVertical } from 'lucide-react';
import { useResumeStore } from '@/stores/resumeStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';

export default function ResumeList() {
  const navigate = useNavigate();
  const { resumes, fetchResumes, createResume, deleteResume, isLoading } = useResumeStore();
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  useEffect(() => {
    fetchResumes();
  }, [fetchResumes]);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    try {
      const resume = await createResume(newTitle.trim(), 'default');
      setShowCreate(false);
      setNewTitle('');
      navigate(`/resumes/${resume.id}`);
    } catch {}
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteResume(deleteId);
    setDeleteId(null);
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">我的简历</h1>
          <p className="text-text-secondary mt-1">管理你的所有简历</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} />
          创建简历
        </Button>
      </div>

      {resumes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resumes.map((resume) => (
            <Card key={resume.id} hover className="relative group">
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center cursor-pointer"
                    onClick={() => navigate(`/resumes/${resume.id}`)}
                  >
                    <FileText size={24} className="text-primary" />
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpenId(menuOpenId === resume.id ? null : resume.id)}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded"
                    >
                      <MoreVertical size={18} />
                    </button>
                    {menuOpenId === resume.id && (
                      <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10 min-w-[120px]">
                        <button
                          onClick={() => {
                            setMenuOpenId(null);
                            navigate(`/resumes/${resume.id}`);
                          }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-text-primary hover:bg-gray-50"
                        >
                          <Edit3 size={14} />
                          编辑
                        </button>
                        <button
                          onClick={() => {
                            setMenuOpenId(null);
                            setDeleteId(resume.id);
                          }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={14} />
                          删除
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <h3
                  className="font-semibold text-text-primary mb-2 cursor-pointer hover:text-primary"
                  onClick={() => navigate(`/resumes/${resume.id}`)}
                >
                  {resume.title}
                </h3>
                <p className="text-xs text-text-secondary mb-3">
                  更新于 {new Date(resume.updatedAt).toLocaleDateString()}
                </p>
                <Badge variant={resume.status === 'completed' ? 'success' : 'warning'}>
                  {resume.status === 'completed' ? '已完成' : '草稿'}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <FileText size={48} className="text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text-primary mb-2">还没有简历</h3>
          <p className="text-text-secondary mb-6">创建你的第一份简历，开始职业新旅程</p>
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={16} />
            创建简历
          </Button>
        </Card>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="创建新简历">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">简历标题</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="例如：前端开发工程师简历"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowCreate(false)}>取消</Button>
            <Button onClick={handleCreate} loading={isLoading}>创建</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="确认删除" size="sm">
        <p className="text-text-secondary mb-6">确定要删除这份简历吗？此操作无法撤销。</p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleteId(null)}>取消</Button>
          <Button variant="danger" onClick={handleDelete}>删除</Button>
        </div>
      </Modal>
    </div>
  );
}
