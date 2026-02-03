'use client';

import { useState, useEffect, useRef } from 'react';
import { TrashIcon, CheckIcon } from '@radix-ui/react-icons';
import { type UnifiedProject } from '@/lib/task-source';
import {
  type WorkLogItem,
  type UnplannedReason,
  UNPLANNED_REASONS,
  getWorkLog,
  addWorkLogItem,
  removeWorkLogItem,
} from '@/lib/focus-storage';

type WorkLogProps = {
  focusedProjects: UnifiedProject[];
};

const UNPLANNED_PROJECT_ID = '__unplanned__';

export default function WorkLog({ focusedProjects }: WorkLogProps) {
  const [workItems, setWorkItems] = useState<WorkLogItem[]>([]);
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [unplannedReason, setUnplannedReason] = useState<UnplannedReason | ''>('');
  const [customReason, setCustomReason] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Load work log on mount
  useEffect(() => {
    loadWorkLog();
  }, []);

  const loadWorkLog = () => {
    const items = getWorkLog();
    setWorkItems(items);
  };

  const handleAddTask = () => {
    if (!newTaskDescription.trim()) return;
    
    // If no project selected, show selector
    if (!selectedProjectId) {
      setShowProjectSelector(true);
      return;
    }

    // Validate unplanned reason if needed
    const isUnplanned = selectedProjectId === UNPLANNED_PROJECT_ID;
    if (isUnplanned && !unplannedReason) {
      return;
    }

    // Validate custom reason if "Other" is selected
    const isOtherSelected = unplannedReason === 'Other';
    if (isUnplanned && isOtherSelected && !customReason.trim()) {
      return;
    }

    try {
      // Use custom reason if "Other" is selected, otherwise use the dropdown value
      const finalReason = isUnplanned 
        ? (isOtherSelected ? customReason.trim() : unplannedReason)
        : undefined;

      const newItem = addWorkLogItem({
        description: newTaskDescription.trim(),
        projectId: isUnplanned ? null : selectedProjectId,
        unplannedReason: finalReason,
      });

      setWorkItems(prev => [...prev, newItem]);
      
      // Reset form
      setNewTaskDescription('');
      setSelectedProjectId('');
      setUnplannedReason('');
      setCustomReason('');
      setShowProjectSelector(false);
      
      // Focus back on input
      inputRef.current?.focus();
    } catch (error) {
      console.error('Failed to add work log item:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTask();
    }
  };

  const handleDelete = (id: string) => {
    removeWorkLogItem(id);
    setWorkItems(prev => prev.filter(item => item.id !== id));
  };

  const getProjectById = (projectId: string | null): UnifiedProject | null => {
    if (!projectId) return null;
    return focusedProjects.find(p => p.id === projectId) || null;
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const isUnplannedSelected = selectedProjectId === UNPLANNED_PROJECT_ID;
  const isOtherSelected = unplannedReason === 'Other';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-white">Work Log</h2>
        <p className="text-sm text-zinc-400 mt-1">
          Track what you've accomplished today
        </p>
      </div>

      {/* Work Items List */}
      <div className="space-y-2">
        {workItems.length === 0 && !showProjectSelector && (
          <div className="text-center py-8 border border-dashed border-[#333] rounded-lg mb-4">
            <p className="text-zinc-500 text-sm">No tasks logged yet</p>
            <p className="text-zinc-600 text-xs mt-1">Add your first task below</p>
          </div>
        )}
        
        {workItems.map((item) => {
          const project = getProjectById(item.projectId);
          const isUnplanned = item.projectId === null;

          return (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-[#333] bg-[#1e1e1e] hover:bg-[#252525] transition-colors group"
            >
              <div className="flex-shrink-0">
                <div className="size-5 rounded-full border-2 border-zinc-600 flex items-center justify-center">
                  <CheckIcon className="size-3 text-zinc-600" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <p className="text-sm text-white">
                    {item.description}
                  </p>
                  <span className="text-xs text-zinc-500 flex-shrink-0">
                    {formatTimestamp(item.timestamp)}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 mt-1">
                  {isUnplanned ? (
                    <>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 border border-amber-500/20 text-amber-400">
                        Unplanned
                      </span>
                      {item.unplannedReason && (
                        <span className="text-xs text-zinc-500">
                          {item.unplannedReason}
                        </span>
                      )}
                    </>
                  ) : project ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-purple-500/10 border border-purple-500/20 text-purple-400">
                      {project.icon && <span>{project.icon}</span>}
                      {project.name}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-500/10 border border-zinc-500/20 text-zinc-500">
                      Unknown project
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => handleDelete(item.id)}
                className="flex-shrink-0 p-1.5 rounded-md text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                title="Delete task"
              >
                <TrashIcon className="size-4" />
              </button>
            </div>
          );
        })}

        {/* Project Selector (shown when adding task) */}
        {showProjectSelector && (
          <div className="p-4 rounded-lg border border-purple-500 bg-[#1a1a1a] space-y-3">
            <p className="text-sm text-zinc-300">Link "{newTaskDescription}" to:</p>
            
            <div className="grid grid-cols-1 gap-2">
              <select
                value={selectedProjectId}
                onChange={(e) => {
                  setSelectedProjectId(e.target.value);
                  if (e.target.value !== UNPLANNED_PROJECT_ID) {
                    setUnplannedReason('');
                  }
                }}
                className="w-full px-3 py-2 bg-[#111] border border-[#333] rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                autoFocus
              >
                <option value="">Select a project...</option>
                {focusedProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.icon ? `${project.icon} ` : ''}{project.name}
                  </option>
                ))}
                <option value={UNPLANNED_PROJECT_ID}>Mark as unplanned work</option>
              </select>

              {isUnplannedSelected && (
                <>
                  <select
                    value={unplannedReason}
                    onChange={(e) => {
                      setUnplannedReason(e.target.value as UnplannedReason);
                      if (e.target.value !== 'Other') {
                        setCustomReason('');
                      }
                    }}
                    className="w-full px-3 py-2 bg-[#111] border border-[#333] rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Select a reason...</option>
                    {UNPLANNED_REASONS.map((reason) => (
                      <option key={reason} value={reason}>
                        {reason}
                      </option>
                    ))}
                  </select>

                  {isOtherSelected && (
                    <input
                      type="text"
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      placeholder="Specify reason..."
                      className="w-full px-3 py-2 bg-[#111] border border-[#333] rounded-md text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  )}
                </>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleAddTask}
                disabled={
                  !selectedProjectId || 
                  (isUnplannedSelected && !unplannedReason) ||
                  (isUnplannedSelected && isOtherSelected && !customReason.trim())
                }
                className="px-3 py-1.5 rounded-md bg-purple-500 text-white text-sm font-medium hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Task
              </button>
              <button
                onClick={() => {
                  setShowProjectSelector(false);
                  setSelectedProjectId('');
                  setUnplannedReason('');
                  setCustomReason('');
                  inputRef.current?.focus();
                }}
                className="px-3 py-1.5 rounded-md bg-[#1e1e1e] text-zinc-300 text-sm border border-[#333] hover:bg-[#252525] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Add New Task Input */}
        {!showProjectSelector && (
          <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-[#444] bg-[#1a1a1a] hover:border-purple-500/50 transition-colors">
            <div className="flex-shrink-0">
              <div className="size-5 rounded-full border-2 border-dashed border-zinc-600" />
            </div>
            
            <input
              ref={inputRef}
              type="text"
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Add a new task..."
              className="flex-1 bg-transparent border-none text-sm text-white placeholder-zinc-500 focus:outline-none"
            />
          </div>
        )}
      </div>
    </div>
  );
}
