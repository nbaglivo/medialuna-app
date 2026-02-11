'use client';

import React, { useState, useEffect, useRef, RefObject } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useOnClickOutside } from 'usehooks-ts';
import { TrashIcon, CheckIcon, VercelLogoIcon } from '@radix-ui/react-icons';
import { type UnifiedProject } from '@/lib/task-source';
import {
  type WorkLogItem,
  syncDayPlanProjects,
  upsertWorkLogItem,
  deleteWorkLogItem,
  getDayPlanId,
} from '@/app/actions/day-plan';
import { LinearIssue } from './types';
import { RecordUnitOfWork } from './new-record-form';
import { WORK_LOG_RECORD_PLACEHOLDER } from './translations';

type WorkLogProps = {
  focusedProjects: UnifiedProject[];
  workLogItems: WorkLogItem[];
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default function WorkLog({ focusedProjects, workLogItems }: WorkLogProps) {
  const recordUnitOfWorkRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(recordUnitOfWorkRef as RefObject<HTMLElement>, () => {
    setIsRecordUnitOfWorkOpen(false);
  });

  const [isLoadingIssues, setIsLoadingIssues] = useState(false);
  const [isRecordUnitOfWorkOpen, setIsRecordUnitOfWorkOpen] = useState(false);
  const [linearIssues, setLinearIssues] = useState<LinearIssue[]>([]);

  // Load Linear issues when focused projects change
  useEffect(() => {
    if (focusedProjects.length > 0) {
      loadLinearIssues();
    }
  }, [focusedProjects]);

  useEffect(() => {
    const syncProjects = async () => {
      if (focusedProjects.length === 0) return;

      const dayPlanIdValue = await getDayPlanId();
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

  const onWorkLogAdded = async (newItem: WorkLogItem) => {
    const dayPlanIdValue = await getDayPlanId();
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
    try {
      const dayPlanIdValue = await getDayPlanId();
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

      <AnimatePresence>
        {isRecordUnitOfWorkOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
          />
        )}
      </AnimatePresence>

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
        {workLogItems.length === 0 && (
          <div className="text-center py-8 border border-dashed border-[#333] rounded-lg mb-4">
            <p className="text-zinc-500 text-sm">No tasks logged yet</p>
            <p className="text-zinc-600 text-xs mt-1">Start logging your work</p>
          </div>
        )}

        <div className="overflow-y-auto h-full relative gap-2 flex flex-col-reverse justify-end">
          <AnimatePresence initial={false}>
            {workLogItems.map((item) => (
              <motion.div
                layout="position"
                key={item.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <UnitOfWorkRecord
                  item={item}
                  project={getProjectById(item.projectId)}
                  onDelete={handleDelete}
                />
              </motion.div>
            ))}
          </AnimatePresence>
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
              <motion.span>{WORK_LOG_RECORD_PLACEHOLDER}</motion.span>
            </motion.div>
        )}
      </div>
    </div>
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

function PlayIcon() {
  return (
    <VercelLogoIcon className="w-4 h-4 rotate-90" />
  );
}
