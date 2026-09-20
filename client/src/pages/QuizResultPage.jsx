import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { api } from '../api/client.js';
import { Spinner } from '../components/ui/index.jsx';
import QuizReview from '../components/quiz/QuizReview.jsx';
import { useToast } from '../state/ToastContext.jsx';

/** One saved attempt, with the full answer review (Phase 3). */
export default function QuizResultPage() {
  const { resultId } = useParams();
  const toast = useToast();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setResult(await api.quizResults.get(resultId));
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultId]);

  if (loading) return <Spinner />;
  if (!result) return null;

  return (
    <div className="space-y-4">
      <div>
        <Link to="/quiz" className="muted inline-flex items-center gap-1 hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" />
          Quiz তালিকা
        </Link>
        <h1 className="text-lg font-semibold text-ink-900">{result.quizTitle}</h1>
        <p className="muted">{result.subjectName}</p>
      </div>
      <QuizReview result={result} onChange={load} />
    </div>
  );
}
