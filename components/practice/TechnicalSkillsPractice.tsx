'use client';

import { useState, useEffect } from 'react';
import { config } from '@/lib/config';
import SubscriptionRequiredModal from '../subscription/SubscriptionRequiredModal';

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
    const [subscriptionType, setSubscriptionType] = useState<string>('free');
    const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

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

    // Check Subscription Status
    useEffect(() => {
        const checkUser = async () => {
            try {
                const token = localStorage.getItem('access_token');
                if (!token) return;

                const response = await fetch(`${config.api.fullUrl}/api/v1/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (response.ok) {
                    const userData = await response.json();
                    const sub = userData.subscription_type || 'free';
                    setSubscriptionType(sub);

                    // Force limit to 2 for free users
                    if (sub === 'free') {
                        setNumQuestions(2);
                    }
                }
            } catch (err) {
                console.error("Failed to check subscription", err);
            }
        };
        checkUser();
    }, []);

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

            const apiUrl = `${config.api.fullUrl}/api/v1/practice/technical?${params}`;
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
                } else if (response.status === 403 || response.status === 402) {
                    setShowSubscriptionModal(true);
                    throw new Error('Access denied. Subscription upgrade required.');
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
                                    className={`p-6 border-l-4 rounded-lg shadow-sm transition-all hover:shadow-md ${isAnswered && isCorrect
                                        ? 'border-green-600 bg-green-50'
                                        : isAnswered && !isCorrect
                                            ? 'border-red-600 bg-red-50'
                                            : 'border-gray-300 bg-gray-50'
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isAnswered && isCorrect
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
                                                        className={`p-4 rounded-lg border-2 transition-all ${isCorrectAnswer
                                                            ? 'border-green-600 bg-green-100 shadow-sm'
                                                            : isUserSelected && !isCorrect
                                                                ? 'border-red-600 bg-red-100 shadow-sm'
                                                                : 'border-gray-300 bg-white'
                                                            }`}
                                                    >
                                                        <div className="flex items-start">
                                                            <span className={`font-bold mr-3 mt-1 ${isCorrectAnswer
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
            <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 bg-gradient-to-br from-blue-50 via-white to-blue-50/30 rounded-2xl shadow-xl border border-blue-100/50">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse shadow-lg shadow-blue-500/50"></div>
                        <h2 className="text-3xl font-bold">
                            <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">AI-Powered</span>{' '}
                            <span className="text-blue-400">Technical Skills Practice</span>
                        </h2>
                    </div>
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

                <div className="space-y-6">
                    {/* Branch Selector */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <div className="w-1 h-5 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full"></div>
                            Select Your Branch <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={branch}
                            onChange={(e) => {
                                setBranch(e.target.value);
                                setTopic('');
                                setError(null);
                            }}
                            disabled={loading}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:shadow-md bg-white/90 backdrop-blur-sm disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-900"
                        >
                            {branches.map((b) => (
                                <option key={b.value} value={b.value} className="text-gray-900">
                                    {b.label || b.value}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Topic Input */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <div className="w-1 h-5 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full"></div>
                            Topic (Optional)
                        </label>
                        <input
                            type="text"
                            value={topic || ''}
                            onChange={(e) => {
                                setTopic(e.target.value);
                                setError(null);
                            }}
                            disabled={loading}
                            placeholder={branchTopics[branch]?.[0] ? `e.g., ${branchTopics[branch][0]} — leave empty for AI-curated mix` : 'Enter a topic or leave empty for mixed questions'}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:shadow-md bg-white/90 backdrop-blur-sm disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-900"
                        />
                        {branchTopics[branch] && branchTopics[branch].length > 0 && (
                            <div className="mt-3">
                                <p className="text-xs text-gray-500 mb-2 font-medium">Suggested topics:</p>
                                <div className="flex flex-wrap gap-2">
                                    {branchTopics[branch].slice(0, 6).map((suggestedTopic) => (
                                        <button
                                            key={suggestedTopic}
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setTopic(suggestedTopic);
                                                setError(null);
                                            }}
                                            disabled={loading}
                                            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed border ${topic === suggestedTopic
                                                ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white border-blue-600 shadow-md'
                                                : 'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border-blue-200 hover:from-blue-100 hover:to-cyan-100'
                                                }`}
                                        >
                                            {suggestedTopic}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Difficulty Level with Sliding Indicator */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <div className="w-1 h-5 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full"></div>
                            Difficulty Level
                        </label>
                        <div className="relative flex gap-2 p-1 bg-white/80 backdrop-blur-sm rounded-xl border border-blue-200/50 shadow-lg">
                            {/* Sliding Background Indicator */}
                            <div
                                className="absolute top-1 bottom-1 rounded-lg shadow-lg transition-all duration-500 ease-out z-0"
                                style={{
                                    width: 'calc(33.333% - 8px)',
                                    left: difficulty === 'easy'
                                        ? '4px'
                                        : difficulty === 'medium'
                                            ? 'calc(33.333% + 4px)'
                                            : 'calc(66.666% + 4px)',
                                    background: difficulty === 'easy'
                                        ? 'linear-gradient(to right, #3b82f6, #2563eb)'
                                        : difficulty === 'medium'
                                            ? 'linear-gradient(to right, #10b981, #059669)'
                                            : 'linear-gradient(to right, #1f2937, #111827)',
                                    boxShadow: difficulty === 'easy'
                                        ? '0 4px 12px rgba(37, 99, 235, 0.4)'
                                        : difficulty === 'medium'
                                            ? '0 4px 12px rgba(16, 185, 129, 0.4)'
                                            : '0 4px 12px rgba(31, 41, 55, 0.4)',
                                }}
                            ></div>
                            {(['easy', 'medium', 'hard'] as const).map((level) => {
                                const isSelected = difficulty === level;
                                const icons = {
                                    easy: (
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                        </svg>
                                    ),
                                    medium: (
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                            <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                                        </svg>
                                    ),
                                    hard: (
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                        </svg>
                                    ),
                                };
                                const colors = {
                                    easy: isSelected ? 'text-white' : 'text-green-600',
                                    medium: isSelected ? 'text-white' : 'text-orange-600',
                                    hard: isSelected ? 'text-white' : 'text-gray-700',
                                };
                                return (
                                    <button
                                        key={level}
                                        type="button"
                                        onClick={() => {
                                            setDifficulty(level);
                                            setError(null);
                                        }}
                                        disabled={loading}
                                        className={`relative z-10 flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-300 capitalize flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${isSelected
                                            ? 'scale-105 shadow-md'
                                            : 'hover:scale-[1.02]'
                                            } ${colors[level]}`}
                                    >
                                        {icons[level]}
                                        {level}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Number of Questions */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <div className="w-1 h-5 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full"></div>
                            Number of Questions
                            {subscriptionType === 'free' && (
                                <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full font-bold">
                                    Free Limit: 2
                                </span>
                            )}
                        </label>
                        <div className={`relative ${subscriptionType === 'free' ? 'opacity-60 grayscale' : ''}`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-gray-500 font-medium">{subscriptionType === 'free' ? '2 questions' : '1 question'}</span>
                                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                                    {numQuestions}
                                </span>
                                <span className="text-xs text-gray-500 font-medium">{subscriptionType === 'free' ? 'Max 2' : '25 questions'}</span>
                            </div>
                            <input
                                type="range"
                                min={subscriptionType === 'free' ? "2" : "1"}
                                max={subscriptionType === 'free' ? "2" : "25"}
                                step="1"
                                value={numQuestions}
                                onChange={(e) => {
                                    setNumQuestions(parseInt(e.target.value));
                                    setError(null);
                                }}
                                disabled={loading || subscriptionType === 'free'}
                                className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider ${subscriptionType === 'free' ? 'cursor-not-allowed' : ''}`}
                                style={{
                                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${subscriptionType === 'free' ? 100 : ((numQuestions - 1) / 24) * 100}%, #e5e7eb ${subscriptionType === 'free' ? 100 : ((numQuestions - 1) / 24) * 100}%, #e5e7eb 100%)`,
                                }}
                            />
                            {subscriptionType === 'free' && (
                                <p className="mt-2 text-xs text-yellow-700 bg-yellow-50 p-2 rounded border border-yellow-200">
                                    🔒 <strong>Free Plan Limit Check:</strong> You can only generate 2 questions. Upgrade to Premium for up to 30/day!
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Fetch Button */}
                <button
                    onClick={fetchQuestions}
                    disabled={loading}
                    className={`mt-8 w-full py-4 rounded-xl font-bold text-white transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none ${loading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600'
                        }`}
                >
                    {loading ? (
                        <>
                            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                            <span>Generating Questions... (may take 15-30s)</span>
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
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

    // Questions View - Professional Exam Interface
    return (
        <div className="w-full bg-gradient-to-br from-slate-50 via-white to-blue-50/20 pb-12">
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
                    {/* Main Content Area - Exam Style */}
                    <div className="lg:col-span-3 space-y-4 sm:space-y-6">
                        {/* Professional Exam Header */}
                        <div className="bg-white border-2 border-gray-200 rounded-xl shadow-lg p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{branch} Practice</h2>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                        <span>
                                            Question <span className="font-bold text-blue-600 text-lg">{currentQuestionIndex + 1}</span> of{' '}
                                            <span className="font-bold">{questions.length}</span>
                                        </span>
                                        <span className="hidden sm:inline">•</span>
                                        <span className="hidden sm:inline">
                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                                                difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                {difficulty.toUpperCase()}
                                            </span>
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-500 mb-1">Progress</p>
                                    <p className="text-lg font-bold text-blue-600">
                                        {Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%
                                    </p>
                                </div>
                            </div>
                            {/* Progress Bar */}
                            <div className="w-full bg-gray-100 rounded-full h-2.5 border border-gray-200">
                                <div
                                    className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 h-2.5 rounded-full transition-all duration-500 shadow-sm"
                                    style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                                />
                            </div>
                        </div>

                        {/* Question Card - Exam Style */}
                        <div className="bg-white border-2 border-gray-200 rounded-xl shadow-lg p-6 sm:p-8">
                            {/* Question Number Badge */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-md">
                                        {currentQuestionIndex + 1}
                                    </div>
                                    <div className="h-px flex-1 bg-gradient-to-r from-blue-200 to-transparent"></div>
                                </div>
                            </div>

                            {/* Question Text */}
                            <div className="mb-6 sm:mb-8">
                                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 leading-relaxed">
                                    {currentQuestion.question_text}
                                </h3>
                            </div>

                            {/* MCQ Options - Professional Exam Style */}
                            {currentQuestion.question_type === 'mcq' && currentQuestion.options ? (
                                <div className="space-y-3 sm:space-y-4">
                                    {currentQuestion.options.map((option, idx) => {
                                        const optionLetter = String.fromCharCode(65 + idx);
                                        const isSelected = userAnswers[currentQuestionIndex] === optionLetter;
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => handleAnswer(optionLetter)}
                                                className={`w-full text-left p-4 sm:p-5 border-2 rounded-xl transition-all duration-300 group ${isSelected
                                                    ? 'border-blue-600 bg-gradient-to-r from-blue-50 to-cyan-50 shadow-lg transform scale-[1.02] ring-2 ring-blue-200'
                                                    : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50/50 hover:shadow-md'
                                                    }`}
                                            >
                                                <div className="flex items-start gap-4">
                                                    {/* Option Letter Circle */}
                                                    <div className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center font-bold text-sm sm:text-base transition-all ${isSelected
                                                        ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-md'
                                                        : 'bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-700'
                                                        }`}>
                                                        {optionLetter}
                                                    </div>
                                                    {/* Option Text */}
                                                    <div className="flex-1 pt-1">
                                                        <span className={`text-sm sm:text-base leading-relaxed ${isSelected ? 'text-gray-900 font-medium' : 'text-gray-700'
                                                            }`}>
                                                            {option}
                                                        </span>
                                                    </div>
                                                    {/* Selection Indicator */}
                                                    {isSelected && (
                                                        <div className="flex-shrink-0 pt-1">
                                                            <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : null}
                        </div>

                        {/* Navigation - Professional Exam Style */}
                        <div className="bg-white border-2 border-gray-200 rounded-xl shadow-lg p-4 sm:p-6">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                                        disabled={currentQuestionIndex === 0}
                                        className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-all font-medium flex items-center gap-2 border border-gray-300"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                        <span className="hidden sm:inline">Previous</span>
                                    </button>
                                    <button
                                        onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
                                        disabled={currentQuestionIndex === questions.length - 1}
                                        className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-all font-medium flex items-center gap-2 border border-gray-300"
                                    >
                                        <span className="hidden sm:inline">Next</span>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="flex gap-3">
                                    {currentQuestionIndex === questions.length - 1 && (
                                        <button
                                            onClick={handleSubmit}
                                            className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span>Submit & Review</span>
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
                                        className="px-4 sm:px-6 py-2.5 sm:py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all font-medium flex items-center gap-2 border-2 border-red-600"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        <span className="hidden sm:inline">Exit</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar - Question Navigator - Exam Style */}
                    <div className="lg:col-span-1">
                        <div className="bg-white border-2 border-gray-200 rounded-xl shadow-lg p-4 sm:p-6 sticky top-4 sm:top-6">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                    </svg>
                                    Question Navigator
                                </h4>
                            </div>

                            {/* Stats */}
                            <div className="mb-4 p-3 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                                <div className="flex items-center justify-between text-xs mb-1">
                                    <span className="text-gray-600">Answered</span>
                                    <span className="font-bold text-blue-700">
                                        {Object.keys(userAnswers).filter(idx => userAnswers[parseInt(idx)]?.trim() !== '').length}/{questions.length}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                                    <div
                                        className="bg-gradient-to-r from-blue-500 to-cyan-500 h-1.5 rounded-full transition-all"
                                        style={{ width: `${(Object.keys(userAnswers).filter(idx => userAnswers[parseInt(idx)]?.trim() !== '').length / questions.length) * 100}%` }}
                                    />
                                </div>
                            </div>

                            {/* Question Grid */}
                            <div className="grid grid-cols-5 gap-2 mb-4 max-h-64 overflow-y-auto p-1">
                                {questions.map((_, idx) => {
                                    const isCurrent = currentQuestionIndex === idx;
                                    const isAnswered = idx in userAnswers && (userAnswers[idx]?.trim() !== '');

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => goToQuestion(idx)}
                                            className={`w-full aspect-square rounded-lg text-xs font-bold transition-all duration-300 transform hover:scale-110 ${isCurrent
                                                ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-lg ring-2 ring-blue-300 scale-110'
                                                : isAnswered
                                                    ? 'bg-gradient-to-br from-yellow-500 to-amber-500 text-white shadow-md hover:shadow-lg'
                                                    : 'bg-gray-100 text-gray-700 border-2 border-gray-300 hover:bg-gray-200 hover:border-blue-300 hover:shadow-md'
                                                }`}
                                            title={isAnswered ? `Question ${idx + 1} - Answered (Marked for Review)` : `Question ${idx + 1} - Not answered`}
                                        >
                                            {idx + 1}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Legend */}
                            <div className="pt-4 border-t-2 border-gray-200">
                                <p className="text-xs font-bold text-gray-700 mb-3">Status</p>
                                <div className="space-y-2 text-xs">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded bg-gradient-to-br from-blue-600 to-blue-500 flex-shrink-0 shadow-sm"></div>
                                        <span className="text-gray-600">Current</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded bg-gradient-to-br from-yellow-500 to-amber-500 flex-shrink-0 shadow-sm"></div>
                                        <span className="text-gray-600">Answered (Marked for Review)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded bg-gray-100 border-2 border-gray-300 flex-shrink-0"></div>
                                        <span className="text-gray-600">Not Answered</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <SubscriptionRequiredModal
                isOpen={showSubscriptionModal}
                onClose={() => setShowSubscriptionModal(false)}
                feature="premium technical practice"
            />
        </div>
    );
}