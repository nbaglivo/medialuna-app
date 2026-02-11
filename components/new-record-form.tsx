import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { generateFallbackUuid } from '@/lib/focus-storage';
import { type UnifiedProject } from '@/lib/task-source';
import { type WorkLogItem } from '@/app/actions/day-plan';
import { LinearIssue } from './types';
import { WORK_LOG_RECORD_PLACEHOLDER } from './translations';

enum Step {
    ProvideDescription = 'provideDescription',
    ProvideProject = 'provideProject',
    Accept = 'accept'
}

export function RecordUnitOfWork({ linearIssues, focusedProjects, onWorkLogAdded, onClose }: { linearIssues: LinearIssue[], focusedProjects: UnifiedProject[], onWorkLogAdded: (newItem: WorkLogItem) => void, onClose: () => void }) {
    const ref = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const [newTaskDescription, setNewTaskDescription] = useState('');
    const [mentionQuery, setMentionQuery] = useState('');
    const [mentionStartPos, setMentionStartPos] = useState(0);
    const [showMentionDropdown, setShowMentionDropdown] = useState(false);
    const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
    const [mentionedIssues, setMentionedIssues] = useState<Record<string, string>>({});
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [step, setStep] = useState<Step>(Step.ProvideDescription);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedProjectId, step, showMentionDropdown]);

    const handleAddTask = async () => {
        const description = newTaskDescription.trim();
        if (!description) return;

        // TODO: add unplanned reason 
        // const unplannedReason = selectedProjectId === UNPLANNED_PROJECT_ID ? unplannedReason : undefined;
        const unplannedReason = undefined;

        try {
            const generatedId = globalThis.crypto?.randomUUID?.() ?? generateFallbackUuid();
            const newItem: WorkLogItem = {
                description,
                    projectId: selectedProjectId,
                    unplannedReason,
                    mentionedIssues: Object.keys(mentionedIssues).length > 0 ? mentionedIssues : undefined,
                    duration: undefined, // TODO: add duration (in minutes)
                id: generatedId,
                timestamp: Date.now(),
            };

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
            {/* Main Section */}
            <div className={`px-4 w-full h-full ${step === Step.Accept ? '' : 'grid place-items-center'}`}>
                {step === Step.ProvideDescription && (
                    <motion.input
                        ref={inputRef}
                        id="work-log-input"
                        autoFocus={true}
                        autoComplete='off'
                        value={newTaskDescription}
                        onChange={handleInputChange}
                        placeholder={WORK_LOG_RECORD_PLACEHOLDER}
                        style={{ gridArea: '1 / 1' }}
                        className="flex-1 w-full h-full bg-transparent text-white placeholder-zinc-500 outline-none z-10"
                    />
                )}

                <div
                    style={{ gridArea: '1 / 1' }}
                    className={
                        `w-full rounded-md flex flex-col gap-4 ${step !== Step.ProvideDescription ? 'justify-between items-center' : 'opacity-0'}`
                    }
                >
                    <motion.span
                        layout="position"
                        transition={{ layout: { duration: 0.4, ease: 'easeOut' } }}
                        initial={false}
                        className={
                            ` rounded-md ${step !== Step.ProvideDescription ? 'translate-x-0' : 'opacity-0'}`
                        }
                    >
                        <span
                            className="bg-[#252525] px-1.5 py-0.5 rounded-sm"
                        >
                            {newTaskDescription}
                        </span>
                    </motion.span>

                    <AnimatePresence>
                        {step === Step.ProvideProject && (
                            <ProjectSelector projects={focusedProjects} onProjectSelected={manuallySelectProject} />
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {step === Step.Accept && (
                            <AcceptRecord onAddTask={handleAddTask} />
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

function AcceptRecord({ onAddTask }: { onAddTask: () => void }) {
    return (
        <motion.div
            className="grid grid-cols-3 grid-cols-[3fr_1fr_1fr] gap-3 justify-center items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
        >
            <div className="text-xs text-zinc-500 text-center">
                Want to start right away?
            </div>
            <button
                className='cursor-pointer flex gap-2 items-center justify-center text-center rounded-md border border-[#252525] px-3 py-1.5 text-xs transition-colors'
                onClick={onAddTask}
            >
                Yes, start now
            </button>
            <button
                className='cursor-pointer flex justify-center items-center gap-2 rounded-md border border-[#252525] px-3 py-1.5 text-xs transition-colors'
                onClick={onAddTask}
            >
                Just log it
            </button>
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
            layout
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
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
                            className={`w-full text-left p-2 rounded-md transition-colors ${isSelected ? 'bg-purple-500/20' : 'hover:bg-[#252525]'
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
                                        <span className={`text-xs px-1.5 py-0.5 rounded border ${mention.type === 'issue'
                                            ? 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                                            : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                                            }`}>
                                            {mention.type === 'issue' ? 'Issue' : 'Project'}
                                        </span>
                                        {mention.type === 'issue' && issue?.state && (
                                            <span className={`text-xs px-1.5 py-0.5 rounded ${isInProgress
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

function ProjectSelector({ projects, onProjectSelected }: { projects: UnifiedProject[], onProjectSelected: (projectId: string) => void }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="mt-4 flex flex-col gap-3"
        >
            <h2 className="text-sm text-zinc-500">Was this work done in the scope of an specific project?</h2>
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

type MentionOption = {
    type: 'issue' | 'project';
    label: string;
    url: string;
    issue?: LinearIssue;
    project?: UnifiedProject;
};

const UNPLANNED_PROJECT_ID = '__unplanned__';