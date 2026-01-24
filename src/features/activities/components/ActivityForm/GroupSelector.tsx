interface GroupOption {
    id: string;
    name: string;
    role: number;
}

interface Props {
    groups: GroupOption[];
    selectedGroupId: string;
    onGroupChange: (groupId: string) => void;
    isLoading?: boolean;
    error?: string | null;
}

const getRoleLabel = (role: number): string => {
    switch (role) {
        case 3:
            return 'Owner';
        case 2:
            return 'Co-Owner';
        case 1:
            return 'Admin';
        default:
            return 'Member';
    }
};

export function GroupSelector({ groups, selectedGroupId, onGroupChange, isLoading, error }: Props) {
    if (isLoading) {
        return <p className="text-gray-500 text-sm">Loading groups...</p>;
    }

    if (!groups.length) {
        return (
            <p className="text-gray-500 text-sm">
                You don&apos;t have permission to create activities in any groups.
            </p>
        );
    }

    return (
        <div>
            <label htmlFor="group-select" className="block text-sm font-medium mb-1">
                Select Group
            </label>
            <select
                id="group-select"
                value={selectedGroupId}
                onChange={(e) => onGroupChange(e.target.value)}
                className="w-full rounded-md border-gray-300 p-2"
            >
                <option value="">Select a group...</option>
                {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                        {group.name} ({getRoleLabel(group.role)})
                    </option>
                ))}
            </select>
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>
    );
}
