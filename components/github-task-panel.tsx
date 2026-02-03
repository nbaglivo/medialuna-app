import { GitHubLogoIcon } from "@radix-ui/react-icons";
export default function GithubTaskPanel() {
    return (
        <div className="flex items-center justify-center gap-4 h-full bg-background border-l border-border">
            <div>
                <GitHubLogoIcon className="size-4" />
            </div>
            <div>
                <h2>Coming Soon</h2>
            </div>
        </div>
    );
}
