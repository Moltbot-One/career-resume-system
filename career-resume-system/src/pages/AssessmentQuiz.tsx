import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { useAssessmentStore } from '@/stores/assessmentStore';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';
import Card from '@/components/ui/Card';

export default function AssessmentQuiz() {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const { startAssessment, currentAssessment, currentQuestionIndex, submitAnswer, nextQuestion, prevQuestion, completeAssessment, isLoading } = useAssessmentStore();
  const [localAnswers, setLocalAnswers] = useState<Record<number, string>>({});

  useEffect(() => {
    if (type) {
      startAssessment(type as 'mbti' | 'holland' | 'competency');
    }
  }, [type]);

  const questions = currentAssessment?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  const handleSelect = (questionId: number, optionKey: string) => {
    setLocalAnswers((prev) => ({ ...prev, [questionId]: optionKey }));
    submitAnswer(questionId, optionKey);
  };

  const handleComplete = async () => {
    await completeAssessment();
    if (currentAssessment) {
      navigate(`/assessment/${type}/report?id=${currentAssessment.id}`);
    }
  };

  if (!currentQuestion) {
    return (
      <div className="p-6 lg:p-8 max-w-2xl mx-auto text-center">
        <p className="text-text-secondary">加载中...</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-text-secondary">
            第 {currentQuestionIndex + 1} / {questions.length} 题
          </span>
          <span className="text-sm font-medium text-primary">{Math.round(progress)}%</span>
        </div>
        <ProgressBar value={progress} />
      </div>

      <Card className="p-8 mb-6">
        <h2 className="text-lg font-semibold text-text-primary mb-6">{currentQuestion.text}</h2>
        <div className="space-y-3">
          {currentQuestion.options.map((option) => {
            const isSelected = localAnswers[currentQuestion.id] === option.key;
            return (
              <button
                key={option.key}
                onClick={() => handleSelect(currentQuestion.id, option.key)}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                  isSelected
                    ? 'border-primary bg-primary-50 text-primary'
                    : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'border-primary' : 'border-gray-300'
                    }`}
                  >
                    {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                  </div>
                  <span className="text-sm">{option.text}</span>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={prevQuestion}
          disabled={currentQuestionIndex === 0}
        >
          <ArrowLeft size={16} />
          上一题
        </Button>
        {currentQuestionIndex < questions.length - 1 ? (
          <Button onClick={nextQuestion}>
            下一题
            <ArrowRight size={16} />
          </Button>
        ) : (
          <Button onClick={handleComplete} loading={isLoading}>
            <CheckCircle size={16} />
            完成测评
          </Button>
        )}
      </div>
    </div>
  );
}
