'use client';
import './current-focus-item.css';
import { useState, useEffect, useRef } from 'react';
import { WorkLogItem } from "@/app/actions/day-plan";
import { motion, AnimatePresence } from 'motion/react';
import * as Select from '@radix-ui/react-select';
import { UnifiedProject } from '@/lib/task-source';
import ProjectIcon from './project-icon';
import Link from 'next/link';
import { MentionDropdown, MentionOption, ProjectSelector } from './new-record-form';
import { START_FOCUS_PLACEHOLDER } from './translations';
import { LinearIssue } from './types';

export default function FocusWindow({ workLogItem, focusedProjects, linearIssues }: { workLogItem: WorkLogItem, focusedProjects: UnifiedProject[], linearIssues: LinearIssue[] }) {
    const [workInFocus, setWorkInFocus] = useState<WorkLogItem | null>(null);
    const [isAddingFocus, setIsAddingFocus] = useState(false);
    
  return (
    <div className="flex min-h-0 flex-[1.5] bg-[#171717] flex-col p-4">
        <h2 className="font-semibold text-zinc-400 mb-2">
            {workInFocus ? 'Currently Focusing On' : 'Idle'}
        </h2>
        <div className="flex flex-col gap-4">
            <AnimatePresence mode="popLayout" initial={false}>
                {workInFocus ? (
                    workInFocus && workInFocus.projectId ? (
                        <CurrentFocusItem workLogItem={workInFocus} project={focusedProjects.find(p => p.id === workInFocus.projectId)!} />
                    ) : (
                        <div>
                            <motion.h3
                                layoutId="new-task-description"
                                className="text-lg font-semibold"
                            >
                                {workInFocus.description}
                            </motion.h3>
                            <ProjectSelector projects={focusedProjects} onProjectSelected={(projectId) => setWorkInFocus({ ...workInFocus, projectId })} />
                        </div>
                    )
                ) : (
                    <div className="flex flex-col mt-8 gap-8">

                        <AnimatePresence mode="popLayout" initial={false}>
                            {isAddingFocus && (
                                <AddFocusTaskForm
                                    focusedProjects={focusedProjects}
                                    linearIssues={linearIssues}
                                    onAddFocusTask={(focusTask) => setWorkInFocus(focusTask)}
                                />
                            )}
                        </AnimatePresence>
                
                        {/* Start Focus Trigger */}
                        <div className="items-center justify-center flex">
                            <AnimatePresence mode="popLayout" initial={false}>
                                {!isAddingFocus && (
                                    <motion.button
                                        layout="position"
                                        layoutId="work-log-input"
                                        transition={{ layout: { type: 'spring', stiffness: 350, damping: 40, duration: 3 } }}
                                        onClick={() => setIsAddingFocus(true)}
                                        className="border border-[#444] bg-[#1a1a1a] p-2 text-zinc-500 cursor-pointer"
                                        style={{ borderRadius: '8px' }}
                                    >
                                    <motion.span>{START_FOCUS_PLACEHOLDER}</motion.span>
                                    </motion.button>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    </div>
  )
}

function AddFocusTaskForm({ focusedProjects, linearIssues, onAddFocusTask }: { focusedProjects: UnifiedProject[], linearIssues: LinearIssue[], onAddFocusTask: (focusTask: WorkLogItem) => void }) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [newTaskDescription, setNewTaskDescription] = useState('');
    const [mentionQuery, setMentionQuery] = useState('');
    const [mentionStartPos, setMentionStartPos] = useState(0);
    const [showMentionDropdown, setShowMentionDropdown] = useState(false);
    const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
    const [mentionedIssues, setMentionedIssues] = useState<Record<string, string>>({});
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

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

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (newTaskDescription.trim() === '') {
                return;
            }

            addFocusTask();
        }
    }

    function addFocusTask() {
        onAddFocusTask({
            description: newTaskDescription,
            projectId: selectedProjectId,
            mentionedIssues: Object.keys(mentionedIssues).length > 0 ? mentionedIssues : undefined,
            duration: undefined,
            timestamp: Date.now(),
            id: crypto.randomUUID(),
        });
    }

    return (
        <motion.div
            layout
            layoutId="work-log-input"
            transition={{ layout: { type: 'spring', stiffness: 350, damping: 40, duration: 3 } }}
            className={`
                relative
                flex flex-col items-center gap-3 py-2
                transition-colors
                px-4
            `}
        >
            {/* Main Section */}
            <div className={`w-full h-full grid place-items-center`}>
                <motion.input
                    ref={inputRef}
                    id="work-log-input"
                    autoFocus={true}
                    autoComplete='off'
                    value={newTaskDescription}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={START_FOCUS_PLACEHOLDER}
                    style={{ gridArea: '1 / 1', borderRadius: '8px' }}
                    className="border border-[#444] bg-[#1a1a1a] p-2 text-zinc-500 flex-1 w-full h-full bg-transparent text-white placeholder-zinc-500 outline-none z-10"
                />

                <div
                    style={{ gridArea: '1 / 1' }}
                    className="w-full rounded-md flex flex-col gap-4 opacity-0"
                >
                    <motion.span
                        layout="position"
                        layoutId="new-task-description"
                        transition={{ layout: { duration: 0.4, ease: 'easeOut' } }}
                        initial={false}
                        className='rounded-md opacity-0'
                    >
                        <span
                            className="bg-[#252525] px-1.5 py-0.5 rounded-sm"
                        >
                            {newTaskDescription}
                        </span>
                    </motion.span>

                </div>
            </div>

            <div className="relative w-full">
                <AnimatePresence>
                    {/* @ Mention Dropdown */}
                    {showMentionDropdown && (
                        <div className="absolute top-0 left-0 w-full mt-1 py-2 px-2 border-t-1 border-[#333] bg-[#1a1a1a] shadow-lg">
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
            </div>

            <AnimatePresence>
                {!showMentionDropdown && (
                    <div className="w-full mt-1 py-2">
                        <div className="text-sm text-zinc-500 flex items-center gap-1">
                            <span className="font-mono text-[10px] bg-zinc-500/10 border border-zinc-500 px-2 py-0.5 rounded-sm">Tip</span> type <span className="font-mono text-purple-500 px-1 py-0.5 rounded-sm">@</span> to mention issues or projects
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

function CurrentFocusItem({ workLogItem, project }: { workLogItem: WorkLogItem, project: UnifiedProject }) {
  const [isTracking, setIsTracking] = useState(false);
  const [isWritingUpdate, setIsWritingUpdate] = useState(false);
  const [updates, setUpdates] = useState<{ text: string, type: typeof UPDATE_TYPES[number] }[]>([]);
  const [updateText, setUpdateText] = useState('');

  const onPostUpdate = () => {
    setUpdates([...updates, { text: updateText, type: 'Done' }]);
    setUpdateText('');
    setIsWritingUpdate(false);
  }

  const cancelUpdate = () => {
    setUpdateText('');
    setIsWritingUpdate(false);
  }

  return (
    <div className="flex flex-col gap-4">
        <div className="flex flex-row items-center justify-between gap-2">
            <div className="flex flex-col gap-2">
                <h3 className="text-lg font-semibold">{workLogItem.description}</h3>
                <ProjectName project={project} />
            </div>
            <RunningTimer isRunning={isTracking} />
        </div>

        <div className="text-sm text-zinc-400 hover:text-zinc-300 cursor-pointer">
            See update history
            <motion.span
                className="text-zinc-500"
                key={`update-count-${updates.length}`}
                initial={{ scale: 1 }}
                animate={{
                    scale: [1, 1.1, 1.05, 1.1, 1],
                    rotate: [0, -10, 10, -8, 8, 0],
                }}
                transition={{
                    duration: 0.6,
                    ease: "easeInOut",
                }}
                style={{ display: "inline-block" }}
            >
                ({updates.length})
            </motion.span>
        </div>

        <div>
            <AnimatePresence initial={false} mode="popLayout">
                {!isWritingUpdate ? (
                    <motion.button
                        layoutId="write-update"
                        style={{ borderRadius: '8px' }}
                        className="flex p-2 text-sm hover:bg-zinc-500/10 transition-colors group-hover:opacity-100 border border-zinc-700"
                        title="Write an update"
                        onClick={() => setIsWritingUpdate(true)}
                    >
                        <motion.span
                            layoutId="title"
                            className="text-sm self-start placeholder"
                        >
                            Write an update
                        </motion.span>
                    </motion.button>
                ) : (
                    <motion.div
                        layoutId="write-update"
                        style={{ borderRadius: '8px' }}
                        className="relative h-36 text-sm w-full border border-zinc-700 p-2 flex flex-col justify-between gap-2"
                        transition={{ type: 'spring', bounce: 0, duration: 1 }}
                    >
                        <motion.span
                            data-feedback={updateText ? "true" : "false"}
                            layoutId="title"
                            className="text-sm self-start placeholder absolute text-zinc-500"
                        >
                            Write an update
                        </motion.span>
                        <textarea
                            autoComplete="off"
                            id="update-text"
                            value={updateText}
                            autoFocus
                            onChange={(e) => setUpdateText(e.target.value)}
                            className="w-full min-h-[80px] resize-y rounded-md border-0 bg-transparent text-sm text-zinc-300 placeholder:text-zinc-500 focus:outline-none focus:ring-0"
                            rows={3}
                        />
                        <div className="flex flex-row items-center justify-between gap-2">
                            <UpdateTypeSelector />
                            <div className="flex flex-row items-center gap-2">
                                <motion.button
                                    key="write-update-cancel"
                                    className="hover:bg-zinc-700/50 cursor-pointer px-2 py-1 text-center rounded-md transition-colors group-hover:opacity-100"
                                    title="Cancel"
                                    onClick={() => cancelUpdate()}
                                >
                                    Cancel
                                </motion.button>
                                <motion.button
                                    className="hover:bg-zinc-700/50 cursor-pointer px-2 py-1 text-center rounded-md transition-colors group-hover:opacity-100"
                                    title="Post"
                                    onClick={() => onPostUpdate()}
                                >
                                    Post Update
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    </div>
);
}

const UPDATE_TYPES = ['Done', 'Paused', 'Cancelled'] as const;
const STATUS_COLORS: Record<typeof UPDATE_TYPES[number], string> = {
  Done: '#48c05c',
  Paused: '#D6B500',
  Cancelled: '#AA3F3F',
};

const UPDATE_TYPE_LABELS: Record<typeof UPDATE_TYPES[number], string> = {
  Done: 'I´m done with this',
  Paused: 'Paused for now',
  Cancelled: 'I cancelled this',
};

function UpdateTypeSelector() {
    const [value, setValue] = useState<typeof UPDATE_TYPES[number]>('Done');
    return (
        <Select.Root value={value} onValueChange={(v) => setValue(v as typeof UPDATE_TYPES[number])}>
            <Select.Trigger
                className={`inline-flex items-center gap-2 rounded-md border-0 bg-zinc-900 px-2 py-1 text-sm outline-none hover:opacity-90 data-[state=open]:opacity-90 min-w-0 cursor-pointer`}
                style={{ color: STATUS_COLORS[value] }}
                aria-label="Update status"
            >
                <Select.Value />
            </Select.Trigger>
            <Select.Portal>
                <Select.Content
                    className="overflow-hidden rounded-md border border-zinc-600 bg-[#171717] shadow-lg z-[100] min-w-[160px]"
                    position="popper"
                    sideOffset={4}
                    align="start"
                >
                    <Select.Viewport className="p-1">
                        {UPDATE_TYPES.map((type) => (
                            <Select.Item
                                key={type}
                                value={type}
                                className={`relative flex cursor-default select-none items-center gap-2 rounded px-2 py-1.5 pl-2 text-sm outline-none data-[highlighted]:bg-[#3F444A]`}
                            >
                                <Select.ItemText>{UPDATE_TYPE_LABELS[type]}</Select.ItemText>
                            </Select.Item>
                        ))}
                    </Select.Viewport>
                </Select.Content>
            </Select.Portal>
        </Select.Root>
    )
}

function ProjectName({ project }: { project: UnifiedProject }) {
  return (
    <motion.div
        layout="position"
        layoutId={`project-name-${project.id}`}
        transition={{ layout: { duration: 0.4, ease: 'easeOut' } }}
        initial={false}
    >
        <Link href={project.url} target="_blank">        
            <div className="flex flex-row items-center gap-2">
                <ProjectIcon icon={project.icon} color={project.color} />
                <span className="text-sm text-zinc-400" style={{ color: project.color as string }}>{project.name}</span>
            </div>
        </Link>
    </motion.div>
  )
}

function RunningTimer({ isRunning }: { isRunning: boolean }) {
    const minute = 1000 * 60;
    const [time, setTime] = useState(0);
    useEffect(() => {
    if (!isRunning) {
        setTime(0);
        return;
    }
    const interval = setInterval(() => {
        setTime((t) => t + 1);
    }, minute);
    return () => clearInterval(interval);
    }, [isRunning]);

    const hours = Math.floor(time / 60);
    const minutes = time % 60;
    const formatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    const digits = formatted.split('');
    return (
        <div className="flex flex-row items-center overflow-hidden inline-block font-mono border border-zinc-400 bg-zinc-400/20 rounded-md px-2 py-1">
        {digits.map((digit, i) => (
            <AnimatePresence key={i} initial={false} mode="popLayout">
                <motion.span
                    key={`${i}-${digit}`}
                    initial={{ opacity: 0, y: '-120%' }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: '120%' }}
                    transition={{ type: 'spring', bounce: 0, duration: 1 }}
                >
                {digit}
                </motion.span>
            </AnimatePresence>
        ))}
        </div>
    );
}
