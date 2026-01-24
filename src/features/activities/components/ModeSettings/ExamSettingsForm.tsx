import type { ExamSettings } from '@/types/activities';

interface Props {
    values: ExamSettings;
    onChange: <K extends keyof ExamSettings>(key: K, value: ExamSettings[K]) => void;
}

export function ExamSettingsForm({ values, onChange }: Props) {
    return (
        <div className="space-y-4">
            <h3 className="font-medium">Exam Settings</h3>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="exam-time-limit" className="block text-sm font-medium">
                        Time Limit (minutes)
                    </label>
                    <input
                        id="exam-time-limit"
                        type="number"
                        value={values.timeLimit}
                        onChange={(e) => onChange('timeLimit', parseInt(e.target.value) || 1)}
                        min="1"
                        className="mt-1 block w-full rounded-md border-gray-300"
                    />
                </div>

                <div>
                    <label htmlFor="exam-questions-show" className="block text-sm font-medium">
                        Questions to Show
                    </label>
                    <input
                        id="exam-questions-show"
                        type="number"
                        value={values.questionsToShow}
                        onChange={(e) => onChange('questionsToShow', parseInt(e.target.value) || 1)}
                        min="1"
                        className="mt-1 block w-full rounded-md border-gray-300"
                    />
                </div>

                <div>
                    <label htmlFor="exam-pass-threshold" className="block text-sm font-medium">
                        Pass Threshold (%)
                    </label>
                    <input
                        id="exam-pass-threshold"
                        type="number"
                        value={values.passThreshold}
                        onChange={(e) => onChange('passThreshold', parseInt(e.target.value) || 0)}
                        min="0"
                        max="100"
                        className="mt-1 block w-full rounded-md border-gray-300"
                    />
                </div>

                <div>
                    <label htmlFor="exam-max-attempts" className="block text-sm font-medium">
                        Max Attempts
                    </label>
                    <input
                        id="exam-max-attempts"
                        type="number"
                        value={values.maxAttempts}
                        onChange={(e) => onChange('maxAttempts', parseInt(e.target.value) || 1)}
                        min="1"
                        className="mt-1 block w-full rounded-md border-gray-300"
                    />
                </div>
            </div>

            <div className="flex gap-6">
                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="exam-shuffle-questions"
                        checked={values.shuffleQuestions}
                        onChange={(e) => onChange('shuffleQuestions', e.target.checked)}
                    />
                    <span className="text-sm">Shuffle Questions</span>
                </label>

                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="exam-shuffle-choices"
                        checked={values.shuffleChoices}
                        onChange={(e) => onChange('shuffleChoices', e.target.checked)}
                    />
                    <span className="text-sm">Shuffle Choices</span>
                </label>
            </div>
        </div>
    );
}
