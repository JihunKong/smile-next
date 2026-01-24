interface Props {
    values: {
        name: string;
        description: string;
        visible: boolean;
    };
    onChange: (field: string, value: string | boolean) => void;
    errors?: Record<string, string>;
}

export function BasicInfoFields({ values, onChange, errors }: Props) {
    return (
        <div className="space-y-4">
            <div>
                <label htmlFor="activity-name" className="block text-sm font-medium">
                    Activity Name
                </label>
                <input
                    id="activity-name"
                    name="name"
                    value={values.name}
                    onChange={(e) => onChange('name', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300"
                    placeholder="Enter activity name..."
                    required
                    maxLength={200}
                />
                {errors?.name && <p className="text-red-500 text-sm">{errors.name}</p>}
            </div>

            <div>
                <label htmlFor="activity-description" className="block text-sm font-medium">
                    Description
                </label>
                <textarea
                    id="activity-description"
                    value={values.description}
                    onChange={(e) => onChange('description', e.target.value)}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300"
                    maxLength={1000}
                />
            </div>

            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    checked={values.visible}
                    onChange={(e) => onChange('visible', e.target.checked)}
                />
                <label>Visible to students</label>
            </div>
        </div>
    );
}
