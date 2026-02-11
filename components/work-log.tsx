'use client';

import React, { useState, useEffect, useRef, RefObject } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useOnClickOutside } from 'usehooks-ts';
import { TrashIcon, CheckIcon, VercelLogoIcon } from '@radix-ui/react-icons';
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
  setWorkLogItems
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

type MentionOption = {
  type: 'issue' | 'project';
  label: string;
  url: string;
  issue?: LinearIssue;
  project?: UnifiedProject;
};

const UNPLANNED_PROJECT_ID = '__unplanned__';

const workLogRecordPlaceholder = 'Record a new work item...';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

enum Step {
  ProvideDescription = 'provideDescription',
  ProvideProject = 'provideProject',
  Accept = 'accept',
}

export default function WorkLog({ focusedProjects, initialItems, onWorkLogChange }: WorkLogProps) {
  const [workItems, setWorkItems] = useState<WorkLogItem[]>([]);
  const recordUnitOfWorkRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(recordUnitOfWorkRef as RefObject<HTMLElement>, () => {
    setIsRecordUnitOfWorkOpen(false);
  });

  const [isLoadingIssues, setIsLoadingIssues] = useState(false);
  const [isRecordUnitOfWorkOpen, setIsRecordUnitOfWorkOpen] = useState(false);
  const [dayPlanId, setDayPlanId] = useState<string | null>(null);
  const [linearIssues, setLinearIssues] = useState<LinearIssue[]>([]);
  
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

  const onWorkLogAdded = async (newItem: WorkLogItem) => {
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

  return (
    <div className="flex h-full min-h-0 flex-col">

      {isRecordUnitOfWorkOpen && (
        <div ref={recordUnitOfWorkRef}>
          <RecordUnitOfWork
            linearIssues={linearIssues}
            focusedProjects={focusedProjects}
            onWorkLogAdded={onWorkLogAdded}
            onClose={() => setIsRecordUnitOfWorkOpen(false)}
          />
        </div>
      )}

      {/* Work Items List */}
      <div className="border border-zinc-500/10 p-6 rounded-lg flex-1 min-h-0 overflow-y-auto ">
        {workItems.length === 0 && (
          <div className="text-center py-8 border border-dashed border-[#333] rounded-lg mb-4">
            <p className="text-zinc-500 text-sm">No tasks logged yet</p>
            <p className="text-zinc-600 text-xs mt-1">Start logging your work</p>
          </div>
        )}

        <div className="overflow-y-auto h-full relative gap-2">
          {workItems.map(
            (item, index) => {
              const inverseIndex = workItems.length - index - 1;
              const translateY = `calc(${inverseIndex * 100}% + ${inverseIndex * 10}px)`;
              return (
              <div
                key={item.id}
                style={{ transform: `translateY(${translateY})` }}
                className={`absolute w-full transition-transform duration-1000 ease-in-out`}
              >
                <UnitOfWorkRecord
                  item={item}
                  project={getProjectById(item.projectId)}
                  onDelete={handleDelete}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Record New Work Item Trigger */}
      <div className="h-12 mt-4">
        {
          !isRecordUnitOfWorkOpen && (
            <motion.div
              layout="position"
              layoutId="work-log-input"
              onClick={() => setIsRecordUnitOfWorkOpen(true)}
              className="border border-[#444] bg-[#1a1a1a] rounded-lg p-2 text-zinc-500"
            >
              <motion.span>{workLogRecordPlaceholder}</motion.span>
            </motion.div>
        )}
      </div>
    </div>
  );
}

function RecordUnitOfWork({ linearIssues, focusedProjects, onWorkLogAdded, onClose }: { linearIssues: LinearIssue[], focusedProjects: UnifiedProject[], onWorkLogAdded: (newItem: WorkLogItem) => void, onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStartPos, setMentionStartPos] = useState(0);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [mentionedIssues, setMentionedIssues] = useState<Record<string, string>>({});
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const [step, setStep] = useState<Step>(Step.ProvideDescription);

  const handleAddTask = async () => {
    const description = newTaskDescription.trim();
    if (!description) return;

    // TODO: add unplanned reason 
    // const unplannedReason = selectedProjectId === UNPLANNED_PROJECT_ID ? unplannedReason : undefined;
    const unplannedReason = undefined;

    try {
      const newItem = addWorkLogItem({
        description,
        projectId: selectedProjectId,
        unplannedReason,
        mentionedIssues: Object.keys(mentionedIssues).length > 0 ? mentionedIssues : undefined,
        duration: undefined, // TODO: add duration (in minutes)
      });

      onWorkLogAdded(newItem);
      
      // Reset form
      setNewTaskDescription('');
      setSelectedProjectId('');
      setMentionedIssues({});

      setStep(Step.ProvideDescription);
      onClose();
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

  const selectMention = (mention: MentionOption) => {
    const beforeMention = newTaskDescription.substring(0, mentionStartPos);
    const afterMention = newTaskDescription.substring(mentionStartPos + mentionQuery.length + 1);
    const mentionLabel = mention.label.trim();
    const newText = `${beforeMention}@${mentionLabel} ${afterMention}`;
    
    setNewTaskDescription(newText);
    setShowMentionDropdown(false);
    setMentionQuery('');
    
    // Store the URL for linking later
    setMentionedIssues(prev => ({
      ...prev,
      [mentionLabel]: mention.url
    }));
    
    if (mention.type === 'project' && mention.project) {
      setSelectedProjectId(mention.project.id);
    } else if (mention.type === 'issue') {
      // Auto-select project: try issue's project first, otherwise select first focused project
      if (mention.issue?.project?.name) {
        const project = focusedProjects.find(
          p => p.name.toLowerCase() === mention.issue?.project?.name?.toLowerCase()
        );
        if (project) {
          setSelectedProjectId(project.id);
        }
      } else if (focusedProjects.length > 0 && !selectedProjectId) {
        // Auto-select first focused project if no project is selected yet
        setSelectedProjectId(focusedProjects[0].id);
      }
    }
  };

  function getFilteredMentions(): MentionOption[] {
    const normalizedQuery = mentionQuery.trim().toLowerCase();
    const issues = linearIssues
      .filter(issue => {
        const searchStr = `${issue.identifier} ${issue.title}`.toLowerCase();
        return searchStr.includes(normalizedQuery);
      })
      .map(issue => ({
        type: 'issue' as const,
        label: issue.identifier,
        url: issue.url,
        issue,
      }));

    const projects = focusedProjects
      .filter(project => project.name.toLowerCase().includes(normalizedQuery))
      .map(project => ({
        type: 'project' as const,
        label: project.name,
        url: project.url,
        project,
      }));

    return [...issues, ...projects];
  }

  function descriptionProvided() {
    // If no project selected, show selector
    if (!selectedProjectId) {
      setStep(Step.ProvideProject);
      return;
    }

    setStep(Step.Accept);
  }

  function manuallySelectProject(projectId: string) {
    setSelectedProjectId(projectId);
    setStep(Step.Accept);
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (step === Step.ProvideDescription) {
      if (showMentionDropdown) {
        const filteredMentions = getFilteredMentions();
        
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedMentionIndex(prev => 
            prev < filteredMentions.length - 1 ? prev + 1 : prev
          );
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedMentionIndex(prev => prev > 0 ? prev - 1 : 0);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (filteredMentions.length > 0) {
            selectMention(filteredMentions[selectedMentionIndex]);
          }
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setShowMentionDropdown(false);
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        descriptionProvided();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setNewTaskDescription('');
        setMentionedIssues({});
        setShowMentionDropdown(false);
        setSelectedMentionIndex(0);
        setMentionQuery('');
        setMentionStartPos(0);
        setSelectedProjectId(null);
        onClose();
      }
    }
  };

  return (
    <motion.div
      ref={ref}
      layoutId="work-log-input"
      transition={{ layout: { duration: 0.4, ease: 'easeOut', delay: step === Step.Accept ? 0.3 : 0 } }}

      className={`
        flex flex-col items-center gap-3 py-2
        border border-[#444] bg-[#1a1a1a]
        rounded-lg
        transition-colors       
        fixed top-[18%] left-1/2 -translate-x-1/2 z-50 w-[600px]
      `}
    >
      {/* <div className="flex-shrink-0">
        <div className="size-5 rounded-full border-2 border-dashed border-zinc-600" />
      </div> */}

      {/* Main Section */}
      <div className={`px-4 w-full h-full ${step === Step.Accept ? '' : 'grid place-items-center' }`}>
        {/* <div className="absolute right-0 top-0 text-sm">
          {step}
        </div> */}

        {step === Step.ProvideDescription && (
          <motion.input
            ref={inputRef}
            id="work-log-input"
            autoFocus={true}
            autoComplete='off'
            value={newTaskDescription}
            onChange={handleInputChange}
            placeholder={workLogRecordPlaceholder}
            style={{
              gridArea: '1 / 1',
            }}
            className="flex-1 w-full h-full bg-transparent text-white placeholder-zinc-500 outline-none z-10"
          />
        )}

        <div 
          style={{
            gridArea: '1 / 1',
          }}
          className={
            `w-full rounded-md flex flex-col gap-4 ${step !== Step.ProvideDescription ? 'justify-between items-center' : 'opacity-0' }`
          }
        >
          <motion.span
            layout="position"
            transition={{ layout: { duration: 0.4, ease: 'easeOut' } }}
            initial={false}
            className={
              ` rounded-md ${step !== Step.ProvideDescription ? 'translate-x-0' : 'opacity-0' }`
            }
          >
            <span
              className="bg-[#252525] px-1.5 py-0.5 rounded-sm"
            >
              {newTaskDescription}
            </span>
          </motion.span>

        {step === Step.Accept && (
          <motion.div className="grid grid-cols-3 grid-cols-[3fr_1fr_1fr] gap-3 justify-center items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <div className="text-xs text-zinc-500 text-center">
              Want to start right away?
            </div>
            <button
              className='cursor-pointer flex gap-2 items-center justify-center text-center rounded-md border border-[#252525] px-3 py-1.5 text-xs transition-colors'
              onClick={handleAddTask}
              >
                Yes, start now
            </button>
            <button
              className='cursor-pointer flex gap-2 rounded-md border border-[#252525] px-3 py-1.5 text-xs transition-colors'
              onClick={handleAddTask}
              >
                Just log it
            </button>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {step === Step.ProvideProject && (
            <ProjectSelector projects={focusedProjects} onProjectSelected={manuallySelectProject} />
          )}
        </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {/* @ Mention Dropdown */}
        {showMentionDropdown && (
            // isLoadingIssues ? (
            //   <div className="py-4 text-center text-sm text-zinc-500">
            //     Loading issues...
            //   </div>
            // ) : (
          <div className="w-full mt-1 py-2 px-2 border-t-1 border-[#333] bg-[#1a1a1a] shadow-lg">
            <MentionDropdown
              selectedMentionIndex={selectedMentionIndex}
              onSelectMention={setSelectedMentionIndex}
              onPickMention={selectMention}
              mentionOptions={getFilteredMentions()}
              mentionQuery={mentionQuery}
            />
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {/* @ Mention Dropdown */}
        {!showMentionDropdown && step === Step.ProvideDescription && (
          <div className="w-full mt-1 py-2 px-2 border-t-1 border-[#333] bg-[#1a1a1a] shadow-lg">
            <div className="text-sm text-zinc-500 flex items-center gap-1">
              <span className="font-mono text-[10px] bg-zinc-500/10 border border-zinc-500 px-2 py-0.5 rounded-sm">Tip</span> type <span className="font-mono text-purple-500 px-1 py-0.5 rounded-sm">@</span> to mention issues or projects
            </div>
          </div>
      )}
      </AnimatePresence>

    </motion.div>
  );
}

function UnitOfWorkRecord({ item, project, onDelete }: { item: WorkLogItem, project: UnifiedProject | null, onDelete: (id: string) => void }) {
  const isUnplanned = item.projectId === null;
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
    const mentionKeys = Object.keys(mentionedIssues ?? {}).filter(Boolean);
    if (!mentionedIssues || mentionKeys.length === 0) {
      return <span>{description}</span>;
    }

    // Split by @mentions and render with links
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    const escapedKeys = [...mentionKeys]
      .sort((a, b) => b.length - a.length)
      .map(key => escapeRegExp(key));
    const mentionRegex = new RegExp(`@(${escapedKeys.join('|')})`, 'g');
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

  return (
    <div
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

      <div>
        <button
          className="flex-shrink-0 p-1.5 rounded-md text-zinc-500 hover:text-purple-400 hover:bg-purple-500/10 transition-colors opacity-0 group-hover:opacity-100"
          title="Start tracking task time"
        >
          <PlayIcon />
        </button>

        <button
          onClick={() => onDelete(item.id)}
          className="flex-shrink-0 p-1.5 rounded-md text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
          title="Delete task"
        >
          <TrashIcon className="size-4" />
        </button>
      </div>
    </div>
  );
}

function ProjectSelector({ projects, onProjectSelected }: { projects: UnifiedProject[], onProjectSelected: (projectId: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeOut", delay: 0.3 }}
      className="mt-4 flex flex-col gap-3"
    >
      <h2 className="text-sm text-zinc-500">Was this work done in a specific project?</h2>
      <div className="flex flex-wrap gap-2">
        {projects.map(project => (
          <button
            key={project.id}
            className="rounded-md border px-3 py-1.5 text-xs transition-colors cursor-pointer border-purple-500/30"
            onClick={() => onProjectSelected(project.id)}
          >
            {project.name}
          </button>
        ))}
        <button
          className="rounded-md border px-3 py-1.5 text-xs transition-colors cursor-pointer border-red-700/30"
          onClick={() => onProjectSelected(UNPLANNED_PROJECT_ID)}
        >
          Unplanned work
        </button>
      </div>
    </motion.div>
  );
}

function MentionDropdown({
  selectedMentionIndex,
  onSelectMention,
  onPickMention,
  mentionOptions,
  mentionQuery,
}: {
  selectedMentionIndex: number;
  onSelectMention: (index: number) => void;
  onPickMention: (mention: MentionOption) => void;
  mentionOptions: MentionOption[];
  mentionQuery: string;
}) {
  if (mentionOptions.length === 0) {
    const message = mentionQuery
      ? `No issues or projects matching "${mentionQuery}"`
      : 'No issues or projects found for today\'s focus';
    return <div className="py-4 text-center text-sm text-zinc-500">
      {message}
    </div>;
  }

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="origin-top"
    >
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {mentionOptions.map((mention, index) => {
          const issue = mention.issue;
          const project = mention.project;
          const stateName = issue?.state?.name?.toLowerCase() || '';
          const isInProgress = stateName.includes('progress') || stateName === 'in progress';
          const isSelected = index === selectedMentionIndex;
          
          return (
            <button
              key={mention.type === 'issue' ? issue?.id : project?.id ?? mention.label}
              onClick={() => {
                onSelectMention(index);
                onPickMention(mention);
              }}
              className={`w-full text-left p-2 rounded-md transition-colors ${
                isSelected ? 'bg-purple-500/20' : 'hover:bg-[#252525]'
              }`}
            >
              <div className="flex items-start gap-2">
                {mention.type === 'issue' ? (
                  <span className="text-xs font-mono text-purple-400 flex-shrink-0 mt-0.5">
                    {issue?.identifier}
                  </span>
                ) : (
                  <span className="text-xs font-mono text-emerald-400 flex-shrink-0 mt-0.5">
                    PRJ
                  </span>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white line-clamp-2">
                    {mention.type === 'issue' ? issue?.title : mention.label}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded border ${
                      mention.type === 'issue'
                        ? 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                        : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                    }`}>
                      {mention.type === 'issue' ? 'Issue' : 'Project'}
                    </span>
                    {mention.type === 'issue' && issue?.state && (
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        isInProgress
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20'
                      }`}>
                        {issue.state.name}
                      </span>
                    )}
                    {mention.type === 'issue' && issue?.project && (
                      <span className="text-xs text-zinc-500">
                        {issue.project.name}
                      </span>
                    )}
                    {mention.type === 'project' && project?.source && (
                      <span className="text-xs text-zinc-500">
                        {project.source}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    
      <div className="mt-2 pt-2 border-t border-[#333] text-xs text-zinc-500 text-center">
        Use ↑↓ to navigate, Enter to select, Esc to close
      </div>
    </motion.div>
  );
}

// function UOWWithoutProjectForm({ focusedProjects, onWorkLogAdded }: { focusedProjects: UnifiedProject[], onWorkLogAdded: (newItem: WorkLogItem) => void }) {
//   const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
//   const [unplannedReason, setUnplannedReason] = useState<UnplannedReason | ''>('');
//   const [customReason, setCustomReason] = useState('');

//   const isUnplannedSelected = selectedProjectId === UNPLANNED_PROJECT_ID;
//   const isOtherSelected = unplannedReason === 'Other';
//   const canSubmitTask = Boolean(
//     selectedProjectId &&
//       (!isUnplannedSelected || (unplannedReason && (!isOtherSelected || customReason.trim())))
//   );

//   return (
//       <div className="rounded-lg border border-[#333] bg-[#1a1a1a] p-4">
//         <div className="text-sm text-zinc-400">Select a project for this work item</div>
//         <div className="mt-3 flex flex-wrap gap-2">
//           {focusedProjects.map(project => {
//             const isSelected = selectedProjectId === project.id;
//             return (
//               <button
//                 key={project.id}
//                 type="button"
//                 onClick={() => setSelectedProjectId(project.id)}
//                 className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
//                   isSelected
//                     ? 'border-purple-500 text-purple-300 bg-purple-500/10'
//                     : 'border-[#333] text-zinc-300 hover:border-purple-500/40'
//                 }`}
//               >
//                 {project.icon && <span className="mr-1">{project.icon}</span>}
//                 {project.name}
//               </button>
//             );
//           })}
//           <button
//             type="button"
//             onClick={() => setSelectedProjectId(UNPLANNED_PROJECT_ID)}
//             className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
//               isUnplannedSelected
//                 ? 'border-amber-400 text-amber-300 bg-amber-500/10'
//                 : 'border-[#333] text-zinc-300 hover:border-amber-500/40'
//             }`}
//           >
//             Unplanned
//           </button>
//         </div>

//         {isUnplannedSelected && (
//           <div className="mt-3 space-y-2">
//             <label className="block text-xs text-zinc-400" htmlFor="unplanned-reason">
//               Reason
//             </label>
//             <select
//               id="unplanned-reason"
//               value={unplannedReason}
//               onChange={event => setUnplannedReason(event.target.value as UnplannedReason)}
//               className="w-full rounded-md border border-[#333] bg-[#1e1e1e] px-2 py-1.5 text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
//             >
//               <option value="">Select reason</option>
//               {UNPLANNED_REASONS.map(reason => (
//                 <option key={reason} value={reason}>
//                   {reason}
//                 </option>
//               ))}
//             </select>
//             {isOtherSelected && (
//               <input
//                 type="text"
//                 value={customReason}
//                 onChange={event => setCustomReason(event.target.value)}
//                 placeholder="Custom reason"
//                 className="w-full rounded-md border border-[#333] bg-[#1e1e1e] px-2 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
//               />
//             )}
//           </div>
//         )}
//       </div>
//   );
// }

function PlayIcon() {
  return (
    <VercelLogoIcon className="w-4 h-4 rotate-90" />
  );
}