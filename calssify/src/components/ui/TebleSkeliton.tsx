import React from "react";

export default function TableSkeleton() {
    return (
        <div className="overflow-x-auto mt-6 animate-pulse">
            <table className="min-w-full bg-white border border-gray-300 rounded-lg overflow-hidden">
                <thead className="bg-gray-200 text-gray-700">
                    <tr>
                        <th className="px-4 py-2 text-left">Sl. No</th>
                        <th className="px-4 py-2 text-left">Source</th>
                        <th className="px-4 py-2 text-left">Label / PII Type</th>
                        <th className="px-4 py-2 text-left">Details</th>
                    </tr>
                </thead>
                <tbody>
                    {[...Array(5)].map((_, idx) => (
                        <tr key={idx} className="border-t bg-white">
                            <td className="px-4 py-3">
                                <div className="h-4 bg-gray-300 rounded w-8"></div>
                            </td>
                            <td className="px-4 py-3">
                                <div className="h-4 bg-gray-300 rounded w-32"></div>
                            </td>
                            <td className="px-4 py-3">
                                <div className="h-4 bg-gray-300 rounded w-24"></div>
                            </td>
                            <td className="px-4 py-3">
                                <div className="h-4 bg-gray-300 rounded w-20"></div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}