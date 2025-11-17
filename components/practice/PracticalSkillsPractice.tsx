'use client';

import { useMemo, useState } from 'react';

interface Question {
  exam_type: string;
  category: string;
  topic: string;
  difficulty?: string | null;
  question_type: 'mcq' | 'written';
  question_text: string;
  options?: string[] | null;
  correct_answer?: string | null;
  explanation?: string | null;
  is_ai_generated: boolean;
}

interface PracticalEvalItem {
  index: number;
  score: number; // 0-10
  feedback: string;
}

interface PracticalSkillsPracticeProps {
  branch?: string;
}

export default function PracticalSkillsPractice({ branch: initialBranch }: PracticalSkillsPracticeProps = {}) {
  const [branch, setBranch] = useState<string>(initialBranch || 'Mechanical');
  const [topic, setTopic] = useState<string>('');
  const [limit, setLimit] = useState<number>(6);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userMcqAnswers, setUserMcqAnswers] = useState<Record<number, string>>({});
  const [userWrittenAnswers, setUserWrittenAnswers] = useState<Record<number, string>>({});

  const [showResults, setShowResults] = useState(false);
  const [evalLoading, setEvalLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<{ score: number; feedback: string; analyses: PracticalEvalItem[] } | null>(null);

  const branches = [
    'Mechanical',
    'Civil',
    'Electrical',
    'Electronics & Telecommunication',
    'Automobile',
  ];

  const mcqCount = useMemo(() => questions.filter((q) => q.question_type === 'mcq').length, [questions]);
  const writtenCount = useMemo(() => questions.filter((q) => q.question_type === 'written').length, [questions]);

  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Please log in to access practice questions');

      const params = new URLSearchParams({ branch, limit: String(limit) });
      if (topic.trim()) params.append('topic', topic.trim());

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/practice/practical?${params}`;
      const resp = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        if (resp.status === 401) throw new Error('Session expired. Please log in again.');
        if (resp.status === 403) throw new Error('Access denied. Student access required.');
        if (resp.status === 500) throw new Error('Server error. Please try again later.');
        throw new Error(data.detail || data.error || `API error: ${resp.status} ${resp.statusText}`);
      }

      const data = await resp.json();
      const items: Question[] = data.items || [];
      if (!items.length) throw new Error('No questions returned. Try different parameters.');

      setQuestions(items);
      setCurrentIndex(0);
      setUserMcqAnswers({});
      setUserWrittenAnswers({});
      setShowResults(false);
      setEvaluation(null);
    } catch (e: any) {
      const msg = e.name === 'AbortError' ? 'Request timed out. Try fewer questions.' : e.message || 'Failed to load questions.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleMcqSelect = (answer: string) => {
    setUserMcqAnswers((prev) => ({ ...prev, [currentIndex]: answer }));
  };

  const handleWrittenChange = (value: string) => {
    setUserWrittenAnswers((prev) => ({ ...prev, [currentIndex]: value }));
  };

  const goTo = (idx: number) => setCurrentIndex(idx);

  const finishAndEvaluate = async () => {
    // Only written questions are evaluated by backend; MCQs are scored locally
    const writtenItems: { question_text: string; answer_text: string }[] = [];
    const writtenIndexMap: number[] = [];
    questions.forEach((q, i) => {
      if (q.question_type === 'written') {
        writtenItems.push({ question_text: q.question_text, answer_text: userWrittenAnswers[i] || '' });
        writtenIndexMap.push(i);
      }
    });

    setShowResults(true);
    if (!writtenItems.length) {
      setEvaluation({ score: 0, feedback: 'No written answers to evaluate.', analyses: [] });
      return;
    }

    try {
      setEvalLoading(true);
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Please log in to evaluate');

      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/practice/practical/evaluate`;
      const resp = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ branch, topic: topic || null, items: writtenItems }),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        if (resp.status === 401) throw new Error('Session expired. Please log in again.');
        if (resp.status === 403) throw new Error('Access denied. Student access required.');
        if (resp.status === 500) throw new Error('Server error. Please try again later.');
        throw new Error(data.detail || data.error || `API error: ${resp.status} ${resp.statusText}`);
      }

      const data = await resp.json();
      const evalData = data.evaluation || { score: 0, feedback: '', analyses: [] };
      // Map returned indices to global question indices
      const mappedAnalyses: PracticalEvalItem[] = (evalData.analyses || []).map((it: any, idx: number) => ({
        index: writtenIndexMap[idx] ?? idx,
        score: it.score ?? 0,
        feedback: it.feedback ?? '',
      }));
      setEvaluation({ score: evalData.score || 0, feedback: evalData.feedback || '', analyses: mappedAnalyses });
    } catch (e: any) {
      setEvaluation({ score: 0, feedback: e.message || 'Evaluation failed', analyses: [] });
    } finally {
      setEvalLoading(false);
    }
  };

  const calculateMcqScore = () => {
    let correct = 0;
    questions.forEach((q, i) => {
      if (q.question_type === 'mcq' && q.correct_answer && userMcqAnswers[i] === q.correct_answer) correct++;
    });
    return correct;
  };

  const current = questions[currentIndex];
  const hasQuestions = questions.length > 0;

  if (showResults) {
    const totalMcq = mcqCount;
    const correctMcq = calculateMcqScore();
    const mcqPct = totalMcq ? Math.round((correctMcq / totalMcq) * 100) : 0;

    return (
      <div className="w-full max-w-5xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow mb-6 border">
          <h2 className="text-2xl font-bold text-gray-800 mb-1">Practical Test Results</h2>
          <p className="text-gray-600 mb-4">Review your MCQ score and written feedback.</p>

          {/* MCQ Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-gray-600 text-xs">MCQ Correct</p>
              <p className="text-3xl font-bold text-green-600">{correctMcq}</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-gray-600 text-xs">MCQ Total</p>
              <p className="text-3xl font-bold text-blue-600">{totalMcq}</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-gray-600 text-xs">MCQ Score</p>
              <p className="text-3xl font-bold text-purple-600">{mcqPct}%</p>
            </div>
          </div>

          {/* Written Evaluation */}
          <div className="mt-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Written Answers Evaluation</h3>
            {evalLoading && <p className="text-gray-600">Evaluating answers…</p>}
            {!evalLoading && evaluation && (
              <div className="bg-gray-50 p-4 rounded border">
                <p className="text-gray-700"><span className="font-semibold">Overall Score:</span> {evaluation.score}/10</p>
                <p className="text-gray-700 mt-1"><span className="font-semibold">Feedback:</span> {evaluation.feedback || '—'}</p>
                <div className="mt-4 space-y-3">
                  {evaluation.analyses.length === 0 && (
                    <p className="text-gray-600">No written items were evaluated.</p>
                  )}
                  {evaluation.analyses.map((item) => (
                    <div key={item.index} className="p-3 bg-white rounded border">
                      <p className="text-sm text-gray-500">Question #{item.index + 1}</p>
                      <p className="text-gray-800"><span className="font-semibold">Score:</span> {item.score}/10</p>
                      <p className="text-gray-700"><span className="font-semibold">Feedback:</span> {item.feedback}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              onClick={() => {
                setShowResults(false);
                setCurrentIndex(0);
              }}
            >
              Back to Questions
            </button>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={() => {
                setQuestions([]);
                setUserMcqAnswers({});
                setUserWrittenAnswers({});
                setEvaluation(null);
                setShowResults(false);
              }}
            >
              Reset Practice
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Controls */}
      <div className="bg-white p-6 rounded-lg shadow mb-6 border">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Practical Skills Practice</h2>
        <p className="text-gray-600 mb-4">Generate situation-based questions for mechanical, civil, and electrical branches.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Branch</label>
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="w-full p-2 border rounded bg-white"
            >
              {branches.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Topic (optional)</label>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Thermodynamics"
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Number of Questions</label>
            <input
              type="number"
              min={1}
              max={50}
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value || '6', 10))}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          <button
            onClick={fetchQuestions}
            disabled={loading}
            className={`px-4 py-2 rounded text-white ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {loading ? 'Loading…' : 'Generate Questions'}
          </button>
          {error && <p className="text-red-600">{error}</p>}
        </div>
      </div>

      {/* Questions */}
      {hasQuestions && (
        <div className="bg-white p-6 rounded-lg shadow mb-6 border">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-sm text-gray-600">Branch: <span className="font-medium text-gray-800">{branch}</span></p>
              <p className="text-sm text-gray-600">Topic: <span className="font-medium text-gray-800">{topic || `MIXED:${branch}`}</span></p>
              <p className="text-sm text-gray-600">Questions: <span className="font-medium text-gray-800">{questions.length} (MCQ: {mcqCount}, Written: {writtenCount})</span></p>
            </div>
            <div className="flex gap-2">
              <button
                className="px-3 py-2 bg-gray-200 rounded"
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0}
              >Previous</button>
              <button
                className="px-3 py-2 bg-gray-200 rounded"
                onClick={() => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))}
                disabled={currentIndex >= questions.length - 1}
              >Next</button>
            </div>
          </div>

          {/* Current Question */}
          <div className="p-4 rounded border bg-gray-50">
            <div className="text-sm text-gray-500 mb-2">Question {currentIndex + 1} of {questions.length}</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">{current?.question_text}</h3>

            {current?.question_type === 'mcq' && current?.options && (
              <div className="space-y-2">
                {current.options.map((opt, idx) => {
                  const letter = ['A','B','C','D'][idx] || String(idx + 1);
                  const selected = userMcqAnswers[currentIndex] === letter;
                  return (
                    <label key={idx} className={`flex items-center gap-2 p-2 rounded border ${selected ? 'bg-blue-50 border-blue-300' : 'bg-white'}`}>
                      <input type="radio" name={`q-${currentIndex}`} checked={selected} onChange={() => handleMcqSelect(letter)} />
                      <span className="font-medium text-gray-800">{letter}.</span>
                      <span className="text-gray-700">{opt}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {current?.question_type === 'written' && (
              <div>
                <textarea
                  placeholder="Write your short explanation or calculation here…"
                  value={userWrittenAnswers[currentIndex] || ''}
                  onChange={(e) => handleWrittenChange(e.target.value)}
                  className="w-full p-3 border rounded min-h-[140px]"
                />
              </div>
            )}

            {current?.explanation && (
              <div className="mt-4 p-3 bg-white rounded border">
                <p className="text-sm text-gray-600">Explanation:</p>
                <p className="text-gray-700">{current.explanation}</p>
              </div>
            )}

            {/* Bottom controls */}
            <div className="mt-4 flex justify-between">
              <div className="flex gap-2">
                {Array.from({ length: questions.length }).map((_, i) => (
                  <button
                    key={i}
                    className={`w-8 h-8 rounded text-sm ${i === currentIndex ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
                    onClick={() => goTo(i)}
                  >{i + 1}</button>
                ))}
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700" onClick={finishAndEvaluate}>Finish & Evaluate</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}