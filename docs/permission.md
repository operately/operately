# Security Model

In Operately, there are five types of users:

- **Owner**: Account owner with full access to everything.
- **Admin**: Organization admin with access to organization settings, and user management.
- **Member**: Regular user with access to organization resources.
- **Outside Collaborator**: External user with access to specific resources, e.g., contractors, consultants, and prominent community members.
- **Public Visitor**: Anyone on the internet with access to public resources.

To organize access to information to these Operately uses the combination of 
privacy and access levels on resources.

Access Levels:

- **Full Access**: The user can do anything with the resource.
- **Edit Access**: The user can edit the resource, but cannot delete it or change visibility settings, or share it with others unless explicitly granted access to share.
- **Comment Access**: The user can view the resource and add comments to it, but cannot edit, delete, or share it with others.
- **View Access**: The user can only view the resource and cannot edit, delete, or share it with others, or comment on it.
- **No Access**: The user has no access to the resource.

Privacy:

- **Public**: The resource is visible to everyone on the internet.
- **Internal**: The resource is visible to members, admins, and owners of the organization.
- **Confidential**: The resource is visible to everyone in the space.
- **Secret**: You need to be explicitly invited to access the resource.

The rest of this document describes how these access levels and visibility settings are applied to 
different resources in Operately.

- [Architecture](security/architecture.md)

## Security Policies

### Organization Settings

Access to organization settings is controlled by the user's role in the organization:

- **Owner**: The user has `Full-Access` to organization settings, and can add/remove members, add/remove owners, change 2FA settings, change email settings, change billing settings, delete the organization, and export data.
- **Admin**: The user has `Edit-Access` to organization settings, and can add/remove members.

Other users, including members, outside collaborators, and public visitors, have `No-Access` to organization settings.

### Spaces

Owners, admins, and members can create spaces in the organization. Once a space is created, 
the owner can set the visibility of the space to `Public`, `Internal`, or `Invite-Only` and
invite members to the space.

Access levels for space members are granting:

- `View-Access`: The user can view the space and its public, internal, or space-wide goals and projects.
- `Comment-Access`: Everything in `View-Access`, plus the user can start a conversation on the space, and comment on public, internal, or space-wide goals and projects.
- `Edit-Access`: Everything in `Comment-Access`, plus the user can create projects, and goals.
- `Full-Access`: Everything in `Edit-Access`, plus the user can change space settings, delete the space, and add/remove members.

Joining the space without an invitation is possible for spaces with `Public` or `Internal` visibility.

### Project Roles

Access levels for project members are granting:

- `View-Access`: The user can view the project.
- `Comment-Access`: The user can view the project, can comment on tasks, check-ins, and milestones.
- `Edit-Access`: Everything in `Comment-Access`, plus the user can create tasks, check-ins, milestones, edit the project name, description, deadline, and pause and close the project.
- `Full-Access`: Everything in `Edit-Access`, plus the user can add/remove collaborators, and delete the project.

Depending on the role of the collaborator:

- **Champion**: The user has `Full-Access` to the project, and can't be downgraded.
- **Reviewer**: The user has `Full-Access` to the project, and can't be downgraded.
- **Member**: By default, the user has `Edit-Access` to the project, but can be downgraded to `Comment-Access` or `View-Access`.

Joining the project without an invitation is possible for `Public`, `Internal`, and `Space-Wide` projects.

### Goal Roles

Access levels for goal members are granting:

- `View-Access`: The user can view the goal.
- `Comment-Access`: The user can view the goal, can leave messages, comments on the goal, and progress updates.
- `Edit-Access`: Everything in `Comment-Access`, plus the user can create progress updates, edit the goal name, description, deadline, and pause and close the goal.
- `Full-Access`: Everything in `Edit-Access`, plus the user can add/remove collaborators, and delete the goal.

Depending on the role of the collaborator:

- **Champion**: The user has `Full-Access` to the goal, and can't be downgraded.
- **Reviewer**: The user has `Full-Access` to the goal, and can't be downgraded.
