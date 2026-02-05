'use client';

import ProjectCard from "@/components/project-card";
import { TaskSources, type UnifiedProject } from "@/lib/task-source";

const project: UnifiedProject = {
  id: "1",
  name: "Project 1",
  description: "Project 1 description",
  source: TaskSources.Linear,
  url: "https://linear.app/project/1",
};

export default function TestPage() {
  return (
        <div className="flex flex-col items-center justify-center h-screen">
            <div className="w-full flex justify-center items-center max-w-md">
                <div className="relative hover:rotate-y-180 hover:z-30 hover:scale-105 transition-all duration-400">
                    <ProjectCard project={project} isSelected={false} onProjectToggle={() => {}} />
                    <div className="absolute top-0 left-0 w-full h-full bg-black rotate-y-180">
                        The other side of the card
                    </div>
                </div>
            </div>
        </div>
    );
}
