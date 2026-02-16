'use client';

import Link from "next/link";
import { PlayIcon } from "@radix-ui/react-icons";
import { GoalSetWithGoals } from "@/lib/goal-sets";
import { motion } from "motion/react";
import { useState } from "react";
import { closeGoalSet } from "./actions";
import ListBulletIcon from "./list-bullet-icon";

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
                            className="flex justify-between gap-2 p-2 group bg-zinc-900 rounded-md"
                        >
                            <motion.div
                                layout
                                layoutId={`goal-container-${goal.id}`}
                                className="flex items-center gap-2"
                            >
                                <ListBulletIcon />
                                <motion.span
                                    layoutId={`goal-title-${goal.id}`}
                                >{goal.text}</motion.span>
                            </motion.div>
                            <div className="flex items-center gap-2">
                                {/* <button
                                    onClick={() => { }}
                                    className="flex-shrink-0 p-1.5 rounded-md text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                                    title="Delete task"
                                >
                                    <TrashIcon className="size-4" />
                                </button> */}
                                <PlayLink goalId={goal.id} />
                            </div>
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

function PlayLink({ goalId }: { goalId: string }) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <Link
            href={`/new-flow/focus/${goalId}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="px-1 rounded-md text-zinc-500 hover:text-purple-400 hover:bg-purple-500/10"
            title="Start tracking task time"
        >
            <motion.div
                layoutId={`play-link-${goalId}`}
                layout
                className="flex items-center gap-1 overflow-hidden"
            >
                <motion.span layout="position" layoutId={`play-icon-${goalId}`}><PlayIcon className="size-4" /></motion.span>
                { isHovered && (
                    <motion.span
                        layoutId={`start-focus-text-${goalId}`}
                        initial={{ opacity: 0, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, transition: { duration: 0 } }}
                        transition={{ duration: 0.1, ease: 'easeInOut' }}
                    >
                        Start
                    </motion.span>
                )}
            </motion.div>
        </Link>
    );
}
