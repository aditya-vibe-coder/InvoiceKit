import React from 'react';

export default function SkeletonRow() {
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-100 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-24 h-4 bg-gray-200 rounded"></div>
        <div className="w-40 h-4 bg-gray-200 rounded"></div>
        <div className="w-20 h-4 bg-gray-200 rounded"></div>
      </div>
      <div className="w-24 h-6 bg-gray-200 rounded"></div>
    </div>
  );
}
