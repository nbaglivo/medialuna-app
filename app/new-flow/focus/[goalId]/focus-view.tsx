'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as Select from '@radix-ui/react-select';
import { ChevronRightIcon } from "@radix-ui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { LinearProject } from "@/lib/linear";
import ProjectIcon from "@/components/project-icon";
import { Goal } from "@/lib/goal-sets";
import './focus-view.css';

export default function FocusView({ goal, project }: { goal: Goal, project: LinearProject }) {
    const router = useRouter();
    const [isTracking, setIsTracking] = useState(false);
    const [isWritingUpdate, setIsWritingUpdate] = useState(false);
    const [updates, setUpdates] = useState<{ text: string, type: typeof UPDATE_TYPES[number] }[]>([]);
    const [updateText, setUpdateText] = useState('');
  
    const onPostUpdate = () => {
        const updateType = UPDATE_TYPES[0];
        setUpdates([...updates, { text: updateText, type: updateType }]);
        setUpdateText('');
        setIsWritingUpdate(false);

      if (updateType === 'Done') {
        router.push('/new-flow');
      }
    }
  
    const cancelUpdate = () => {
      setUpdateText('');
      setIsWritingUpdate(false);
    }
  
    return (
      <div className="flex flex-col gap-4">
          <div className="flex flex-row items-center justify-between gap-2">
                <div className="flex flex-col gap-2">

                <div className="text-sm text-zinc-400">Focusing on</div>
                <h1 className="text-2xl font-bold">{goal.text}</h1>
                    <ProjectName url={project.url} icon={project.icon ?? undefined} color={project.color ?? undefined} name={project.name} id={project.id} />
                </div>
                <RunningTimer isRunning={isTracking} />
          </div>
  
          <div className="text-sm flex items-center gap-2 text-zinc-400 hover:text-zinc-300 cursor-pointer">
              <ChevronRightIcon className="size-4" />
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

function ProjectName({ url, icon, color, name, id }: { url: string, icon?: string, color?: string, name: string, id: string }) {
    return (
      <motion.div
          layout="position"
          layoutId={`project-name-${id}`}
          transition={{ layout: { duration: 0.4, ease: 'easeOut' } }}
          initial={false}
      >
          <Link href={url ?? ''} target="_blank">        
              <div className="flex flex-row items-center gap-2">
                  <ProjectIcon icon={icon} color={color} />
                  <span className="text-sm text-zinc-400" style={{ color: color as string }}>{name}</span>
              </div>
          </Link>
      </motion.div>
    )
  }