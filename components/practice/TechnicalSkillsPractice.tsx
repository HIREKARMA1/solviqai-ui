'use client';

import { useState } from 'react';

interface Question {
    id?: string;
    exam_type: string;
    category: string;
    topic: string;
    difficulty: string;
    question_type: string;
    question_text: string;
    options?: string[] | null;
    correct_answer?: string | null;
    explanation?: string;
    is_ai_generated: boolean;
}

export default function TechnicalSkillsPractice() {
    const [branch, setBranch] = useState<string>('Computer Science');
    const [topic, setTopic] = useState<string>('');
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
    const [numQuestions, setNumQuestions] = useState<number>(5);
    const [loading, setLoading] = useState(false);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
    const [showResults, setShowResults] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const branches = [
        { value: 'Computer Science', label: 'Computer Science (DS, Algo, OS, Networks)' },
        { value: 'Information Technology', label: 'Information Technology (Web, DB, Security)' },
        { value: 'Mechanical', label: 'Mechanical (Thermo, Fluid, Design)' },
        { value: 'Civil', label: 'Civil (Structures, Geotech, Transportation)' },
        { value: 'Electrical', label: 'Electrical (Circuits, Power, Control)' },
        { value: 'Electronics & Telecommunication', label: 'Electronics & Telecommunication' },
        { value: 'Electrical & Electronics', label: 'Electrical & Electronics' },
        { value: 'Chemical', label: 'Chemical' },
        { value: 'Biotechnology', label: 'Biotechnology' },
        { value: 'Agricultural', label: 'Agricultural' },
        { value: 'Food Processing', label: 'Food Processing' },
        { value: 'Instrumentation & Control', label: 'Instrumentation & Control' },
        { value: 'Production', label: 'Production' },
        { value: 'Metallurgical', label: 'Metallurgical' },
        { value: 'Automobile', label: 'Automobile' },
        { value: 'Aerospace', label: 'Aerospace' },
        { value: 'Mining', label: 'Mining' },
        { value: 'Polymer', label: 'Polymer' },
        { value: 'Textile', label: 'Textile' },
    ];
    

    const branchTopics: Record<string, string[]> = {
        'Computer Science': ['Data Structures', 'Algorithms', 'Operating Systems', 'Computer Networks', 'Database Systems', 'Software Engineering'],
        'Information Technology': ['Web Development', 'Database Management', 'Cybersecurity', 'Cloud Computing', 'Network Security', 'System Administration'],
        'Mechanical': ['Thermodynamics', 'Fluid Mechanics', 'Machine Design', 'Heat Transfer', 'Manufacturing', 'Solid Mechanics'],
        'Civil': ['Structural Analysis', 'Geotechnical Engineering', 'Transportation Engineering', 'Construction Management', 'Hydraulics', 'Concrete Technology'],
        'Electrical': ['Circuit Analysis', 'Power Systems', 'Control Systems', 'Electrical Machines', 'Power Electronics', 'Signal Processing'],
        'Electronics & Telecommunication': ['Digital Electronics', 'Communication Systems', 'Microprocessors', 'Signal Processing', 'Embedded Systems', 'VLSI Design'],
        'Electrical & Electronics': ['Circuit Theory', 'Power Electronics', 'Control Systems', 'Digital Signal Processing', 'Microcontrollers', 'Renewable Energy'],
        'Chemical': ['Process Engineering', 'Thermodynamics', 'Reaction Engineering', 'Mass Transfer', 'Heat Transfer', 'Process Control'],
        'Biotechnology': ['Molecular Biology', 'Biochemistry', 'Genetics', 'Microbiology', 'Bioreactors', 'Bioinformatics'],
        'Agricultural': ['Crop Science', 'Soil Science', 'Agricultural Engineering', 'Irrigation', 'Farm Machinery', 'Agricultural Economics'],
        'Food Processing': ['Food Chemistry', 'Food Microbiology', 'Food Preservation', 'Food Packaging', 'Quality Control', 'Food Safety'],
        'Instrumentation & Control': ['Process Control', 'Instrumentation Systems', 'Control Theory', 'PLC Programming', 'Sensors', 'Automation'],
        'Production': ['Manufacturing Processes', 'Quality Control', 'Industrial Engineering', 'Operations Management', 'Lean Manufacturing', 'Supply Chain'],
        'Metallurgical': ['Physical Metallurgy', 'Extractive Metallurgy', 'Materials Science', 'Heat Treatment', 'Welding', 'Corrosion'],
        'Automobile': ['Internal Combustion Engines', 'Vehicle Dynamics', 'Automotive Design', 'Transmission Systems', 'Automotive Electronics', 'Fuel Systems'],
        'Aerospace': ['Aerodynamics', 'Aircraft Structures', 'Propulsion Systems', 'Flight Mechanics', 'Spacecraft Design', 'Avionics'],
        'Mining': ['Mine Planning', 'Rock Mechanics', 'Mineral Processing', 'Mine Ventilation', 'Mine Safety', 'Explosives Engineering'],
        'Polymer': ['Polymer Chemistry', 'Polymer Processing', 'Polymer Properties', 'Polymer Characterization', 'Plastics Technology', 'Rubber Technology'],
        'Textile': ['Textile Chemistry', 'Textile Processing', 'Fabric Manufacturing', 'Textile Testing', 'Dyeing and Printing', 'Textile Machinery'],
    };

    const fetchQuestions = async () => {
        setLoading(true);
        setError(null);
        const startTime = Date.now();
        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                throw new Error('Please log in to access practice questions');
            }

            const params = new URLSearchParams({
                branch,
                difficulty,
                limit: numQuestions.toString(),
            });
            if (topic.trim()) {
                params.append('topic', topic.trim());
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000); // Increased timeout to 60s

            const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/practice/technical?${params}`;
            console.log('Fetching from:', apiUrl);

            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('API error response:', errorData);
                
                if (response.status === 401) {
                    throw new Error('Session expired. Please log in again.');
                } else if (response.status === 403) {
                    throw new Error('Access denied. Student access required.');
                } else if (response.status === 500) {
                    throw new Error('Server error. Please try again later or contact support.');
                } else {
                    throw new Error(
                        errorData.detail || errorData.error || `API error: ${response.status} ${response.statusText}`
                    );
                }
            }

            const data = await response.json();
            const elapsed = Date.now() - startTime;
            console.log(`Questions loaded in ${elapsed}ms`, data);

            if (!data.items || data.items.length === 0) {
                throw new Error('No questions returned from API. Please try with different parameters.');
            }

            setQuestions(data.items || []);
            setCurrentQuestionIndex(0);
            setUserAnswers({});
            setShowResults(false);
            setError(null);
        } catch (error: any) {
            console.error('Full error:', error);
            const errorMessage = error.name === 'AbortError'
                ? 'Request timeout. The server is taking too long to respond. Please try again with fewer questions.'
                : error.message || 'Failed to load questions. Please try again.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleAnswer = (answer: string) => {
        setUserAnswers((prev) => ({
            ...prev,
            [currentQuestionIndex]: answer,
        }));
    };

    const goToQuestion = (index: number) => {
        setCurrentQuestionIndex(index);
    };

    const handleSubmit = () => {
        setShowResults(true);
    };

    const calculateScore = () => {
        let correct = 0;
        questions.forEach((q, idx) => {
            if (q.correct_answer && userAnswers[idx] === q.correct_answer) {
                correct++;
            }
        });
        return correct;
    };

    const currentQuestion = questions[currentQuestionIndex];
    const isAnswered = currentQuestionIndex in userAnswers;
    const correctCount = calculateScore();
    const scorePercentage = Math.round((correctCount / questions.length) * 100);

    // Results Review Page
    if (showResults) {
        const incorrectCount = questions.length - correctCount;
        const unansweredCount = questions.length - Object.keys(userAnswers).length;
        const getScoreColor = () => {
            if (scorePercentage >= 80) return 'text-green-600';
            if (scorePercentage >= 60) return 'text-yellow-600';
            return 'text-red-600';
        };
        const getScoreBg = () => {
            if (scorePercentage >= 80) return 'bg-green-50 border-green-200';
            if (scorePercentage >= 60) return 'bg-yellow-50 border-yellow-200';
            return 'bg-red-50 border-red-200';
        };

        return (
            <div className="w-full max-w-4xl mx-auto">
                {/* Score Summary */}
                <div className={`bg-white p-8 rounded-lg shadow-lg mb-6 border-2 ${getScoreBg()}`}>
                    <div className="text-center mb-6">
                        <h2 className="text-4xl font-bold text-gray-900 mb-2">Assessment Complete! 🎉</h2>
                        <p className="text-gray-600">Review your performance and learn from the explanations</p>
                    </div>
                    
                    {/* Main Score Display */}
                    <div className="text-center mb-6">
                        <p className="text-gray-600 text-sm font-medium mb-2">Your Score</p>
                        <p className={`text-6xl font-bold ${getScoreColor()}`}>{scorePercentage}%</p>
                        <p className="text-gray-500 text-sm mt-2">
                            {correctCount} out of {questions.length} questions correct
                        </p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center justify-center mb-2">
                                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <p className="text-gray-600 text-xs font-medium mb-1">Correct</p>
                            <p className="text-3xl font-bold text-green-600">{correctCount}</p>
                        </div>
                        <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                            <div className="flex items-center justify-center mb-2">
                                <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <p className="text-gray-600 text-xs font-medium mb-1">Incorrect</p>
                            <p className="text-3xl font-bold text-red-600">{incorrectCount}</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center justify-center mb-2">
                                <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <p className="text-gray-600 text-xs font-medium mb-1">Unanswered</p>
                            <p className="text-3xl font-bold text-gray-600">{unansweredCount}</p>
                        </div>
                    </div>

                    {/* Action Button */}
                    <button
                        onClick={() => {
                            setQuestions([]);
                            setUserAnswers({});
                            setShowResults(false);
                            setError(null);
                        }}
                        className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-lg"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Practice Again
                    </button>
                </div>

                {/* Review All Answers */}
                <div className="bg-white p-8 rounded-lg shadow-lg">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-bold text-gray-900">Review Your Answers</h3>
                        <div className="flex items-center gap-4 text-xs">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-green-500 rounded"></div>
                                <span>Correct</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-red-500 rounded"></div>
                                <span>Incorrect</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-gray-300 rounded"></div>
                                <span>Not Answered</span>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-6">
                        {questions.map((question, idx) => {
                            const userAnswer = userAnswers[idx];
                            const isCorrect = userAnswer === question.correct_answer;
                            const isAnswered = idx in userAnswers;

                            return (
                                <div
                                    key={idx}
                                    className={`p-6 border-l-4 rounded-lg shadow-sm transition-all hover:shadow-md ${
                                        isAnswered && isCorrect
                                            ? 'border-green-600 bg-green-50'
                                            : isAnswered && !isCorrect
                                                ? 'border-red-600 bg-red-50'
                                                : 'border-gray-300 bg-gray-50'
                                    }`}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                    isAnswered && isCorrect
                                                        ? 'bg-green-600 text-white'
                                                        : isAnswered && !isCorrect
                                                            ? 'bg-red-600 text-white'
                                                            : 'bg-gray-500 text-white'
                                                }`}>
                                                    Question {idx + 1}
                                                </span>
                                                {isAnswered && isCorrect && (
                                                    <span className="flex items-center gap-1 text-green-700 font-semibold">
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                        </svg>
                                                        Correct
                                                    </span>
                                                )}
                                                {isAnswered && !isCorrect && (
                                                    <span className="flex items-center gap-1 text-red-700 font-semibold">
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                        </svg>
                                                        Incorrect
                                                    </span>
                                                )}
                                                {!isAnswered && (
                                                    <span className="flex items-center gap-1 text-gray-600 font-semibold">
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                        </svg>
                                                        Not Answered
                                                    </span>
                                                )}
                                            </div>
                                            <h4 className="text-lg font-semibold text-gray-900 leading-relaxed">{question.question_text}</h4>
                                        </div>
                                    </div>

                                    {/* MCQ Options Display */}
                                    {question.question_type === 'mcq' && question.options ? (
                                        <div className="space-y-3 mb-4">
                                            {question.options.map((option, optIdx) => {
                                                const optionLetter = String.fromCharCode(65 + optIdx);
                                                const isUserSelected = userAnswer === optionLetter;
                                                const isCorrectAnswer = optionLetter === question.correct_answer;

                                                return (
                                                    <div
                                                        key={optIdx}
                                                        className={`p-4 rounded-lg border-2 transition-all ${
                                                            isCorrectAnswer
                                                                ? 'border-green-600 bg-green-100 shadow-sm'
                                                                : isUserSelected && !isCorrect
                                                                    ? 'border-red-600 bg-red-100 shadow-sm'
                                                                    : 'border-gray-300 bg-white'
                                                        }`}
                                                    >
                                                        <div className="flex items-start">
                                                            <span className={`font-bold mr-3 mt-1 ${
                                                                isCorrectAnswer
                                                                    ? 'text-green-700'
                                                                    : isUserSelected && !isCorrect
                                                                        ? 'text-red-700'
                                                                        : 'text-gray-600'
                                                            }`}>
                                                                {optionLetter}.
                                                            </span>
                                                            <span className="flex-1 text-gray-800">{option}</span>
                                                            {isCorrectAnswer && (
                                                                <svg className="w-5 h-5 text-green-600 ml-2" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                                </svg>
                                                            )}
                                                            {isUserSelected && !isCorrect && (
                                                                <svg className="w-5 h-5 text-red-600 ml-2" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : null}

                                    {/* Explanation */}
                                    {question.explanation && (
                                        <div className="p-4 bg-blue-50 border-l-4 border-blue-600 rounded-lg">
                                            <div className="flex items-center gap-2 mb-2">
                                                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                </svg>
                                                <p className="text-sm font-semibold text-blue-900">Explanation</p>
                                            </div>
                                            <p className="text-sm text-blue-800 leading-relaxed">{question.explanation}</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    // Initial Form Screen
    if (questions.length === 0) {
        return (
            <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
                <div className="mb-6">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Technical Skills Practice</h2>
                    <p className="text-gray-600">Practice technical questions tailored to your engineering branch</p>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                        <div className="flex items-center">
                            <svg className="h-5 w-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <p className="text-red-800 font-medium">{error}</p>
                        </div>
                    </div>
                )}

                {/* Branch Selector */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Your Branch <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={branch}
                        onChange={(e) => {
                            setBranch(e.target.value);
                            setTopic(''); // Reset topic when branch changes
                            setError(null); // Clear error on change
                        }}
                        disabled={loading}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                        {branches.map((b) => (
                            <option key={b.value} value={b.value}>
                                {b.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Topic Input */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Topic (Optional)
                    </label>
                    <input
                        type="text"
                        value={topic}
                        onChange={(e) => {
                            setTopic(e.target.value);
                            setError(null);
                        }}
                        disabled={loading}
                        placeholder={branchTopics[branch]?.[0] ? `e.g., ${branchTopics[branch][0]} — leave empty for mixed questions` : 'Enter a topic or leave empty for mixed questions'}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                    {branchTopics[branch] && branchTopics[branch].length > 0 && (
                        <div className="mt-2">
                            <p className="text-xs text-gray-500 mb-1">Suggested topics:</p>
                            <div className="flex flex-wrap gap-2">
                                {branchTopics[branch].slice(0, 6).map((suggestedTopic) => (
                                    <button
                                        key={suggestedTopic}
                                        type="button"
                                        onClick={() => {
                                            setTopic(suggestedTopic);
                                            setError(null);
                                        }}
                                        disabled={loading}
                                        className="px-3 py-1 text-xs bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {suggestedTopic}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Difficulty Selector */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty Level</label>
                    <div className="grid grid-cols-3 gap-3">
                        {(['easy', 'medium', 'hard'] as const).map((level) => (
                            <button
                                key={level}
                                type="button"
                                onClick={() => {
                                    setDifficulty(level);
                                    setError(null);
                                }}
                                disabled={loading}
                                className={`py-3 px-4 rounded-lg font-medium transition capitalize disabled:opacity-50 disabled:cursor-not-allowed ${
                                    difficulty === level
                                        ? level === 'easy'
                                            ? 'bg-green-600 text-white shadow-md'
                                            : level === 'medium'
                                            ? 'bg-yellow-500 text-white shadow-md'
                                            : 'bg-red-600 text-white shadow-md'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                {level}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Number of Questions */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Number of Questions: <span className="text-blue-600 font-bold">{numQuestions}</span>
                    </label>
                    <input
                        type="range"
                        min="5"
                        max="50"
                        step="5"
                        value={numQuestions}
                        onChange={(e) => {
                            setNumQuestions(parseInt(e.target.value));
                            setError(null);
                        }}
                        disabled={loading}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>5</span>
                        <span>50</span>
                    </div>
                </div>

                {/* Fetch Button */}
                <button
                    onClick={fetchQuestions}
                    disabled={loading}
                    className={`w-full py-4 rounded-lg font-semibold text-white transition flex items-center justify-center gap-3 shadow-lg ${
                        loading
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 hover:shadow-xl transform hover:-translate-y-0.5'
                    }`}
                >
                    {loading ? (
                        <>
                            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                            <span>Generating Questions... (may take 15-30s)</span>
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Start Practice</span>
                        </>
                    )}
                </button>

                {/* Info Message */}
                {!loading && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs text-blue-800">
                            <strong>Tip:</strong> Questions are generated using AI. Leave the topic field empty for a diverse mix of questions covering various topics in your branch.
                        </p>
                    </div>
                )}
            </div>
        );
    }

    // Questions View
    return (
        <div className="w-full max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Main Content Area */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Header */}
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-1">{branch} Practice</h2>
                                <p className="text-gray-600">
                                    Question <span className="font-semibold text-blue-600">{currentQuestionIndex + 1}</span> of{' '}
                                    <span className="font-semibold">{questions.length}</span>
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-500 mb-1">Difficulty</p>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                                    difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                }`}>
                                    {difficulty.toUpperCase()}
                                </span>
                            </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                                className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300"
                                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            {Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}% Complete
                        </p>
                    </div>

                    {/* Question Display */}
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <div className="mb-6">
                            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full mb-4">
                                Question {currentQuestionIndex + 1}
                            </span>
                            <h3 className="text-xl font-semibold text-gray-900 leading-relaxed">
                                {currentQuestion.question_text}
                            </h3>
                        </div>

                        {/* MCQ Options */}
                        {currentQuestion.question_type === 'mcq' && currentQuestion.options ? (
                            <div className="space-y-3">
                                {currentQuestion.options.map((option, idx) => {
                                    const optionLetter = String.fromCharCode(65 + idx);
                                    const isSelected = userAnswers[currentQuestionIndex] === optionLetter;
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => handleAnswer(optionLetter)}
                                            className={`w-full text-left p-4 border-2 rounded-lg transition-all duration-200 ${
                                                isSelected
                                                    ? 'border-blue-600 bg-blue-50 shadow-md transform scale-[1.01]'
                                                    : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50 hover:shadow-sm'
                                            }`}
                                        >
                                            <div className="flex items-start">
                                                <span className={`font-bold mr-3 mt-1 ${
                                                    isSelected ? 'text-blue-600' : 'text-gray-500'
                                                }`}>
                                                    {optionLetter}.
                                                </span>
                                                <span className="flex-1 text-gray-800">{option}</span>
                                                {isSelected && (
                                                    <svg className="w-5 h-5 text-blue-600 ml-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : null}
                    </div>

                    {/* Navigation */}
                    <div className="bg-white p-4 rounded-lg shadow-lg">
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                                disabled={currentQuestionIndex === 0}
                                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition font-medium flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                Previous
                            </button>
                            <button
                                onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
                                disabled={currentQuestionIndex === questions.length - 1}
                                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition font-medium flex items-center gap-2"
                            >
                                Next
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                            {currentQuestionIndex === questions.length - 1 && (
                                <button
                                    onClick={handleSubmit}
                                    className="px-6 py-3 bg-green-600 text-white rounded-lg ml-auto hover:bg-green-700 transition font-semibold flex items-center gap-2 shadow-lg"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Submit & Review
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    if (confirm('Are you sure you want to exit? Your progress will be lost.')) {
                                        setQuestions([]);
                                        setUserAnswers({});
                                        setShowResults(false);
                                        setError(null);
                                    }
                                }}
                                className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Exit
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Sidebar - Question Navigator */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-lg shadow-lg sticky top-6">
                        <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                            </svg>
                            Progress
                        </h4>
                        <p className="text-xs text-gray-500 mb-4">
                            {Object.keys(userAnswers).length} of {questions.length} answered
                        </p>
                        <div className="grid grid-cols-5 gap-2 mb-4">
                            {questions.map((_, idx) => {
                                const isCurrent = currentQuestionIndex === idx;
                                const isAnswered = idx in userAnswers;
                                const isCorrect = isAnswered && questions[idx].correct_answer === userAnswers[idx];
                                
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => goToQuestion(idx)}
                                        className={`w-full aspect-square rounded-lg text-xs font-semibold transition-all duration-200 transform hover:scale-110 ${
                                            isCurrent
                                                ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-300'
                                                : isAnswered
                                                    ? isCorrect
                                                        ? 'bg-green-500 text-white shadow-md'
                                                        : 'bg-red-500 text-white shadow-md'
                                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:shadow-md'
                                        }`}
                                        title={isAnswered ? `Question ${idx + 1} - ${isCorrect ? 'Correct' : 'Incorrect'}` : `Question ${idx + 1} - Not answered`}
                                    >
                                        {idx + 1}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="pt-4 border-t border-gray-200">
                            <p className="text-xs font-semibold text-gray-700 mb-3">Legend</p>
                            <div className="space-y-2 text-xs">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-blue-600 rounded flex-shrink-0"></div>
                                    <span className="text-gray-600">Current</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-green-500 rounded flex-shrink-0"></div>
                                    <span className="text-gray-600">Correct</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-red-500 rounded flex-shrink-0"></div>
                                    <span className="text-gray-600">Incorrect</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-gray-200 rounded flex-shrink-0"></div>
                                    <span className="text-gray-600">Not Answered</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}