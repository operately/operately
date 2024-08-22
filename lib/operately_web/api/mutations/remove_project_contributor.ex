defmodule OperatelyWeb.Api.Mutations.RemoveProjectContributor do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Access.{Binding, Fetch}
  alias Operately.Projects.{Contributor, Permissions}
  alias Operately.Operations.ProjectContributorRemoving

  inputs do
    field :contrib_id, :string
  end

  outputs do
    field :project_contributor, :project_contributor
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:data, fn ctx -> load(ctx.me.id, inputs.contrib_id) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.data.access_level, :can_edit_contributors) end)
    |> run(:operation, fn ctx -> ProjectContributorRemoving.run(ctx.me, ctx.data.contributor) end)
    |> run(:serialized, fn ctx -> {:ok, %{contributor: Serializer.serialize(ctx.operation, level: :essential)}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :data, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end

  defp load(admin_id, contrib_id) do
    no_access = Binding.no_access()

    from([contributor: c, binding: b] in contributor_query(admin_id, contrib_id),
      group_by: c.id,
      select: {c, max(b.access_level)}
    )
    |> Repo.one()
    |> case do
      nil -> {:error, :not_found}
      {_, ^no_access} -> {:error, :not_found}
      {c, access} -> {:ok, %{contributor: c, access_level: access}}
    end
  end

  defp contributor_query(admin_id, contrib_id) do
    from(c in Contributor, as: :contributor,
      join: assoc(c, :project), as: :resource,
      where: c.id == ^contrib_id
    )
    |> Fetch.join_access_level(admin_id)
  end
end
