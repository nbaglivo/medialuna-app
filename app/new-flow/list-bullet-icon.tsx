'use client';
import { motion } from "motion/react";
export default function ListBulletIcon({ pulse }: { pulse?: boolean }) {
    return (
        <motion.span className={`inline-block rounded-full size-1 m-1 bg-zinc-400 ${pulse ? 'animate-pulse' : ''}`}></motion.span>
    );
}
