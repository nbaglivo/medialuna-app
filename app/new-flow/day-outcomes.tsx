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
        <div className="bg-surface-muted h-full p-4 rounded-md">
            <AnimatePresence mode="popLayout" initial={false}>

            {isEditing ? (
                <DayOutcomesEditor onFinishEditing={finishEditing} />
            ) : (
                <DayOutcomesDisplay dayOutcomes={dayOutcomes} />
            )}
            </AnimatePresence>
        </div>
    );
}

export function DayOutcomesDisplay({ dayOutcomes }: { dayOutcomes: string[] }) {
    return (
        <div className="bg-surface-muted">
            <div className="m-3">
                <h2 className="text-lg font-medium">Today's goals</h2>
            </div>
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
        if (e.key === 'Enter') {
            if (currentText.trim() === '') {
                return;
            }
            addDayOutcome();
            e.preventDefault();
        }
    };

    return (
        <div className="bg-transparent flex flex-col justify-between h-full">
            <div>
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
                            <ListBulletIcon pulse={true} />
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
            </div>

                <motion.div
                    exit={{ opacity: 0, height: 0 }}
                    className="flex flex-col gap-2"
                >
                    <TipBox />
                    <div className="bg-zinc-900 p-3 shadow-lg flex justify-center items-center gap-2 w-full">     
                        <button
                            className="bg-surface-muted py-2 px-4 rounded-md border border-zinc-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={finishEditing}
                            disabled={dayOutcomes.length === 0}
                        >
                            I´m done. These are my goals for today.
                        </button>
                    </div>
                </motion.div>
        </div>
    );
}

function ListBulletIcon({ pulse }: { pulse?: boolean }) {
    return (
        <span className={`inline-block rounded-full size-1 m-1 bg-zinc-400 ${pulse ? 'animate-pulse' : ''}`}></span>
    );
}

function TipBox() {
    const tips = [
        "Do not add too many goals. Usually 1 to 3 is a good number for a day.",
    ];
    return (
        <div className="w-full mt-1 py-2 px-2 border-t-1 border-b-1 border-[#333] bg-[#1a1a1a] shadow-lg">
            <div className="text-sm text-zinc-500 flex items-center gap-1">
                <span className="font-mono text-[10px] bg-zinc-500/10 border border-zinc-500 px-2 py-0.5 rounded-sm">Tip</span>
                <div>{tips[0]}</div>
            </div>
        </div>
    );
}
