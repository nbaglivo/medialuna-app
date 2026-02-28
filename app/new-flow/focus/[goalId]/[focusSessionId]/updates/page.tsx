import { getFocusSessionWithUpdates, getGoalById } from "@/app/new-flow/actions";
import { notFound } from "next/navigation";

export default async function UpdatesPage({ params }: { params: Promise<{ focusSessionId: string, goalId: string }> }) {
    const { focusSessionId, goalId } = await params;

    if (!focusSessionId || !goalId) {
        return notFound();
    }
    const goal = await getGoalById(goalId);
    const focusSession = await getFocusSessionWithUpdates(focusSessionId);

    if (!focusSession || !goal) {
        return notFound();
    }

    return (
        <div className="flex flex-col w-2/3 h-full mt-8 mx-32 bg-surface-muted p-6 rounded-md">
            <h1 className="text-2xl font-bold mb-6">Updates for {goal.text}</h1>
            <div className="relative pl-20 py-12">
                {/* Vertical timeline line */}
                <div
                    className="absolute left-[67px] top-0 bottom-0 w-px bg-zinc-600"
                    aria-hidden
                />
                {focusSession.updates.map((update) => (
                    <div
                        key={update.id}
                        className="relative flex gap-4 pb-8 last:pb-0"
                    >
                        {/* Timeline node */}
                        <div
                            className="absolute left-[-19px] top-[9px]"
                            aria-hidden
                        >
                            <div className="absolute w-3 h-3 rounded-full border-2 border-zinc-500 bg-surface-muted shrink-0" />
                            <span className="text-sm text-zinc-500 absolute left-[-40px] top-[-10px]">
                                {getDateDisplay(update.createdAt)}
                            </span>

                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                            <div className="flex items-start gap-4">
                                <div className="flex flex-col items-start gap-1 shrink-0">
                                    <span className="font-mono font-bold px-1.5 py-0.5 border border-zinc-500 rounded-sm bg-zinc-900 text-sm text-zinc-400">
                                        {update.type}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-1 min-w-0">
                                    <span className="text-zinc-300">{update.note}</span>
                                    {update.feeling && (
                                        <span className="text-sm text-zinc-500">{update.feeling}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Returns a date string in the format of "MM/DD" and time in the format of "HH:MM" 
function getDateDisplay(date: string) {
    const dateString = new Date(date).toLocaleDateString('en-US', { day: '2-digit' });
    const timeString = new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return timeString;
}
