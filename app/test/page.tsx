'use client';

export default function TestPage() {
    return (
        <div className="flex flex-col items-center justify-center h-screen">
            {/* <div className="w-full flex justify-center items-center max-w-md">
                <div className="relative hover:rotate-y-180 hover:z-30 hover:scale-105 transition-all duration-400">
                    <ProjectCard project={project} isSelected={false} onProjectToggle={() => {}} />
                    <div className="absolute top-0 left-0 w-full h-full bg-black rotate-y-180">
                        The other side of the card
                    </div>
                </div>
            </div> */}

            <UnalomeSymbolStatic className="size-16" />
            <UnalomeSymbol />
        </div>
    );
}

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

function UnalomeSymbol() {
    const [animationComplete, setAnimationComplete] = useState(false);
    return (
        <svg
            viewBox="0 0 280 460"
            xmlns="http://www.w3.org/2000/svg"
        >
            <defs>
                <motion.linearGradient
                    id="animatedGradient"
                    x1="0"
                    x2="0"
                    animate={{
                        y1: ["460", "0", "460"],
                        y2: ["0", "460", "0"],
                        transition: {
                            duration: 6,
                            ease: "linear",
                            repeat: Infinity,
                        },
                    }}
                >
                    <motion.stop offset="0%" stopColor="#0A2F24" />
                    <motion.stop offset="45%" stopColor="#146B45" />
                    <motion.stop offset="80%" stopColor="#1FA463" />
                    <motion.stop offset="100%" stopColor="#7CFFB6" />
                </motion.linearGradient>
            </defs>

            {/* Drawing Path */}
            <motion.path
                d="
                    M240 390
                    C160 420, 40 360, 100 290
                    C150 230, 230 260, 170 205
                    C135 175, 90 200, 130 155
                    C160 125, 170 140, 140 115
                    C120 100, 130 85, 140 70
                    C145 62, 142 54, 140 50
                    L140 50
                "
                fill="none"
                stroke="url(#animatedGradient)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="1200"
                strokeDashoffset="1200"
                animate={{ strokeDashoffset: 0 }}
                transition={{ duration: 3, ease: "easeInOut" }}
                onAnimationComplete={() => {
                    setAnimationComplete(true);
                }}
            />

            {/* Pulsing Dot */}
            <AnimatePresence>
            {animationComplete && (
            <motion.circle
                cx="140"
                cy="35"
                r="8"
                key="pulse"
                fill="#7CFFB6"
                style={{ transformOrigin: "center" }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                    scale: [0.8, 1.1, 0.8],
                    opacity: [1, 0.6, 1],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />
            )}
            </AnimatePresence>
        </svg>
    );
};


function UnalomeSymbolStatic({ className }: { className: string }) {
    return (
    <svg className={className} viewBox="0 0 280 460" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <linearGradient id="freehandGreenCenteredTip" x1="0" y1="460" x2="0" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0A2F24"/>
            <stop offset="45%" stopColor="#146B45"/>
            <stop offset="80%" stopColor="#1FA463"/>
            <stop offset="100%" stopColor="#7CFFB6"/>
        </linearGradient>
    </defs>
    
    <path
        d="
        M240 390
        C160 420, 40 360, 100 290
        C150 230, 230 260, 170 205
        C135 175, 90 200, 130 155
        C160 125, 170 140, 140 115
        C120 100, 130 85, 140 70
        C145 62, 142 54, 140 50
        L140 50
        "
        fill="none"
        stroke="url(#freehandGreenCenteredTip)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
    />
    
    <circle cx="140" cy="35" r="8" fill="#7CFFB6" />
    </svg>
    );
}