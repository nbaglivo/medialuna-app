import Link from "next/link";
import { getLinearData } from "@/app/actions/linear";
import { getOrCreateFocusSessionForGoal } from "@/app/new-flow/actions";
import FocusView from "./focus-view";
import { notFound } from "next/navigation";
import { getGoalById } from "@/lib/goal-sets";
import { LinearProject } from "@/lib/linear";

export default async function FocusPage({ params }: { params: Promise<{ goalId: string }> }) {
    const { goalId } = await params;

    if (!goalId) {
        return notFound();
    }

    const linearData = await getLinearData();
    const mockProject = linearData.connected ? linearData.projects[0] : null;

    const [goal, session] = await Promise.all([
        getGoalById(goalId),
        getOrCreateFocusSessionForGoal(goalId),
    ]);

    if (!goal) {
        return notFound();
    }

    return (
        <div className="flex flex-col justify-between gap-4 w-2/3 h-full mt-8 mx-32 bg-surface-muted p-4 rounded-md">
            <FocusView goal={goal} session={session} project={mockProject as unknown as LinearProject} />
            <div className="flex justify-end">
                <Link
                    href="/new-flow"
                    className="text-sm text-zinc-400 hover:text-zinc-300 cursor-pointer"
                >
                    Take a break
                </Link>
            </div>
        </div>
    );
}
