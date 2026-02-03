import IndexPageClient from '@/components/index-page-client';
import { TaskSources, taskSourceValues, type TaskSource } from '@/lib/task-source';

// export default function Home() {
//   return (
//     <div className="flex min-h-screen items-center justify-center font-sans">
//       <main className="flex min-h-screen w-full max-w-3xl flex-col items-center py-32 px-16">
//         <Image
//           src="/logo.png"
//           alt="Medialuna logo"
//           width={100}
//           height={20}
//           priority
//         />
//         <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
//           <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight">
//             Soon.
//           </h1>
//         </div>
//       </main>
//     </div>
//   );
// }


// import { Plus, Settings } from "lucide-react";
// import { Link, useNavigate } from "react-router-dom";
// import { TaskSource } from "@/modules/tasks";
// import { getTodaysPlan, removeTaskFromDailyPlan } from "@/modules/daily-plan";
// import TaskList from "@/components/TaskList";
// import IntegrationMenu from "@/components/IntegrationMenu";
// import LinearTasksPanel from "@/components/LinearTasksPanel";
// import AppTasksPanel from "@/components/AppTasksPanel";
// import { Button } from "@/components/ui/button";
// import { useTaskContext } from "@/contexts/TaskContext";

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function resolveIntegration(param: string | string[] | undefined): TaskSource {
  const value = Array.isArray(param) ? param[0] : param;
  if (value && taskSourceValues.has(value as TaskSource)) {
    return value as TaskSource;
  }
  return TaskSources.App;
}

function serializeSearchParams(
  params: Record<string, string | string[] | undefined>
): string {
  const nextParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (entry) {
          nextParams.append(key, entry);
        }
      });
      return;
    }
    if (value) {
      nextParams.set(key, value);
    }
  });
  return nextParams.toString();
}

export default function Index({ searchParams = {} }: PageProps) {
  const initialIntegration = resolveIntegration(searchParams.integration);
  const initialSearchParams = serializeSearchParams(searchParams);

  return (
    <IndexPageClient
      initialIntegration={initialIntegration}
      initialSearchParams={initialSearchParams}
    />
  );
}
