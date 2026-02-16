'use client';

import { AnimatePresence, motion } from 'motion/react';
import { TrashIcon, CheckIcon, PlayIcon } from '@radix-ui/react-icons';
import { type UnifiedProject } from '@/lib/task-source';
import {
  type WorkLogItem,
  deleteWorkLogItem,
} from '@/app/actions/day-plan';
import ProjectIcon from './project-icon';

type WorkLogProps = {
  focusedProjects: UnifiedProject[];
  workLogItems: WorkLogItem[];
  openDayPlanId: string;
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default function WorkLog({ focusedProjects, workLogItems, openDayPlanId }: WorkLogProps) {
  const handleDelete = async (id: string) => {
    try {
      await deleteWorkLogItem({ dayPlanId: openDayPlanId, itemId: id });
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
      <div className="flex-1 min-h-0 overflow-y-auto ">
        <div className="overflow-y-auto h-full relative gap-2 flex flex-col-reverse justify-end">
          <AnimatePresence mode="popLayout" initial={false}>
            { workLogItems.length === 0 && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 350, damping: 40 }}
                className="text-center py-8 border border-dashed border-[#333] rounded-lg mb-4"
              >
                <p className="text-zinc-500 text-sm">No tasks logged yet</p>
                <p className="text-zinc-600 text-xs mt-1">Start logging your work</p>
              </motion.div>
            )}
            {workLogItems.map((item) => (
              <motion.div
                 key={item.id}
                 initial={{ scale: 0, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 exit={{ scale: 0, opacity: 0 }}
                 transition={{ type: "spring", stiffness: 350, damping: 40 }}
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
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border"
              style={{ borderColor: project.color ?? '#71717a', color: project.color ?? '#71717a' }}
            >
              <ProjectIcon icon={project.icon} color={project.color} />
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
