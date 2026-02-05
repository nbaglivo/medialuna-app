'use client';

import React, { useState, useEffect, useRef } from 'react';
import { TrashIcon, CheckIcon } from '@radix-ui/react-icons';
import { type UnifiedProject } from '@/lib/task-source';
import {
  type WorkLogItem,
  type UnplannedReason,
  UNPLANNED_REASONS,
  getWorkLog,
  addWorkLogItem,
  removeWorkLogItem,
  getDayPlanSession,
  saveDayPlanSession,
  setWorkLogItems,
} from '@/lib/focus-storage';
import {
  startDayPlan,
  syncDayPlanProjects,
  upsertWorkLogItem,
  deleteWorkLogItem,
} from '@/app/actions/day-plan';

type WorkLogProps = {
  focusedProjects: UnifiedProject[];
  initialItems?: WorkLogItem[];
  onWorkLogChange: (workLog: WorkLogItem[]) => void;
};

type LinearIssue = {
  id: string;
  identifier: string;
  title: string;
  url: string;
  state?: {
    name: string;
  } | null;
  project?: {
    name: string;
  } | null;
};

const UNPLANNED_PROJECT_ID = '__unplanned__';

export default function WorkLog({ focusedProjects, initialItems, onWorkLogChange }: WorkLogProps) {
  const [workItems, setWorkItems] = useState<WorkLogItem[]>([]);
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [unplannedReason, setUnplannedReason] = useState<UnplannedReason | ''>('');
  const [customReason, setCustomReason] = useState('');
  const [linearIssues, setLinearIssues] = useState<LinearIssue[]>([]);
  const [isLoadingIssues, setIsLoadingIssues] = useState(false);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStartPos, setMentionStartPos] = useState<number>(0);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [mentionedIssues, setMentionedIssues] = useState<Record<string, string>>({});
  const [durationHours, setDurationHours] = useState<string>('');
  const [durationMinutes, setDurationMinutes] = useState<string>('');
  const [dayPlanId, setDayPlanId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onWorkLogChange(workItems);
  }, [workItems]);

  useEffect(() => {
    if (initialItems) {
      setWorkItems(initialItems);
      setWorkLogItems(initialItems);
    } else {
      loadWorkLog();
    }

    const session = getDayPlanSession();
    if (session) {
      setDayPlanId(session.dayPlanId);
    }
  }, [initialItems]);

  // Load Linear issues when focused projects change
  useEffect(() => {
    if (focusedProjects.length > 0) {
      loadLinearIssues();
    }
  }, [focusedProjects]);

  useEffect(() => {
    const syncProjects = async () => {
      if (focusedProjects.length === 0) return;

      const dayPlanIdValue = await ensureDayPlanId();
      if (!dayPlanIdValue) return;

      await syncDayPlanProjects({
        dayPlanId: dayPlanIdValue,
        projects: focusedProjects.map(project => ({
          projectId: project.id,
          projectSource: project.source,
          projectName: project.name,
        })),
      });
    };

    syncProjects().catch(error => {
      console.error('Failed to sync day plan projects:', error);
    });
  }, [focusedProjects]);

  const ensureDayPlanId = async () => {
    const session = getDayPlanSession();
    if (session) {
      setDayPlanId(session.dayPlanId);
      return session.dayPlanId;
    }

    if (focusedProjects.length === 0) return null;

    const planDate = new Date().toISOString().split('T')[0];
    const { dayPlanId: createdId } = await startDayPlan({
      planDate,
      projects: focusedProjects.map(project => ({
        projectId: project.id,
        projectSource: project.source,
        projectName: project.name,
      })),
    });

    saveDayPlanSession(createdId, planDate);
    setDayPlanId(createdId);
    return createdId;
  };

  const loadWorkLog = () => {
    const items = getWorkLog();
    setWorkItems(items);
  };

  const loadLinearIssues = async () => {
    setIsLoadingIssues(true);
    try {
      const response = await fetch('/api/linear/issues');
      if (response.ok) {
        const data = await response.json();
        const issues: LinearIssue[] = data.issues || [];
        
        // Filter to only issues from focused projects if they have projects assigned
        // Otherwise show all issues (since many Linear issues don't have projects)
        const focusedProjectNames = focusedProjects.map(p => p.name.toLowerCase());
        
        const filteredIssues = issues.filter(issue => {
          // If issue has no project, include it (show all unassigned issues)
          if (!issue.project?.name) {
            return true;
          }
          
          // If issue has a project, check if it matches focused projects
          const issueProjectName = issue.project.name.toLowerCase();
          return focusedProjectNames.some(focusedName => {
            return issueProjectName === focusedName || 
                   issueProjectName.includes(focusedName) ||
                   focusedName.includes(issueProjectName);
          });
        });

        // Sort: in progress first, then by identifier
        const sortedIssues = filteredIssues.sort((a, b) => {
          const aStateName = a.state?.name?.toLowerCase() || '';
          const bStateName = b.state?.name?.toLowerCase() || '';
          
          const aInProgress = aStateName.includes('progress') || aStateName === 'in progress';
          const bInProgress = bStateName.includes('progress') || bStateName === 'in progress';
          
          if (aInProgress && !bInProgress) return -1;
          if (!aInProgress && bInProgress) return 1;
          
          return a.identifier.localeCompare(b.identifier);
        });

        setLinearIssues(sortedIssues);
      }
    } catch (error) {
      console.error('Failed to load Linear issues:', error);
    } finally {
      setIsLoadingIssues(false);
    }
  };

  const handleAddTask = async () => {
    if (!newTaskDescription.trim()) return;

    const inferredProjectId =
      selectedProjectId || (focusedProjects.length === 1 ? focusedProjects[0].id : '');
    
    // If no project selected, show selector
    if (!inferredProjectId) {
      setShowProjectSelector(true);
      return;
    }

    // Validate unplanned reason if needed
    if (!selectedProjectId && inferredProjectId) {
      setSelectedProjectId(inferredProjectId);
    }

    const isUnplanned = inferredProjectId === UNPLANNED_PROJECT_ID;
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

      // Calculate duration in minutes
      const hours = parseInt(durationHours) || 0;
      const minutes = parseInt(durationMinutes) || 0;
      const totalMinutes = hours * 60 + minutes;

      const newItem = addWorkLogItem({
        description: newTaskDescription.trim(),
        projectId: isUnplanned ? null : inferredProjectId,
        unplannedReason: finalReason,
        mentionedIssues: Object.keys(mentionedIssues).length > 0 ? mentionedIssues : undefined,
        duration: totalMinutes > 0 ? totalMinutes : undefined,
      });

      setWorkItems(prev => [...prev, newItem]);

      const dayPlanIdValue = await ensureDayPlanId();
      if (dayPlanIdValue) {
        const projectSource = newItem.projectId
          ? focusedProjects.find(project => project.id === newItem.projectId)?.source ?? null
          : null;

        await upsertWorkLogItem({
          dayPlanId: dayPlanIdValue,
          item: {
            id: newItem.id,
            description: newItem.description,
            timestamp: newItem.timestamp,
            projectId: newItem.projectId,
            projectSource,
            unplannedReason: newItem.unplannedReason,
            mentionedIssues: newItem.mentionedIssues,
            durationMinutes: newItem.duration ?? null,
          },
        });
      }
      
      // Reset form
      setNewTaskDescription('');
      setSelectedProjectId('');
      setUnplannedReason('');
      setCustomReason('');
      setMentionedIssues({});
      setDurationHours('');
      setDurationMinutes('');
      setShowProjectSelector(false);
      
      // Focus back on input
      inputRef.current?.focus();
    } catch (error) {
      console.error('Failed to add work log item:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    
    setNewTaskDescription(value);

    // Check for @ mention trigger
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtSymbol !== -1) {
      // Check if there's a space or beginning of string before @
      const charBeforeAt = lastAtSymbol > 0 ? textBeforeCursor[lastAtSymbol - 1] : ' ';
      const isValidMention = charBeforeAt === ' ' || lastAtSymbol === 0;
      
      if (isValidMention) {
        const query = textBeforeCursor.substring(lastAtSymbol + 1);
        // Only show dropdown if there's no space after @ (mention is still being typed)
        const hasSpaceAfter = query.includes(' ');
        
        if (!hasSpaceAfter) {
          setMentionQuery(query.toLowerCase());
          setMentionStartPos(lastAtSymbol);
          setShowMentionDropdown(true);
          setSelectedMentionIndex(0);
          return;
        }
      }
    }
    
    setShowMentionDropdown(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showMentionDropdown) {
      const filteredIssues = getFilteredIssues();
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMentionIndex(prev => 
          prev < filteredIssues.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIndex(prev => prev > 0 ? prev - 1 : 0);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredIssues.length > 0) {
          selectMention(filteredIssues[selectedMentionIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowMentionDropdown(false);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTask();
    }
  };

  const getFilteredIssues = () => {
    if (!mentionQuery) return linearIssues;
    
    return linearIssues.filter(issue => {
      const searchStr = `${issue.identifier} ${issue.title}`.toLowerCase();
      return searchStr.includes(mentionQuery);
    });
  };

  const selectMention = (issue: LinearIssue) => {
    const beforeMention = newTaskDescription.substring(0, mentionStartPos);
    const afterMention = newTaskDescription.substring(mentionStartPos + mentionQuery.length + 1);
    const newText = `${beforeMention}@${issue.identifier} ${afterMention}`;
    
    setNewTaskDescription(newText);
    setShowMentionDropdown(false);
    setMentionQuery('');
    
    // Store the issue URL for linking later
    setMentionedIssues(prev => ({
      ...prev,
      [issue.identifier]: issue.url
    }));
    
    // Auto-select project: try issue's project first, otherwise select first focused project
    if (issue.project?.name) {
      const project = focusedProjects.find(
        p => p.name.toLowerCase() === issue.project?.name.toLowerCase()
      );
      if (project) {
        setSelectedProjectId(project.id);
      }
    } else if (focusedProjects.length > 0 && !selectedProjectId) {
      // Auto-select first focused project if no project is selected yet
      setSelectedProjectId(focusedProjects[0].id);
    }
    
    // Focus back on input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleDelete = async (id: string) => {
    removeWorkLogItem(id);
    setWorkItems(prev => prev.filter(item => item.id !== id));

    try {
      const dayPlanIdValue = dayPlanId ?? await ensureDayPlanId();
      if (dayPlanIdValue) {
        await deleteWorkLogItem({ dayPlanId: dayPlanIdValue, itemId: id });
      }
    } catch (error) {
      console.error('Failed to delete work log item:', error);
    }
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

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${mins}m`;
    }
  };

  // Render description with clickable @mention links
  const renderDescription = (description: string, mentionedIssues?: Record<string, string>) => {
    if (!mentionedIssues || Object.keys(mentionedIssues).length === 0) {
      return <span>{description}</span>;
    }

    // Split by @mentions and render with links
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    const mentionRegex = /@([A-Z]+-\d+)/g;
    let match;

    while ((match = mentionRegex.exec(description)) !== null) {
      const fullMatch = match[0];
      const identifier = match[1];
      const startIndex = match.index;

      // Add text before mention
      if (startIndex > lastIndex) {
        parts.push(description.substring(lastIndex, startIndex));
      }

      // Add clickable mention
      const url = mentionedIssues[identifier];
      if (url) {
        parts.push(
          <a
            key={startIndex}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400 hover:text-purple-300 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {fullMatch}
          </a>
        );
      } else {
        parts.push(fullMatch);
      }

      lastIndex = startIndex + fullMatch.length;
    }

    // Add remaining text
    if (lastIndex < description.length) {
      parts.push(description.substring(lastIndex));
    }

    return <>{parts}</>;
  };

  const isUnplannedSelected = selectedProjectId === UNPLANNED_PROJECT_ID;
  const isOtherSelected = unplannedReason === 'Other';
  const canSubmitTask = Boolean(
    selectedProjectId &&
      (!isUnplannedSelected || (unplannedReason && (!isOtherSelected || customReason.trim())))
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-white">Work Log</h2>
        <p className="text-sm text-zinc-400 mt-1">
          Track what you've put time into today
        </p>
      </div>

      {/* Work Items List */}
      <div className="space-y-2 overflow-y-auto">
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
                    {renderDescription(item.description, item.mentionedIssues)}
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
                  {item.duration && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 border border-blue-500/20 text-blue-400">
                      {formatDuration(item.duration)}
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
      </div>

      {/* Record New Work Item Input */}
      {!showProjectSelector && (
        <div className="relative">
          <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-[#444] bg-[#1a1a1a] hover:border-purple-500/50 transition-colors">
            <div className="flex-shrink-0">
              <div className="size-5 rounded-full border-2 border-dashed border-zinc-600" />
            </div>
            
            <input
              ref={inputRef}
              type="text"
              value={newTaskDescription}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Record a new work item... (type @ to mention issues)"
              className="flex-1 bg-transparent border-none text-sm text-white placeholder-zinc-500 focus:outline-none"
            />
          </div>

          {/* @ Mention Dropdown */}
          {showMentionDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 p-2 rounded-lg border border-purple-500 bg-[#1a1a1a] shadow-lg max-h-64 overflow-y-auto z-10">
              {isLoadingIssues ? (
                <div className="py-4 text-center text-sm text-zinc-500">
                  Loading issues...
                </div>
              ) : getFilteredIssues().length === 0 ? (
                <div className="py-4 text-center text-sm text-zinc-500">
                  {linearIssues.length === 0 
                    ? 'No Linear issues found for focused projects'
                    : `No issues matching "${mentionQuery}"`
                  }
                </div>
              ) : (
                <div className="space-y-1">
                  {getFilteredIssues().map((issue, index) => {
                    const stateName = issue.state?.name?.toLowerCase() || '';
                    const isInProgress = stateName.includes('progress') || stateName === 'in progress';
                    const isSelected = index === selectedMentionIndex;
                    
                    return (
                      <button
                        key={issue.id}
                        onClick={() => selectMention(issue)}
                        className={`w-full text-left p-2 rounded-md transition-colors ${
                          isSelected ? 'bg-purple-500/20' : 'hover:bg-[#252525]'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-xs font-mono text-purple-400 flex-shrink-0 mt-0.5">
                            {issue.identifier}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white line-clamp-2">
                              {issue.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {issue.state && (
                                <span className={`text-xs px-1.5 py-0.5 rounded ${
                                  isInProgress 
                                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                                    : 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20'
                                }`}>
                                  {issue.state.name}
                                </span>
                              )}
                              {issue.project && (
                                <span className="text-xs text-zinc-500">
                                  {issue.project.name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              
              {!isLoadingIssues && getFilteredIssues().length > 0 && (
                <div className="mt-2 pt-2 border-t border-[#333] text-xs text-zinc-500 text-center">
                  Use ↑↓ to navigate, Enter to select, Esc to close
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {showProjectSelector && (
        <div className="rounded-lg border border-[#333] bg-[#1a1a1a] p-4">
          <div className="text-sm text-zinc-400">Select a project for this work item</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {focusedProjects.map(project => {
              const isSelected = selectedProjectId === project.id;
              return (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => setSelectedProjectId(project.id)}
                  className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
                    isSelected
                      ? 'border-purple-500 text-purple-300 bg-purple-500/10'
                      : 'border-[#333] text-zinc-300 hover:border-purple-500/40'
                  }`}
                >
                  {project.icon && <span className="mr-1">{project.icon}</span>}
                  {project.name}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setSelectedProjectId(UNPLANNED_PROJECT_ID)}
              className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
                isUnplannedSelected
                  ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                  : 'border-[#333] text-zinc-300 hover:border-amber-500/40'
              }`}
            >
              Unplanned
            </button>
          </div>

          {isUnplannedSelected && (
            <div className="mt-3 space-y-2">
              <label className="block text-xs text-zinc-400" htmlFor="unplanned-reason">
                Reason
              </label>
              <select
                id="unplanned-reason"
                value={unplannedReason}
                onChange={event => setUnplannedReason(event.target.value as UnplannedReason)}
                className="w-full rounded-md border border-[#333] bg-[#1e1e1e] px-2 py-1.5 text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              >
                <option value="">Select reason</option>
                {UNPLANNED_REASONS.map(reason => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
              {isOtherSelected && (
                <input
                  type="text"
                  value={customReason}
                  onChange={event => setCustomReason(event.target.value)}
                  placeholder="Custom reason"
                  className="w-full rounded-md border border-[#333] bg-[#1e1e1e] px-2 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              )}
            </div>
          )}

          <div className="mt-3 flex items-center gap-2 text-xs text-zinc-400">
            <span>Duration</span>
            <input
              type="number"
              min="0"
              value={durationHours}
              onChange={event => setDurationHours(event.target.value)}
              className="w-16 rounded-md border border-[#333] bg-[#1e1e1e] px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
              placeholder="0"
            />
            <span>h</span>
            <input
              type="number"
              min="0"
              value={durationMinutes}
              onChange={event => setDurationMinutes(event.target.value)}
              className="w-16 rounded-md border border-[#333] bg-[#1e1e1e] px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
              placeholder="0"
            />
            <span>m</span>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setShowProjectSelector(false);
                setSelectedProjectId('');
                setUnplannedReason('');
                setCustomReason('');
              }}
              className="px-3 py-1.5 rounded-md border border-[#333] text-xs text-zinc-300 hover:border-zinc-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddTask}
              disabled={!canSubmitTask}
              className="px-3 py-1.5 rounded-md border border-purple-500 text-xs text-white hover:bg-purple-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add task
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
