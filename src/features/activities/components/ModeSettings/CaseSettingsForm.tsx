import { useState } from 'react';
import type { CaseSettings, CaseScenario } from '@/types/activities';

interface ScenarioManager {
    scenarios: CaseScenario[];
    addScenario: (title: string, content: string) => void;
    removeScenario: (id: string) => void;
    updateScenario: (id: string, updates: Partial<CaseScenario>) => void;
    reset: () => void;
}

interface Props {
    values: CaseSettings;
    onChange: <K extends keyof CaseSettings>(key: K, value: CaseSettings[K]) => void;
    scenarioManager: ScenarioManager;
}

export function CaseSettingsForm({ values, onChange, scenarioManager }: Props) {
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');

    const handleAddScenario = () => {
        if (newTitle.trim() && newContent.trim()) {
            scenarioManager.addScenario(newTitle, newContent);
            setNewTitle('');
            setNewContent('');
        }
    };

    return (
        <div className="space-y-4">
            <h3 className="font-medium">Case Settings</h3>

            <div className="grid grid-cols-4 gap-4">
                <div>
                    <label htmlFor="case-time" className="block text-sm font-medium">
                        Time Per Case (min)
                    </label>
                    <input
                        id="case-time"
                        type="number"
                        value={values.timePerCase}
                        onChange={(e) => onChange('timePerCase', parseInt(e.target.value) || 1)}
                        min="1"
                        className="mt-1 block w-full rounded-md border-gray-300"
                    />
                </div>

                <div>
                    <label htmlFor="case-total-time" className="block text-sm font-medium">
                        Total Time Limit (min)
                    </label>
                    <input
                        id="case-total-time"
                        type="number"
                        value={values.totalTimeLimit}
                        onChange={(e) => onChange('totalTimeLimit', parseInt(e.target.value) || 1)}
                        min="1"
                        className="mt-1 block w-full rounded-md border-gray-300"
                    />
                </div>

                <div>
                    <label htmlFor="case-attempts" className="block text-sm font-medium">
                        Max Attempts
                    </label>
                    <input
                        id="case-attempts"
                        type="number"
                        value={values.maxAttempts}
                        onChange={(e) => onChange('maxAttempts', parseInt(e.target.value) || 1)}
                        min="1"
                        className="mt-1 block w-full rounded-md border-gray-300"
                    />
                </div>

                <div>
                    <label htmlFor="case-threshold" className="block text-sm font-medium">
                        Pass Threshold (0-10)
                    </label>
                    <input
                        id="case-threshold"
                        type="number"
                        value={values.passThreshold}
                        onChange={(e) => onChange('passThreshold', parseFloat(e.target.value) || 0)}
                        min="0"
                        max="10"
                        step="0.5"
                        className="mt-1 block w-full rounded-md border-gray-300"
                    />
                </div>
            </div>

            <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Case Scenarios</h4>

                {/* Existing scenarios */}
                <div className="space-y-2 mb-4">
                    {scenarioManager.scenarios.map((scenario) => (
                        <div key={scenario.id} className="p-3 bg-gray-50 rounded flex justify-between items-start">
                            <div>
                                <h5 className="font-medium">{scenario.title}</h5>
                                <p className="text-sm text-gray-600">{scenario.content}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => scenarioManager.removeScenario(scenario.id)}
                                aria-label="Delete"
                                className="text-red-500 hover:text-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    ))}
                </div>

                {/* Add scenario form */}
                <div className="space-y-2 p-3 border rounded">
                    <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="Scenario title..."
                        className="w-full p-2 border rounded"
                    />
                    <textarea
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                        placeholder="Scenario content..."
                        rows={3}
                        className="w-full p-2 border rounded"
                    />
                    <button
                        type="button"
                        onClick={handleAddScenario}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Add Scenario
                    </button>
                </div>
            </div>
        </div>
    );
}
