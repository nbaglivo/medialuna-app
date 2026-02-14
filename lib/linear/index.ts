import { LinearClient } from "@linear/sdk";

export type LinearProject = {
  id: string;
  name: string;
  description?: string | null;
  url: string;
  state: string;
  progress: number;
  icon?: string | null;
  color?: string | null;
  targetDate?: string | null;
  startDate?: string | null;
};

export type LinearUser = {
    id: string;
    name?: string;
    email?: string;
};
  
export type LinearData = {
    user: LinearUser;
    projects: LinearProject[];
};

export async function getDataFromLinear(token: string): Promise<LinearData> {
    const client = new LinearClient({ accessToken: token });
  
    const viewer = await client.viewer;
    const user = { id: viewer.id, name: viewer.name, email: viewer.email };
  
    const projectsResponse = await client.projects({ first: 50 });
    const rawProjects = projectsResponse.nodes ?? [];

    console.log('rawProjects', rawProjects);
  
    const projects: LinearProject[] = rawProjects.map((project) => ({
        id: project.id,
        name: project.name,
        description: project.description ?? null,
        url: project.url,
        state: project.state,
        progress: project.progress,
        icon: project.icon ?? null,
        color: project.color ?? null,
        targetDate: project.targetDate ?? null,
        startDate: project.startDate ?? null,
    }));
  
    return { user, projects };
}
