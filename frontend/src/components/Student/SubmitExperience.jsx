import React, { useState, useEffect } from 'react';
import { experienceAPI } from '../../api';

const SubmitExperience = () => {
  const [step, setStep] = useState(1);
  const defaultFormData = {
    company_name: '',
    role_applied: '',
    drive_id: '', // Optional, can be selected from dropdown if drives exist
    result: 'pass',
    selected: false,
    offer_received: false,
    ctc_offered: '',
    interview_duration: '',
    overall_difficulty: 'medium',
    overall_feedback: '',
    confidence_level: 5,
    is_anonymous: false,
    rounds: [] // Array of round objects
  };

  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('experienceDraft');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return defaultFormData;
  });

  useEffect(() => {
    localStorage.setItem('experienceDraft', JSON.stringify(formData));
  }, [formData]);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Helper to add a new round
  const addRound = () => {
    setFormData(prev => ({
      ...prev,
      rounds: [
        ...prev.rounds,
        {
          round_number: prev.rounds.length + 1,
          round_type: 'Technical',
          duration_minutes: '',
          difficulty_level: 'medium',
          topics: [], // We can make this a comma separated string input for simplicity
          questions_list: [] // Array of question objects
        }
      ]
    }));
  };

  // Helper to update round data
  const updateRound = (index, field, value) => {
    const newRounds = [...formData.rounds];
    newRounds[index][field] = value;
    setFormData(prev => ({ ...prev, rounds: newRounds }));
  };

  // Helper to add question to a round
  const addQuestion = (roundIndex) => {
    const newRounds = [...formData.rounds];
    newRounds[roundIndex].questions_list.push({
      question_text: '',
      difficulty: 'medium',
      category: ''
    });
    setFormData(prev => ({ ...prev, rounds: newRounds }));
  };

  // Helper to update question data
  const updateQuestion = (roundIndex, questionIndex, field, value) => {
    const newRounds = [...formData.rounds];
    newRounds[roundIndex].questions_list[questionIndex][field] = value;
    setFormData(prev => ({ ...prev, rounds: newRounds }));
  };

  // Helper to remove round
  const removeRound = (index) => {
    const newRounds = formData.rounds.filter((_, i) => i !== index);
    // Re-index round numbers
    newRounds.forEach((r, i) => r.round_number = i + 1);
    setFormData(prev => ({ ...prev, rounds: newRounds }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      // Sanitize drive_id — send null if not set (backend requires int or null)
      const payload = {
        ...formData,
        drive_id: formData.drive_id ? parseInt(formData.drive_id) : null,
        ctc_offered: formData.ctc_offered ? parseFloat(formData.ctc_offered) : null,
        confidence_level: formData.confidence_level ? parseInt(formData.confidence_level) : null,
        interview_duration: formData.interview_duration ? parseInt(formData.interview_duration) : null,
      };
      await experienceAPI.submit(payload);
      localStorage.removeItem('experienceDraft');
      setSuccess(true);
    } catch (err) {
      const resp = err.response?.data;
      let msg = resp?.message || err.message || 'Submission failed';
      if (resp?.errors && Array.isArray(resp.errors)) {
        const details = resp.errors.map(e => `${e.field}: ${e.message}`).join('; ');
        msg += ` (${details})`;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Helper to render steps using switch
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="animate-fade-in-up">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Basic Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Company Name *</label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Role Applied *</label>
                <input
                  type="text"
                  name="role_applied"
                  value={formData.role_applied}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Interview Result *</label>
                <select
                  name="result"
                  value={formData.result}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all bg-white"
                >
                  <option value="pass">Selected</option>
                  <option value="fail">Rejected</option>
                  <option value="not_sure">Waiting for Result</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">CTC Offered (LPA)</label>
                <input
                  type="number"
                  name="ctc_offered"
                  value={formData.ctc_offered}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  placeholder="e.g. 12.5"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  name="is_anonymous"
                  checked={formData.is_anonymous}
                  onChange={handleChange}
                  className="w-5 h-5 text-primary rounded border-gray-300 focus:ring-primary"
                />
                <span className="text-gray-700 group-hover:text-primary transition-colors">Submit Anonymously</span>
              </label>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="animate-fade-in-up">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Interview Rounds</h3>
            <div className="space-y-6">
              {formData.rounds.map((round, rIndex) => (
                <div key={rIndex} className="bg-gray-50 border border-gray-200 rounded-xl p-6 relative group hover:shadow-md transition-all">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-bold text-gray-800 bg-white px-3 py-1 rounded-full text-sm border border-gray-200">
                      Round {round.round_number}
                    </span>
                    <button
                      onClick={() => removeRound(rIndex)}
                      className="text-red-500 text-sm font-medium hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded-lg transition-colors"
                    >
                      Remove Round
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Round Type</label>
                      <select
                        value={round.round_type}
                        onChange={(e) => updateRound(rIndex, 'round_type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white"
                      >
                        <option value="Technical">Technical</option>
                        <option value="HR">HR</option>
                        <option value="Coding">Coding</option>
                        <option value="Managerial">Managerial</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Difficulty</label>
                      <select
                        value={round.difficulty_level}
                        onChange={(e) => updateRound(rIndex, 'difficulty_level', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                  </div>

                  {/* Questions Section */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Questions asked</h4>
                    <div className="space-y-3">
                      {round.questions_list.map((q, qIndex) => (
                        <div key={qIndex} className="flex gap-3 items-start animate-fade-in">
                          <div className="flex-1">
                            <input
                              type="text"
                              placeholder="Type the question here..."
                              value={q.question_text}
                              onChange={(e) => updateQuestion(rIndex, qIndex, 'question_text', e.target.value)}
                              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm"
                            />
                          </div>
                          <div className="w-32">
                            <select
                              value={q.difficulty}
                              onChange={(e) => updateQuestion(rIndex, qIndex, 'difficulty', e.target.value)}
                              className="w-full px-2 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-primary focus:border-primary"
                            >
                              <option value="easy">Easy</option>
                              <option value="medium">Medium</option>
                              <option value="hard">Hard</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => addQuestion(rIndex)}
                      className="mt-3 text-sm text-primary font-medium hover:text-indigo-700 flex items-center gap-1 transition-colors"
                    >
                      <span className="text-lg leading-none">+</span> Add Question
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center mt-8">
              <button
                onClick={addRound}
                className="flex items-center gap-2 px-6 py-3 border-2 border-dashed border-primary text-primary rounded-xl hover:bg-indigo-50 transition-all font-medium"
              >
                <span className="text-xl leading-none">+</span> Add Round
              </button>
            </div>
            {formData.rounds.length === 0 && (
              <p className="text-center text-gray-400 italic mt-4">No rounds added yet. Add a round to continue.</p>
            )}
          </div>
        );

      case 3:
        return (
          <div className="animate-fade-in-up">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Overall Feedback</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Your Overall Experience</label>
                <textarea
                  name="overall_feedback"
                  value={formData.overall_feedback}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none shadow-sm"
                  rows="6"
                  placeholder="Share your overall experience, tips for juniors, and what you learned..."
                ></textarea>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">Overall Difficulty</label>
                <div className="flex gap-4">
                  {['easy', 'medium', 'hard'].map(level => (
                    <label key={level} className={`
                      flex-1 relative flex items-center justify-center gap-2 p-4 cursor-pointer rounded-xl border-2 transition-all
                      ${formData.overall_difficulty === level
                        ? 'border-primary bg-indigo-50 text-primary'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'}
                    `}>
                      <input
                        type="radio"
                        name="overall_difficulty"
                        value={level}
                        checked={formData.overall_difficulty === level}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <span className="capitalize font-medium">{level}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (success) {
    return (
      <div className="max-w-xl mx-auto mt-10 p-8 bg-white rounded-2xl shadow-xl text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl text-green-600">✓</span>
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-3">Submitted Successfully!</h2>
        <p className="text-gray-600 mb-8">Thank you for sharing your experience. It will be live after admin approval.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-8 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-200"
        >
          Submit Another
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto my-8 p-8 bg-white rounded-2xl shadow-xl font-sans">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Submit Experience</h2>
        <p className="text-gray-500">Share your interview journey to help juniors prepare better</p>
      </div>

      <div className="relative flex justify-between mb-12 max-w-2xl mx-auto">
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-100 -translate-y-1/2 z-0"></div>
        <div
          className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 z-0 transition-all duration-500"
          style={{ width: `${((step - 1) / 2) * 100}%` }}
        ></div>

        {[1, 2, 3].map((s) => (
          <div key={s} className="relative z-10 flex flex-col items-center">
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-4 transition-all duration-300
              ${step >= s
                ? 'bg-primary border-white text-white shadow-lg'
                : 'bg-white border-gray-100 text-gray-400'}
            `}>
              {s}
            </div>
            <div className={`
              mt-2 text-xs font-semibold uppercase tracking-wider transition-colors duration-300
              ${step >= s ? 'text-primary' : 'text-gray-400'}
            `}>
              {s === 1 ? 'Basic Info' : s === 2 ? 'Rounds' : 'Feedback'}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-8 border border-red-100 flex items-center gap-3">
          <span className="text-xl">!</span>
          {error}
        </div>
      )}

      {renderStep()}

      <div className="flex justify-between mt-12 pt-6 border-t border-gray-100">
        {step > 1 ? (
          <button
            onClick={() => setStep(s => s - 1)}
            className="px-6 py-3 text-gray-600 font-semibold hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all"
          >
            Back
          </button>
        ) : <div></div>}

        {step < 3 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            className="px-8 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5"
          >
            Next Step
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`
              px-8 py-3 bg-primary text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5
              ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-indigo-700'}
            `}
          >
            {loading ? 'Submitting...' : 'Submit Experience'}
          </button>
        )}
      </div>
    </div>
  );
};

export default SubmitExperience;