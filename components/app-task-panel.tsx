import { useState } from "react";
import { PlusIcon, MagnifyingGlassIcon, Cross2Icon } from "@radix-ui/react-icons";

export default function AppTaskPanel() {
  const [searchQuery, setSearchQuery] = useState("");
  const backlogTasks: any[] = [];

  const filteredItems = backlogTasks.filter((task: any) =>
    task.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  async function addToPlan(id: number) {
  }

  return (
    <div className="w-[432px] h-full bg-background border-l border-border flex flex-col">
      <div className="p-4 border-b border-border flex justify-between items-center">
        <h2 className="text-lg font-semibold">Tasks Backlog</h2>
        <button
            //   onClick={() => navigate("/add-task?destination=backlog")}
            //   variant="outline"
              className="flex items-center rounded-md bg-[#1e1e1e] hover:bg-[#252525] text-zinc-400 hover:text-zinc-300 transition-colors border border-[#333]"
            >
              <PlusIcon className="size-4" />
            </button>
      </div>

      <div className="p-3">
        <div className="flex items-center px-3 py-2 rounded-md bg-secondary">
          <MagnifyingGlassIcon className="text-muted-foreground mr-2 size-4" />
          <input
            type="text"
            className="bg-transparent border-none outline-none w-full text-sm placeholder:text-muted-foreground"
            placeholder="Filter tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="text-muted-foreground hover:text-muted-foreground"
              onClick={() => setSearchQuery("")}
            >
              <Cross2Icon className="size-4" />
            </button>
          )}
        </div>
      </div>

      <div className="p-2 flex justify-between items-center">
        <span className="text-xs text-muted-foreground">
          Showing {filteredItems.length} tasks
        </span>
      </div>

      <div className="flex-1 overflow-auto">
        {filteredItems.length > 0 ? (
          <div className="p-2 space-y-2">
            {filteredItems.map((item) => (
            //   <BacklogTaskComponent
            //     key={item.id}
            //     task={item}
            //     onCTA={addToPlan}
            //   />
            <div>Backlog task component</div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-center p-4">
            <p className="text-sm text-muted-foreground">
              No tasks found
            </p>
            {searchQuery && (
              <button
                className="mt-2 text-xs text-primary hover:underline"
                onClick={() => setSearchQuery("")}
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
