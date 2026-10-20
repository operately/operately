defmodule Operately.Support.Api.ProjectAccessHelpers do
  import Ecto.Query

  alias Operately.Repo

  def project_access_snapshot(project) do
    project = Repo.reload(project)
    context = Operately.Access.get_context!(project_id: project.id)

    %{
      project: Map.take(project, [:name, :company_id, :group_id, :updated_at]),
      contributors: rows(Operately.Projects.Contributor, :project_id, project.id),
      bindings: rows(Operately.Access.Binding, :context_id, context.id),
      subscriptions: rows(Operately.Notifications.Subscription, :subscription_list_id, project.subscription_list_id),
      activities: Repo.aggregate(Operately.Activities.Activity, :count),
      memberships: Repo.aggregate(Operately.Access.GroupMembership, :count),
      space_members: Repo.aggregate(Operately.Groups.Member, :count)
    }
  end

  defp rows(schema, key, id) do
    from(row in schema, where: field(row, ^key) == ^id, order_by: row.id)
    |> Repo.all()
  end
end
