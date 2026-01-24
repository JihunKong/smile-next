interface Props {
    values: {
        aiRatingEnabled: boolean;
        allowAnonymous: boolean;
        hideUsernames: boolean;
        isPublished: boolean;
    };
    onChange: (field: string, value: boolean) => void;
}

interface ToggleItemProps {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}

function ToggleItem({ label, checked, onChange }: ToggleItemProps) {
    return (
        <label className="flex items-center justify-between py-2">
            <span className="text-sm">{label}</span>
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="rounded"
            />
        </label>
    );
}

export function GeneralSettings({ values, onChange }: Props) {
    return (
        <div className="space-y-2">
            <h3 className="font-medium text-sm mb-2">General Settings</h3>
            <ToggleItem
                label="AI Rating"
                checked={values.aiRatingEnabled}
                onChange={(checked) => onChange('aiRatingEnabled', checked)}
            />
            <ToggleItem
                label="Allow Anonymous Questions"
                checked={values.allowAnonymous}
                onChange={(checked) => onChange('allowAnonymous', checked)}
            />
            <ToggleItem
                label="Hide Usernames"
                checked={values.hideUsernames}
                onChange={(checked) => onChange('hideUsernames', checked)}
            />
            <ToggleItem
                label="Publish Activity"
                checked={values.isPublished}
                onChange={(checked) => onChange('isPublished', checked)}
            />
        </div>
    );
}
