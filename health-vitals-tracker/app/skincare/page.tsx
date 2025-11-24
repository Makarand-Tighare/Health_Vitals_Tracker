'use client';

import { useEffect, useMemo, useState } from 'react';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/contexts/AuthContext';

type RoutineMoment = 'morning' | 'evening' | 'night' | 'any';

interface SkincareStep {
  id: string;
  name: string;
  goal: string;
  moment: RoutineMoment;
  frequency: 'daily' | 'alternate' | 'weekly';
  instructions?: string[];
  caution?: string;
  source?: 'ai' | 'manual';
}

interface SkincareLogMap {
  [date: string]: {
    [stepId: string]: {
      completed: boolean;
      note?: string;
    };
  };
}

const ROUTINES_KEY = 'hv_skincare_routines';
const LOGS_KEY = 'hv_skincare_logs';
const ALT_TRACKER_KEY = 'hv_skincare_alt_tracker';
const ALT_ROTATION_KEY = 'hv_skincare_alt_rotation';

const getToday = () => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

export default function SkincarePage() {
  const { user, loading: authLoading } = useAuth();
  const [steps, setSteps] = useState<SkincareStep[]>([]);
  const [logs, setLogs] = useState<SkincareLogMap>({});
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [stepForm, setStepForm] = useState({
    name: '',
    goal: '',
    moment: 'any' as RoutineMoment,
    frequency: 'daily' as SkincareStep['frequency'],
  });
  const [addingStep, setAddingStep] = useState(false);
  const [evaluation, setEvaluation] = useState<{
    verdict: string;
    positives: string[];
    gaps: string[];
    suggestions: { title: string; detail: string }[];
  } | null>(null);
  const [evaluationLoading, setEvaluationLoading] = useState(false);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  const [altTracker, setAltTracker] = useState<Record<string, string>>({});
  const [altRotation, setAltRotation] = useState<Record<RoutineMoment, string>>({
    morning: '',
    evening: '',
    night: '',
    any: '',
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedSteps = localStorage.getItem(ROUTINES_KEY);
    const storedLogs = localStorage.getItem(LOGS_KEY);
    const storedAlt = localStorage.getItem(ALT_TRACKER_KEY);
    const storedRotation = localStorage.getItem(ALT_ROTATION_KEY);

    if (storedSteps) {
      try {
        const parsed = JSON.parse(storedSteps);
        const normalized: SkincareStep[] = Array.isArray(parsed)
          ? parsed.map((step) => ({
              ...step,
              instructions: step.instructions || [],
              caution: step.caution || undefined,
              source: step.source || 'manual',
            }))
          : [];
        setSteps(normalized);
      } catch (error) {
        console.error('Failed to parse skincare routines', error);
      }
    }

    if (storedLogs) {
      try {
        setLogs(JSON.parse(storedLogs));
      } catch (error) {
        console.error('Failed to parse skincare logs', error);
      }
    }

    if (storedAlt) {
      try {
        setAltTracker(JSON.parse(storedAlt));
      } catch (error) {
        console.error('Failed to parse alternate tracker', error);
      }
    }

    if (storedRotation) {
      try {
        const parsed = JSON.parse(storedRotation);
        setAltRotation(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Failed to parse alternate rotation', error);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ROUTINES_KEY, JSON.stringify(steps));
  }, [steps]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ALT_TRACKER_KEY, JSON.stringify(altTracker));
  }, [altTracker]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ALT_ROTATION_KEY, JSON.stringify(altRotation));
  }, [altRotation]);

  const handleAddStep = () => {
    if (!stepForm.name.trim()) {
      alert('Please enter a product or routine name.');
      return;
    }

    const baseStep: SkincareStep = {
      id: `sk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      ...stepForm,
      name: stepForm.name.trim(),
      goal: stepForm.goal.trim() || 'Healthy skin habit',
      source: 'manual',
    };

    const userMoment = stepForm.moment;
    const addStepWithInsight = (insight?: {
      goal?: string;
      idealMoments?: RoutineMoment[];
      frequency?: SkincareStep['frequency'];
      instructions?: string[];
      caution?: string;
    }) => {
      const aiMoment = insight?.idealMoments?.[0];
      const resolvedMoment =
        userMoment !== 'any'
          ? userMoment
          : aiMoment || baseStep.moment;

      const newStep: SkincareStep = {
        ...baseStep,
        goal: insight?.goal || baseStep.goal,
        moment: resolvedMoment,
        frequency: insight?.frequency || baseStep.frequency,
        instructions: insight?.instructions || [],
        caution: insight?.caution,
        source: insight ? 'ai' : 'manual',
      };
      setSteps(prev => [...prev, newStep]);
    };

    const run = async () => {
      setAddingStep(true);
      try {
        const response = await fetch('/api/analyze-skincare-product', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productName: baseStep.name }),
        });
        const data = await response.json();
        if (!response.ok || data.error) {
          throw new Error(data.error || 'AI analysis failed');
        }
        addStepWithInsight(data.insight);
      } catch (error) {
        console.warn('Skincare AI analysis failed:', error);
        addStepWithInsight();
      } finally {
        setAddingStep(false);
        setStepForm({
          name: '',
          goal: '',
          moment: 'any',
          frequency: 'daily',
        });
      }
    };

    run();
  };

  const handleRemoveStep = (stepId: string) => {
    const stepToRemove = steps.find(step => step.id === stepId);
    if (!confirm('Remove this skincare step?')) return;
    setSteps(prev => prev.filter(step => step.id !== stepId));
    setLogs(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(date => {
        if (updated[date][stepId]) {
          const { [stepId]: _removed, ...rest } = updated[date];
          updated[date] = rest;
        }
      });
      return updated;
    });
    setAltTracker(prev => {
      const { [stepId]: _removed, ...rest } = prev;
      return rest;
    });
    if (stepToRemove) {
      setAltRotation(prev => {
        if (prev[stepToRemove.moment] === stepId) {
          return { ...prev, [stepToRemove.moment]: '' };
        }
        return prev;
      });
    }
  };

  const handleToggleStep = (stepId: string, completed: boolean) => {
    const step = steps.find(s => s.id === stepId);
    setLogs(prev => {
      const dayLog = prev[selectedDate] || {};
      return {
        ...prev,
        [selectedDate]: {
          ...dayLog,
          [stepId]: {
            ...dayLog[stepId],
            completed,
          },
        },
      };
    });

    if (completed) {
      setAltTracker(prev => ({
        ...prev,
        [stepId]: selectedDate,
      }));
      if (step && step.frequency === 'alternate') {
        setAltRotation(prev => ({
          ...prev,
          [step.moment]: stepId,
        }));
      }
    }
  };

  const handleNoteChange = (stepId: string, note: string) => {
    setLogs(prev => {
      const dayLog = prev[selectedDate] || {};
      return {
        ...prev,
        [selectedDate]: {
          ...dayLog,
          [stepId]: {
            completed: dayLog[stepId]?.completed ?? false,
            note,
          },
        },
      };
    });
  };

  const groupedSteps = useMemo(() => {
    return {
      morning: steps.filter(step => step.moment === 'morning'),
      evening: steps.filter(step => step.moment === 'evening'),
      night: steps.filter(step => step.moment === 'night'),
      any: steps.filter(step => step.moment === 'any'),
    };
  }, [steps]);

  const suggestedAlternateByMoment = useMemo(() => {
    const result: Record<RoutineMoment, string | null> = {
      morning: null,
      evening: null,
      night: null,
      any: null,
    };
    (['morning', 'evening', 'night', 'any'] as RoutineMoment[]).forEach(moment => {
      const list = groupedSteps[moment];
      if (list.length === 0) {
        result[moment] = null;
        return;
      }
      result[moment] = getSuggestedAlternateId(moment, list);
    });
    return result;
  }, [groupedSteps, altRotation, altTracker, selectedDate]);

  const activeAlternateIds = useMemo(() => {
    return new Set(
      (['morning', 'evening', 'night', 'any'] as RoutineMoment[])
        .map(moment => suggestedAlternateByMoment[moment])
        .filter((id): id is string => Boolean(id))
    );
  }, [suggestedAlternateByMoment]);

  const stepsCompleted = useMemo(() => {
    const dayLog = logs[selectedDate] || {};
    let total = 0;
    let completed = 0;
    steps.forEach(step => {
      const isActive =
        step.frequency !== 'alternate' || activeAlternateIds.has(step.id);
      if (!isActive) {
        return;
      }
      total += 1;
      if (dayLog[step.id]?.completed) {
        completed += 1;
      }
    });
    return { completed, total };
  }, [logs, steps, selectedDate, activeAlternateIds]);

  function getSuggestedAlternateId(moment: RoutineMoment, list: SkincareStep[]) {
    const alternates = list.filter(step => step.frequency === 'alternate');
    if (alternates.length === 0) return null;
    const available = alternates.filter(step => altTracker[step.id] !== selectedDate);
    const candidates = available.length ? available : alternates;
    const lastUsedId = altRotation[moment];
    if (!lastUsedId) {
      return candidates[0]?.id || null;
    }
    const idx = candidates.findIndex(step => step.id === lastUsedId);
    if (idx === -1) {
      return candidates[0]?.id || null;
    }
    return candidates[(idx + 1) % candidates.length]?.id || candidates[0]?.id || null;
  }

  const getLastUsedLabel = (stepId: string) => {
    const date = altTracker[stepId];
    if (!date) return 'Not logged yet';
    if (date === selectedDate) return 'Used today';
    return `Last used ${date}`;
  };

  const handleEvaluateRoutine = async () => {
    if (steps.length === 0) {
      alert('Add routines before requesting evaluation.');
      return;
    }
    setEvaluationLoading(true);
    setEvaluationError(null);
    try {
      const response = await fetch('/api/evaluate-skincare-routine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          steps: steps.map(step => ({
            name: step.name,
            moment: step.moment,
            frequency: step.frequency,
          })),
        }),
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to evaluate routine');
      }
      setEvaluation(data.evaluation);
    } catch (error) {
      console.error('Routine evaluation failed:', error);
      setEvaluationError(error instanceof Error ? error.message : 'Unable to evaluate routine right now.');
    } finally {
      setEvaluationLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 via-white to-amber-50">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 py-4 sm:py-8">
        <div className="mx-auto max-w-6xl px-3 sm:px-4 space-y-6 sm:space-y-8">
          <header className="rounded-2xl bg-gradient-to-br from-orange-200 via-orange-50 to-white p-6 sm:p-8 border border-orange-100 shadow-sm">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Skincare Tracker</h1>
            <p className="mt-2 text-sm sm:text-base text-gray-700">
              Build consistent routines, log products, and check in daily to see what keeps your skin glowing.
            </p>
          </header>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">Routine Library</h2>
              <p className="text-sm text-gray-600 mt-1">List each product or ritual you want to follow.</p>

              <div className="mt-4 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Product / Step</label>
                  <input
                    type="text"
                    value={stepForm.name}
                    onChange={(e) => setStepForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Vitamin C serum"
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Goal / Benefit</label>
                  <textarea
                    value={stepForm.goal}
                    onChange={(e) => setStepForm(prev => ({ ...prev, goal: e.target.value }))}
                    placeholder="Brighten complexion, reduce inflammation..."
                    rows={2}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">When</label>
                    <select
                      value={stepForm.moment}
                      onChange={(e) => setStepForm(prev => ({ ...prev, moment: e.target.value as RoutineMoment }))}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="morning">Morning</option>
                      <option value="evening">Evening</option>
                      <option value="night">Night</option>
                      <option value="any">Anytime</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Frequency</label>
                    <select
                      value={stepForm.frequency}
                      onChange={(e) => setStepForm(prev => ({ ...prev, frequency: e.target.value as SkincareStep['frequency'] }))}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="daily">Daily</option>
                      <option value="alternate">Alternate days</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAddStep}
                  disabled={addingStep}
                  className="w-full rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 transition-colors disabled:opacity-60"
                >
                  {addingStep ? 'Analyzing product...' : 'Add with AI insight'}
                </button>
              </div>

              {steps.length > 0 ? (
                <div className="mt-6 space-y-3">
                  {steps.map(step => (
                    <div key={step.id} className="rounded-lg border border-gray-200 p-3 shadow-sm bg-white">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{step.name}</p>
                          <p className="text-xs text-gray-600">{step.goal}</p>
                          <div className="mt-1 flex flex-wrap gap-2 text-xs">
                            <span className="rounded-full bg-orange-100 text-orange-800 px-2 py-0.5 capitalize">{step.moment}</span>
                            <span className="rounded-full bg-gray-100 text-gray-800 px-2 py-0.5 capitalize">{step.frequency}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveStep(step.id)}
                          className="text-xs text-red-500 hover:text-red-700 font-semibold"
                        >
                          Remove
                        </button>
                      </div>
                      {step.instructions && step.instructions.length > 0 && (
                        <ul className="mt-2 list-disc list-inside text-xs text-gray-600 space-y-1">
                          {step.instructions.map((ins, index) => (
                            <li key={`${step.id}-inst-${index}`}>{ins}</li>
                          ))}
                        </ul>
                      )}
                      {step.caution && (
                        <p className="mt-2 text-xs text-red-600">⚠️ {step.caution}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-gray-600 italic">No steps saved yet. Start by adding your routine above.</p>
              )}
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Daily Follow-up</h2>
                  <p className="text-sm text-gray-600">Check off what you actually completed.</p>
                </div>
                <input
                  type="date"
                  value={selectedDate}
                  max={getToday()}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {steps.length === 0 ? (
                <p className="mt-4 text-sm text-gray-600 italic">Add steps to your routine to start tracking.</p>
              ) : (
                <>
                  <div className="mt-4 rounded-lg bg-orange-50 border border-orange-100 p-3 text-sm text-orange-900">
                    {stepsCompleted.total === 0 ? 'No steps yet.' : (
                      <>
                        <span className="font-semibold">{stepsCompleted.completed}/{stepsCompleted.total}</span> steps completed today.
                      </>
                    )}
                  </div>

                  <div className="mt-4 space-y-4">
                    {(['morning', 'evening', 'night', 'any'] as RoutineMoment[]).map(moment => {
                      const list = groupedSteps[moment];
                      if (list.length === 0) return null;
                      const suggestedAlternateId = suggestedAlternateByMoment[moment];
                      return (
                        <div key={moment} className="rounded-lg border border-gray-100 p-3">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-gray-900 capitalize">
                              {moment === 'any' ? 'Anytime' : `${moment} routine`}
                            </p>
                            <span className="text-xs text-gray-500">{list.length} step{list.length > 1 ? 's' : ''}</span>
                          </div>

                          <div className="mt-3 space-y-3">
                            {list.map(step => {
                              const dayLog = logs[selectedDate] || {};
                              const entry = dayLog[step.id];
                              const isAlternate = step.frequency === 'alternate';
                              const highlightAlternate = isAlternate && step.id === suggestedAlternateId;

                              return (
                                <div key={`${moment}-${step.id}`} className="rounded-md border border-gray-200 p-3 bg-white shadow-sm">
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <p className="text-sm font-semibold text-gray-900">{step.name}</p>
                                      <p className="text-xs text-gray-600">{step.goal}</p>
                                      {isAlternate && (
                                        <p className="text-[11px] text-gray-500 mt-1">{getLastUsedLabel(step.id)}</p>
                                      )}
                                    </div>
                                    <label className={`inline-flex items-center gap-2 text-sm ${highlightAlternate ? 'text-orange-700 font-semibold' : 'text-gray-700'}`}>
                                      <input
                                        type="checkbox"
                                        checked={entry?.completed || false}
                                        onChange={(e) => handleToggleStep(step.id, e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                      />
                                      {highlightAlternate ? 'Use tonight' : 'Done'}
                                    </label>
                                  </div>
                                  <textarea
                                    placeholder="Note: glow, irritation, skipped reason..."
                                    value={entry?.note || ''}
                                    onChange={(e) => handleNoteChange(step.id, e.target.value)}
                                    rows={2}
                                    className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-700 focus:ring-1 focus:ring-orange-500"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </section>

          {steps.length > 0 && (
            <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">AI routine check</h2>
                  <p className="text-sm text-gray-600">Let AI flag missing sunscreen, over-exfoliation, or frequency conflicts.</p>
                </div>
                <button
                  type="button"
                  onClick={handleEvaluateRoutine}
                  disabled={evaluationLoading}
                  className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
                >
                  {evaluationLoading ? 'Evaluating...' : 'Review my routine'}
                </button>
              </div>
              {evaluationError && (
                <p className="text-sm text-red-600">{evaluationError}</p>
              )}
              {evaluation && (
                <div className="space-y-4">
                  <div className="rounded-lg border border-gray-100 bg-orange-50/60 p-3">
                    <p className="text-sm font-semibold text-gray-900">{evaluation.verdict}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-lg border border-green-100 bg-green-50 p-3">
                      <p className="text-sm font-semibold text-green-900 mb-2">Positives</p>
                      <ul className="list-disc list-inside text-sm text-green-800 space-y-1">
                        {evaluation.positives.map((item, index) => (
                          <li key={`positive-${index}`}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-lg border border-red-100 bg-red-50 p-3">
                      <p className="text-sm font-semibold text-red-900 mb-2">Gaps</p>
                      <ul className="list-disc list-inside text-sm text-red-800 space-y-1">
                        {evaluation.gaps.map((item, index) => (
                          <li key={`gap-${index}`}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  {evaluation.suggestions.length > 0 && (
                    <div className="rounded-lg border border-gray-100 p-3">
                      <p className="text-sm font-semibold text-gray-900 mb-2">Suggested tweaks</p>
                      <div className="space-y-2">
                        {evaluation.suggestions.map((suggestion, index) => (
                          <div key={`suggestion-${index}`} className="border border-gray-200 rounded-md p-2">
                            <p className="text-sm font-semibold text-gray-900">{suggestion.title}</p>
                            <p className="text-sm text-gray-600">{suggestion.detail}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Skin journal</h2>
            <p className="text-sm text-gray-600">Capture quick notes about breakouts, glow days, or reactions.</p>
            <p className="mt-4 text-sm text-gray-500">
              Tip: Add a short note after your evening routine if something felt off or amazing. Reviewing patterns weekly helps adjust products with confidence.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}

