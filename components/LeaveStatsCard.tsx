import React from 'react';

interface Props {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  subtext?: string;
}

export const LeaveStatsCard: React.FC<Props> = ({ title, value, icon, color, subtext }) => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="text-2xl font-bold mt-1 text-gray-900">{value}</h3>
          {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-full ${color} bg-opacity-10 text-xl`}>
          {icon}
        </div>
      </div>
    </div>
  );
};