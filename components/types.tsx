export type LinearIssue = {
    id: string;
    identifier: string;
    title: string;
    url: string;
    state?: {
      name: string;
    } | null;
    project?: {
      name: string;
    } | null;
};
