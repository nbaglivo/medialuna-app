import DayWorkPageClient from '@/components/day-work-page-client';
import { ArrowLeftIcon } from '@radix-ui/react-icons';
import Link from 'next/link';

export default function DayWorkPage() {
  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[#141414]">
      {/* Header */}
      <div className="border-b border-[#333] px-4 pt-12 pb-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <Link
                  href="/?mode=projects"
                  className="p-2 rounded-full hover:bg-[#252525] transition-colors"
                  title="Back to all projects"
                >
                  <ArrowLeftIcon className="text-zinc-400 size-4" />
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-white">Today's work</h1>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/day-summary" className="px-3 py-1 rounded-md hover:bg-[#252525] transition-colors">
                Close the Day
              </Link>
            </div>
          </div>
        </div>
      </div>
      <DayWorkPageClient />
    </div>
  )
}
