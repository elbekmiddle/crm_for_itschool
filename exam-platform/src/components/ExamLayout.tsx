import React from 'react';
import { Outlet } from 'react-router-dom';

const ExamLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] no-select">
      <Outlet />
    </div>
  );
};

export default ExamLayout;
