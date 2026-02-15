import { WorkLogItem } from "@/app/actions/day-plan";
import FocusView from "./focus-view";
import { getLinearData } from "@/app/actions/linear";
import Link from "next/link";

export default async function FocusPage({ searchParams }: { searchParams: Promise<{ outcome: string }> }) {
    const { outcome } = await searchParams;

    if (!outcome) {
        return <div>No outcome selected</div>;
    }

    const linearData = await getLinearData();
    const fakeProject = linearData.connected ? linearData.projects[0] : null;

    const fakeWorkLogItem: WorkLogItem = {
        id: '1',
        description: outcome,
        timestamp: Date.now(),
        projectId: fakeProject?.id ?? null,
    };

    return (
        <div className="flex flex-col justify-between gap-4 w-2/3 h-full mt-8 mx-32 bg-surface-muted p-4 rounded-md">
            <FocusView workLogItem={fakeWorkLogItem} project={fakeProject} />
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
