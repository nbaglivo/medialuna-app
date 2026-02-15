'use client';

import { PlayIcon } from "@radix-ui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";

export default function DayOutcomes() {
    const [dayOutcomes, setDayOutcomes] = useState<string[]>([]);
    const [isEditing, setIsEditing] = useState<boolean>(true);

    const finishEditing = (dayOutcomes: string[]) => {
        setDayOutcomes(dayOutcomes);
        setIsEditing(false);
    };

    return (
        <div className="bg-surface-muted min-h-[400px]">
            {isEditing ? (
                <DayOutcomesEditor onFinishEditing={finishEditing} />
            ) : (
                <DayOutcomesDisplay dayOutcomes={dayOutcomes} />
            )}
        </div>
    );
}

export function DayOutcomesDisplay({ dayOutcomes }: { dayOutcomes: string[] }) {
    return (
        <div className="bg-surface-muted">
            <ul>
                {dayOutcomes.map((outcome, index) => (
                    <motion.li
                        layoutId={`day-outcome-${index}`}
                        key={`display-outcome-list-item-${index}`}
                        className="flex justify-between gap-2 p-2 group"
                    >
                        <div className="flex items-center gap-2">
                            <ListBulletIcon />
                            {outcome}
                        </div>
                        <Link href={`/new-flow/focus?outcome=${outcome}`} className="cursor-pointer p-1 group-hover:opacity-100 opacity-0 transition-opacity duration-200">
                            <PlayIcon className="size-4" />
                        </Link>
                    </motion.li>
                ))}
            </ul>
        </div>
    );
}

export function DayOutcomesEditor({ onFinishEditing }: { onFinishEditing: (dayOutcomes: string[]) => void }) {
    const [dayOutcomes, setDayOutcomes] = useState<string[]>([]);
    const [currentText, setCurrentText] = useState<string>('');

    const addDayOutcome = () => {
        setDayOutcomes([...dayOutcomes, currentText]);
        setCurrentText('');
    };

    const finishEditing = () => {
        onFinishEditing(dayOutcomes);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && e.shiftKey) {
            if (currentText.trim() === '') {
                return;
            }
            addDayOutcome();
            e.preventDefault();
        }
    };

    return (
        <div className="bg-transparent h-full">
            <div className="m-3">
                <h2 className="text-lg font-medium">What would make today a good day?</h2>
            </div>

            <ul>
                {dayOutcomes.map((outcome) => (
                    <motion.li
                        key={`draft-outcome-list-item-${outcome}`}
                        // layoutId={`day-outcome-${outcome}`}
                        className="flex items-center gap-2 p-2"
                    >
                        <ListBulletIcon />
                        {outcome}
                    </motion.li>
                ))}
            </ul>

            <div className="grid mt-4">
                {/* <AnimatePresence mode="popLayout" initial={false}>
                    {currentText && (
                        <motion.div
                            key={`day-outcome-preview-${currentText}`}
                            layoutId={`day-outcome-${currentText}`}
                            layout="position"
                            className="absolute top-0 left-0 opacity-0"
                            style={{ opacity: '0 !important' }}
                        >
                            <ListBulletIcon />
                            <motion.span layout="position">{currentText}</motion.span>
                        </motion.div>
                    )}
                </AnimatePresence> */}
            
                <div
                    className="flex items-start gap-2"
                >
                    <div className="pt-0.5 pl-2">
                        <ListBulletIcon />
                    </div>
                    <textarea
                        onKeyDown={handleKeyDown}
                        value={currentText}
                        onChange={(e) => setCurrentText(e.target.value)}
                        id="day-outcome"
                        className={
                            `w-full h-full
                            bg-transparent
                            focus:outline-none
                        `}
                        placeholder="Add a desired outcome for today"
                    />
                </div>
            </div>

            <div className="flex self-end items-center gap-2 w-full m-6">
                <button
                    className="bg-surface-muted p-2 rounded-md border border-zinc-600 cursor-pointer"
                    onClick={finishEditing}
                    disabled={dayOutcomes.length === 0}
                >
                    Set as goals for today
                </button>
            </div>
        </div>
    );
}

function ListBulletIcon() {
    return (
        <span className="inline-block rounded-full size-1 m-1 bg-zinc-400"></span>
    );
}
