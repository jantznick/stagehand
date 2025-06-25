import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useHierarchyStore from '../../stores/useHierarchyStore';
import useCompanyStore from '../../stores/useCompanyStore';
import { ChevronsUpDown, Check, Building, Plus, Settings } from 'lucide-react';

const CompanySwitcher = ({ isCollapsed }) => {
  const { activeOrganization, activeCompany, setActiveCompany, addItem: addItemToHierarchy, getDisplayName } = useHierarchyStore();
  const { createCompany } = useCompanyStore();
  const [isPopoverOpen, setPopoverOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [hoveredCompanyId, setHoveredCompanyId] = useState(null);
  const popoverRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const allCompanies = activeOrganization?.companies || [];

  const handleEditClick = (e, companyId) => {
    e.stopPropagation();
    navigate(`/settings/company/${companyId}`);
    setPopoverOpen(false);
  };

  const handleCompanySelect = (company) => {
    setActiveCompany(company);
    setPopoverOpen(false);
  };

  const handleAddClick = () => {
    setIsAdding(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    if (!newCompanyName.trim() || !activeOrganization) return;
    
    try {
      const newCompany = await createCompany({ name: newCompanyName, organizationId: activeOrganization.id });
      addItemToHierarchy({ ...newCompany, type: 'company' }, activeOrganization.id, 'organization');
      setActiveCompany({ ...newCompany, type: 'company' });
      setNewCompanyName("");
      setIsAdding(false);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setPopoverOpen(false);
        setIsAdding(false);
        setNewCompanyName("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [popoverRef]);

  if (!activeCompany && allCompanies.length === 0) {
    return (
        <div className="p-4 border-t border-b border-white/10">
             {isAdding ? (
                <form onSubmit={handleCreateCompany} className="flex items-center gap-2 px-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    placeholder={`New ${getDisplayName('company', 'singular')} name...`}
                    className="flex-1 bg-transparent text-white text-sm placeholder-white/40 focus:outline-none"
                    onBlur={() => { if(!newCompanyName) setIsAdding(false); }}
                  />
                  <button type="submit" className="p-1 text-[var(--orange-wheel)] hover:text-white">
                    <Check size={16} />
                  </button>
                </form>
              ) : (
                <button
                    onClick={handleAddClick}
                    className="w-full text-left flex items-center gap-2 p-2 rounded-md text-sm text-white/80 hover:bg-white/10"
                >
                    <Plus size={16} className="text-[var(--orange-wheel)]" />
                    <span className="truncate">Create a {getDisplayName('company', 'singular')}</span>
                </button>
              )}
        </div>
    );
  }
  
  if (!activeCompany) {
    return (
        <div className="p-4 border-t border-b border-white/10">
             <div className="px-4 py-2 text-sm text-center text-[var(--vanilla)]/60">
                {isCollapsed ? '' : `Select a ${getDisplayName('company', 'singular')}.`}
             </div>
        </div>
    );
  }

  return (
    <div className="relative p-4 border-t border-b border-white/10" ref={popoverRef}>
      <button
        onClick={() => setPopoverOpen(!isPopoverOpen)}
        className={`w-full flex items-center p-2 rounded-lg hover:bg-white/10 ${isCollapsed ? 'justify-center' : 'justify-between'}`}
        disabled={isCollapsed}
        title={isCollapsed ? activeCompany.name : `Switch ${getDisplayName('company', 'singular')}`}
      >
        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
          <Building size={20} className="flex-shrink-0 text-[var(--xanthous)]" />
          {!isCollapsed && (
            <span className="transition-opacity duration-200 text-left">
              <span className="block text-sm font-semibold text-white truncate">{activeCompany.name}</span>
              <span className="block text-xs text-left text-white/60">Active {getDisplayName('company', 'singular')}</span>
            </span>
          )}
        </div>
        {!isCollapsed && <ChevronsUpDown size={16} className="text-white/60" />}
      </button>

      {isPopoverOpen && !isCollapsed && (
        <div className="absolute bottom-full mb-2 w-[calc(100%-2rem)] bg-[var(--gunmetal)] rounded-lg shadow-2xl z-20 border border-white/10">
          <div className="p-2">
            <div className="flex justify-between items-center px-2 py-1">
                <span className="block text-xs font-semibold tracking-wider text-white/60 uppercase">Switch {getDisplayName('company', 'singular')}</span>
            </div>
            <ul className="mt-1 max-h-48 overflow-y-auto">
              {allCompanies.map(company => (
                <li 
                    key={company.id}
                    onMouseEnter={() => setHoveredCompanyId(company.id)}
                    onMouseLeave={() => setHoveredCompanyId(null)}
                    onClick={() => handleCompanySelect(company)}
                    className="w-full text-left flex items-center justify-between p-2 rounded-md text-sm hover:bg-white/10 cursor-pointer"
                >
                    <span className="truncate text-white">{company.name}</span>
                    <div className="flex items-center gap-2">
                        {(activeCompany.id === company.id || hoveredCompanyId === company.id) && (
                            <button 
                                onClick={(e) => handleEditClick(e, company.id)}
                                className="p-1 rounded-md text-white/60 hover:text-white"
                                title={`Edit ${getDisplayName('company', 'singular')}`}
                            >
                                <Settings size={14} />
                            </button>
                        )}
                        {activeCompany.id === company.id && <Check size={16} className="text-[var(--orange-wheel)]" />}
                    </div>
                </li>
              ))}
            </ul>
            <div className="border-t border-white/10 mt-2 pt-2">
              {isAdding ? (
                <form onSubmit={handleCreateCompany} className="flex items-center gap-2 px-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    placeholder={`New ${getDisplayName('company', 'singular')} name...`}
                    className="flex-1 bg-transparent text-white text-sm placeholder-white/40 focus:outline-none"
                    onBlur={() => { if(!newCompanyName) setIsAdding(false); }}
                  />
                  <button type="submit" className="p-1 text-[var(--orange-wheel)] hover:text-white">
                    <Check size={16} />
                  </button>
                </form>
              ) : (
                <button
                    onClick={handleAddClick}
                    className="w-full text-left flex items-center gap-2 p-2 rounded-md text-sm text-white/80 hover:bg-white/10"
                >
                    <Plus size={16} className="text-[var(--orange-wheel)]" />
                    <span className="truncate">Add New {getDisplayName('company', 'singular')}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanySwitcher; 