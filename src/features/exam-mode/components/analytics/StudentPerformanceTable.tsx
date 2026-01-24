/**
 * StudentPerformanceTable Component
 *
 * Displays student performance data including scores,
 * pass/fail status, time taken, and links to individual results.
 *
 * @see VIBE-0004C
 */

import Link from 'next/link'
import type { StudentPerformance } from '@/features/exam-mode/types'

interface StudentPerformanceTableProps {
    students: StudentPerformance[]
    activityId: string
}

export function StudentPerformanceTable({
    students,
    activityId,
}: StudentPerformanceTableProps) {
    if (students.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <i className="fas fa-users mr-2 text-red-700"></i>
                    Student Performance
                </h2>
                <div className="text-center py-8 text-gray-500">
                    <i className="fas fa-inbox text-4xl mb-3"></i>
                    <p>No student submissions yet</p>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <i className="fas fa-users mr-2 text-red-700"></i>
                Student Performance
                <span className="ml-3 text-sm font-normal text-gray-600">
                    (Sorted by score - highest first)
                </span>
            </h2>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b-2 border-gray-200">
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                                Student
                            </th>
                            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                                Score
                            </th>
                            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                                Status
                            </th>
                            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                                Questions
                            </th>
                            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                                Time
                            </th>
                            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                                Submitted
                            </th>
                            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.map((student) => (
                            <tr
                                key={student.attemptId}
                                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                            >
                                <td className="py-3 px-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{student.studentName}</p>
                                        <p className="text-xs text-gray-500">{student.studentEmail}</p>
                                    </div>
                                </td>
                                <td className="py-3 px-4 text-center">
                                    <span
                                        className={`text-lg font-bold ${student.passed ? 'text-green-700' : 'text-red-700'
                                            }`}
                                    >
                                        {student.scorePercentage.toFixed(1)}%
                                    </span>
                                </td>
                                <td className="py-3 px-4 text-center">
                                    {student.passed ? (
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                            <i className="fas fa-check-circle mr-1"></i>PASSED
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                            <i className="fas fa-times-circle mr-1"></i>FAILED
                                        </span>
                                    )}
                                </td>
                                <td className="py-3 px-4 text-center">
                                    <div className="text-sm">
                                        <span className="text-green-600 font-medium">
                                            {student.questionsCorrect}
                                        </span>
                                        <span className="text-gray-400 mx-1">/</span>
                                        <span className="text-gray-700">
                                            {student.questionsCorrect + student.questionsIncorrect}
                                        </span>
                                    </div>
                                </td>
                                <td className="py-3 px-4 text-center">
                                    <span className="text-sm text-gray-700">{student.timeTakenMinutes}m</span>
                                </td>
                                <td className="py-3 px-4 text-center">
                                    <span className="text-xs text-gray-500">
                                        {student.submittedAt.toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                            hour: 'numeric',
                                            minute: '2-digit',
                                        })}
                                    </span>
                                </td>
                                <td className="py-3 px-4 text-center">
                                    <Link
                                        href={`/activities/${activityId}/exam/results?attempt=${student.attemptId}`}
                                        className="inline-flex items-center px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-md transition-colors"
                                    >
                                        <i className="fas fa-eye mr-1"></i>View Results
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
