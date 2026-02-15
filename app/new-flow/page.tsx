import { LinearProject } from "@/lib/task-source";
import { getLinearData } from "../actions/linear";
import ProjectIcon from "@/components/project-icon";
import DayOutcomes from "./day-outcomes";
import { ExternalLinkIcon } from "@radix-ui/react-icons";

export default async function NewFlowPage() {
    const linearData = await getLinearData();
    return (
        <div className="flex gap-6 w-full h-full mt-8 mx-32">
            <div className="w-2/3">
                <DayOutcomes />
            </div>
            <div className="w-1/3 flex flex-col gap-2">
                <h2 className="text-lg font-medium">Projects in Focus</h2>
                <ProjectList projects={linearData.projects} />
            </div>
        </div>
    );
}

function ProjectList({ projects }: { projects: LinearProject[] }) {
    return (
        <div>
            <ul className="flex flex-col gap-2">
                {projects.map((project) => (
                    <li
                        className="bg-surface-muted px-3 py-2 rounded-md flex items-center justify-between gap-2"
                        key={project.id}
                    >
                        <div className="flex items-center gap-2">
                            <ProjectIcon icon={project.icon} color={project.color} />
                            {project.name}
                        </div>
                        <a
                            className="cursor-pointer p-1 flex gap-1 items-center text-sm text-zinc-500 bg-surface-muted rounded-md bg-zinc-900"
                            href={project.url}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <span>Open in Linear</span>
                            <ExternalLinkIcon className="size-4" />
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
}
