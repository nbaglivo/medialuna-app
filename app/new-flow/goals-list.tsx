'use client';

import Link from "next/link";
import { PlayIcon } from "@radix-ui/react-icons";
import { Goal, GoalSetWithGoals } from "@/lib/goal-sets";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { closeGoalSet } from "./actions";
import ListBulletIcon from "./list-bullet-icon";
import { UpdateType } from "@/lib/goal-focus-sessions";

export default function GoalList({ openGoalSet }: { openGoalSet: GoalSetWithGoals }) {
    return (
        <div className="bg-surface-muted flex flex-col gap-2 justify-between h-full">
            <div>
                <div className="m-3 flex gap-6 items-center">
                    <h2 className="text-lg font-medium">Today's goals</h2>
                </div>
                <ul className="flex flex-col gap-2">
                    {openGoalSet.goals.map((goal) => (
                        <motion.li
                            layoutId={`day-outcome-${goal.id}`}
                            key={`display-outcome-list-item-${goal.id}`}
                            className="w-full bg-zinc-900 rounded-md"
                        >
                            <GoalListItem goal={goal} />
                        </motion.li>
                    ))}
                </ul>
            </div>
            <motion.div
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-col gap-2"
            >
                <div className="bg-zinc-900 p-3 shadow-lg flex justify-center items-center gap-2 w-full">
                    <button
                        className="bg-surface-muted py-2 px-4 rounded-md border border-zinc-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => closeGoalSet(openGoalSet.id)}
                    >
                        Close this session
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

function GoalListItem({ goal }: { goal: Goal }) {
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseEnter = () => {
        setIsHovered(true);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
    };

    return (
        <motion.div
            layout
            layoutId={`goal-container-${goal.id}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="flex flex-col gap-2 p-2"
        >
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">                        
                    <motion.span layout><ListBulletIcon /></motion.span>
                    <motion.span
                        layoutId={`goal-title-${goal.id}`}
                    >
                        {goal.text}
                    </motion.span>
                </div>
                <div className="flex justify-end gap-2">
                {/* <button
                    onClick={() => { }}
                    className="flex-shrink-0 p-1.5 rounded-md text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete task"
                >
                    <TrashIcon className="size-4" />
                </button> */}
                    <PlayLink goalId={goal.id} active={isHovered} state={goal.latestState?.type} />
                </div>
            </div>
            <AnimatePresence mode="popLayout">
                {isHovered && (
                    <motion.span
                        // layout="position"
                        // layoutId={`goal-update-type-${goal.id}`}
                        initial={{ opacity: 0, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, filter: 'blur(10px)' }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                    >
                        {formatUpdateType(goal.latestState?.type)}
                    </motion.span>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

function formatUpdateType(type: UpdateType | undefined) {
    switch (type) {
        case 'start':
            return  '[Started]';
        case 'stopped':
            return '[Stopped]';
        case 'finished':
            return '[Completed]';
        case 'abandoned':
            return '[Abandoned]';
        default:
            return '[No updates]';
    }
}

function PlayLink({ goalId, state, active }: { goalId: string, state: UpdateType | undefined, active: boolean }) {

    let label = 'Start';
    switch (state) {
        case 'start':
            label = 'Resume';
            break;
        case 'stopped':
            label = 'Resume';
            break;
        case 'finished':
            label = 'Reopen';
            break;
        case 'abandoned':
            label = 'Resume';
            break;
    }

    return (
        <Link
            href={`/new-flow/focus/${goalId}`}
            className="px-1 rounded-md text-zinc-500 hover:text-purple-400 hover:bg-purple-500/10"
            title="Start tracking task time"
        >
            <motion.div
                layoutId={`play-link-${goalId}`}
                layout
                className="flex items-center gap-1 overflow-hidden"
            >
                <motion.span layout="position" layoutId={`play-icon-${goalId}`}><PlayIcon className="size-4" /></motion.span>
                { active && (
                    <motion.span
                        layoutId={`start-focus-text-${goalId}`}
                        initial={{ opacity: 0, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, transition: { duration: 0 } }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                    >
                        {label}
                    </motion.span>
                )}
            </motion.div>
        </Link>
    );
}
