import { Issue, LinearClient, Project } from "@linear/sdk";

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

export async function getUser(token: string): Promise<LinearUser> {
    const client = new LinearClient({ accessToken: token });
    const viewer = await client.viewer;
    return { id: viewer.id, name: viewer.name, email: viewer.email };
}

function mapLinearProject(project: Project): LinearProject {
    return {
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
    };
}

export async function getProjects(token: string): Promise<LinearProject[]> {
    const client = new LinearClient({ accessToken: token });
  
    const projectsResponse = await client.projects({ first: 50 });
    const rawProjects = projectsResponse.nodes ?? [];
  
    return rawProjects.map(mapLinearProject);
}

export async function getProjectsByView(token: string, viewId: string): Promise<LinearProject[]> {
    const client = new LinearClient({ accessToken: token });
    const view = await client.customView(viewId);
    const projects = await view.projects({ first: 50 });
    return projects.nodes.map(mapLinearProject);
}

export async function getProjectViews(token: string): Promise<LinearProjectView[]> {
    const client = new LinearClient({ accessToken: token });
    const viewsConnection = await client.customViews({
        filter: {
            modelName: { eq: "Project" }
        }
    });
    
    const views = await viewsConnection.nodes;

    console.log('views', views);

    return views.map((view) => ({
        ...view,
        id: view.id,
        name: view.name,
        description: view.description ?? null,
        icon: view.icon ?? null,
        color: view.color ?? null,
    }));
}

export async function getIssuesByProjects(token: string, projectIds: string[]): Promise<LinearIssue[]> {
    const client = new LinearClient({ accessToken: token });
    const issues = await client.issues({
        filter: {
            project: { id: { in: projectIds } }
        }
    });
    return issues.nodes.map(mapLinearIssue);
}

export type LinearProjectView = {
    id: string;
    name: string;
    description?: string | null;
    icon?: string | null;
    color?: string | null;
};

export type LinearIssue = {
    id: string;
    identifier: string;
    title: string;
    url: string;
    priority?: number | null;
    estimate?: number | null;
    state?: {
      name: string;
    } | null;
    project?: {
      name: string;
    } | null;
};

function mapLinearIssue(issue: Issue): LinearIssue {
    return {
        id: issue.id,
        identifier: issue.identifier,
        title: issue.title,
        url: issue.url,
    };
}
