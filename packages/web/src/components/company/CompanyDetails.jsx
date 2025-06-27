import React from 'react';
import { useParams } from 'react-router-dom';
import useHierarchyStore from '../../stores/useHierarchyStore';
import ProjectGraphContainer from '../architecture/ProjectGraphContainer';

const CompanyDetails = () => {
  const { companyId } = useParams();
  const { activeCompany } = useHierarchyStore((state) => ({
    activeCompany: state.activeCompany,
  }));

  if (!activeCompany || activeCompany.id !== companyId) {
    // This can happen on first load or if the URL is out of sync
    return <div className="p-8 text-white">Loading company details...</div>;
  }

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-4">{activeCompany.name}</h1>
      <p className="text-gray-400 mb-8">
        An overview of all application dependencies across the company.
      </p>

      <div className="mt-8">
        <ProjectGraphContainer />
      </div>
    </div>
  );
};

export default CompanyDetails; 