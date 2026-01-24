import { useState } from 'react';
import type { InquirySettings } from '@/types/activities';

interface KeywordManager {
    pool1: string[];
    pool2: string[];
    addKeyword: (pool: 1 | 2, keyword: string) => void;
    removeKeyword: (pool: 1 | 2, index: number) => void;
    reset: () => void;
}

interface Props {
    values: InquirySettings;
    onChange: <K extends keyof InquirySettings>(key: K, value: InquirySettings[K]) => void;
    keywordManager: KeywordManager;
}

interface KeywordPoolProps {
    title: string;
    keywords: string[];
    placeholder: string;
    onAdd: (keyword: string) => void;
    onRemove: (index: number) => void;
}

function KeywordPool({ title, keywords, placeholder, onAdd, onRemove }: KeywordPoolProps) {
    const [inputValue, setInputValue] = useState('');

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && inputValue.trim()) {
            onAdd(inputValue);
            setInputValue('');
        }
    };

    return (
        <div className="space-y-2">
            <h4 className="text-sm font-medium">{title}</h4>
            <div className="flex flex-wrap gap-2">
                {keywords.map((keyword, index) => (
                    <span key={index} className="bg-gray-100 px-2 py-1 rounded text-sm flex items-center gap-1">
                        {keyword}
                        <button
                            type="button"
                            onClick={() => onRemove(index)}
                            aria-label="Remove"
                            className="text-red-500 hover:text-red-700"
                        >
                            ×
                        </button>
                    </span>
                ))}
            </div>
            <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="w-full p-2 border rounded"
            />
        </div>
    );
}

export function InquirySettingsForm({ values, onChange, keywordManager }: Props) {
    return (
        <div className="space-y-4">
            <h3 className="font-medium">Inquiry Settings</h3>

            <div className="grid grid-cols-3 gap-4">
                <div>
                    <label htmlFor="inquiry-questions" className="block text-sm font-medium">
                        Questions Required
                    </label>
                    <input
                        id="inquiry-questions"
                        type="number"
                        value={values.questionsRequired}
                        onChange={(e) => onChange('questionsRequired', parseInt(e.target.value) || 1)}
                        min="1"
                        className="mt-1 block w-full rounded-md border-gray-300"
                    />
                </div>

                <div>
                    <label htmlFor="inquiry-time" className="block text-sm font-medium">
                        Time Per Question (sec)
                    </label>
                    <input
                        id="inquiry-time"
                        type="number"
                        value={values.timePerQuestion}
                        onChange={(e) => onChange('timePerQuestion', parseInt(e.target.value) || 60)}
                        min="30"
                        className="mt-1 block w-full rounded-md border-gray-300"
                    />
                </div>

                <div>
                    <label htmlFor="inquiry-threshold" className="block text-sm font-medium">
                        Pass Threshold (0-10)
                    </label>
                    <input
                        id="inquiry-threshold"
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

            <div className="grid grid-cols-2 gap-4">
                <KeywordPool
                    title="Concept Keywords"
                    keywords={keywordManager.pool1}
                    placeholder="Add concept keyword..."
                    onAdd={(keyword) => keywordManager.addKeyword(1, keyword)}
                    onRemove={(index) => keywordManager.removeKeyword(1, index)}
                />

                <KeywordPool
                    title="Action Keywords"
                    keywords={keywordManager.pool2}
                    placeholder="Add action keyword..."
                    onAdd={(keyword) => keywordManager.addKeyword(2, keyword)}
                    onRemove={(index) => keywordManager.removeKeyword(2, index)}
                />
            </div>
        </div>
    );
}
