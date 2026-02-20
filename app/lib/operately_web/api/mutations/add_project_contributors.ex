defmodule OperatelyWeb.Api.Mutations.AddProjectContributors do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Projects.Project
  alias Operately.Projects.Permissions
  alias Operately.Access.Binding
  alias Operately.Operations.ProjectContributorsAddition, as: Operation

  inputs do
    field :project_id, :string, null: false
    field :contributors, list_of(:project_contributor_input), null: false
  end

  outputs do
    field :success, :boolean, null: false
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:project_id, fn -> decode_id(inputs.project_id) end)
    |> run(:contribs, fn -> decode_contributors(inputs.contributors) end)
    |> run(:project, fn ctx -> Project.get(ctx.me, id: ctx.project_id) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.project.request_info.access_level, :can_edit) end)
    |> run(:validate_permission_levels, fn ctx -> validate_permission_levels(ctx.project.request_info.access_level, ctx.contribs) end)
    |> run(:operation, fn ctx -> Operation.run(ctx.me, ctx.project, ctx.contribs) end)
    |> run(:serialized, fn -> {:ok, %{success: true}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :me, _} -> {:error, :unauthorized}
      {:error, :project_id, _} -> {:error, :bad_request}
      {:error, :contribs, _} -> {:error, :bad_request}
      {:error, :project, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :validate_permission_levels, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end

  defp decode_contributors(contribs), do: decode_contributors(contribs, [])

  defp decode_contributors([], acc), do: {:ok, acc}

  defp decode_contributors([contrib| rest], acc) do
    {:ok, contrib} = decode_contributor(contrib)
    decode_contributors(rest, [contrib | acc])
  end

  defp decode_contributor(contributor) do
    {:ok, Map.merge(contributor, %{access_level: Binding.from_atom(contributor.access_level), role: :contributor})}
  end

  defp validate_permission_levels(caller_access_level, contributors) do
    if Enum.all?(contributors, fn contrib -> contrib.access_level <= caller_access_level end) do
      {:ok, :allowed}
    else
      {:error, :forbidden}
    end
  end
end
