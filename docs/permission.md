# Security Model

To organize access to information, Operately uses access levels, visibility, and 
permissions. These concepts are used to determine who can access what information and how
they can interact with it.

## Visibility

- **Public**: The resource is visible to everyone on the internet.
- **Internal**: The resource is visible to everyone in the organization.
- **Confidential**: The resource is visible to a subset of users in the organization, and
  access needs to be explicitly granted. Access is automatically granted to members of the
  space where the resource is located.
- **Private**: The resource is visible to a subset of users in the organization, and access
  needs to be explicitly granted. Access is not automatically granted to members of the 
  space where the resource is located.

## Access Levels

- **Full Access**: The user has full access to the resource and can view, edit, delete, share,
  comment, manage access, change settings, and create new resources within the scope of the
  resource.

- **Edit Access**: The user has edit access to the resource and can view, edit, delete, 
  create new resources within the scope of the resource. The user cannot share the resource
  with others or change visibility settings.

- **Comment Access**: The user can view the resource and add comments to it, but cannot edit,
  delete, or share it with others.

- **View Access**: The user can only view the resource and cannot edit, delete, or share it with
  others, or comment on it.

- **No Access**: The user has no access to the resource.

## Organization Roles

Operately has the following organization roles:

- **Owner**: The owner has full access to the organization and can manage all aspects of it. 
  The owner can add and remove members, change roles, manage the organization's settings, and
  billing information.

- **Admin**: The admin has edit access to organization settings and can invite new members to the
  organization, change roles, and edit all `Public` and `Internal` resources.

- **Member**: The member has no access to organization settings but can view and comment on resources
  in the organization that are `Public` or `Internal`. For `Confidential` and `Private` resources, the
  member needs to be explicitly granted access.

- **Outside Collaborator**: The outside collaborator is a user who is not a member of the organization
  but has been invited to collaborate on a specific projects or goals. The outside collaborator has
  `Comment Access` to all `Public` resources, but needs to be explicitly granted access to `Internal`,
  `Confidential`, and `Private` resources.

## Space Roles

Operately uses spaces to organize collaboration and information sharing within an organization. A space
is a collection of projects, goals, and resources that are related to a specific area of the organization.
Each space has its own visibility settings, and members can only see and interact with resources in spaces
that they have access to.

To create a space, you need to be an admin or owner of the organization. Once a space is created, you can
invite members to join the space and assign them roles. The roles in a space are:

- **Admin**: The admin has full access to the space and can manage all aspects of it. The admin can add
  and remove members, change roles, and edit all resources in the space. The admin can access all the
  resources in the space, including `Public`, `Internal`, `Confidential`, and `Private` resources.

- **Member**: The member has edit access to resources in the space that are `Public`, `Internal`, or 
  `Confidential`, but needs to be explicitly granted access to `Private` resources.

## Project Roles

Projects 
