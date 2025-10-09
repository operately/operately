defmodule OperatelyWeb.Api.Mutations.UpdateProjectDescription do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Ecto.Multi
  alias Operately.Activities
  alias Operately.Projects
  alias Operately.Projects.Permissions
  alias Operately.Repo
  alias Operately.RichContent

  inputs do
    field? :project_id, :string, null: true
    field? :description, :string, null: true
  end

  outputs do
    field? :project, :project, null: true
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:project_id, fn -> decode_id(inputs.project_id) end)
    |> run(:project, fn ctx -> Projects.get_project_with_access_level(ctx.project_id, ctx.me.id) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.project.requester_access_level, :can_edit_description) end)
    |> run(:description, fn -> decode_description(inputs.description) end)
    |> run(:operation, fn ctx -> update_project_description(ctx.me, ctx.project, ctx.description) end)
    |> run(:serialized, fn ctx -> {:ok, %{project: Serializer.serialize(ctx.operation)}} end)
    |> respond()
  end

  def update_project_description(author, project, description) do
    has_description = RichContent.empty?(description)

    Multi.new()
    |> Multi.update(:project, Projects.change_project(project, %{description: description}))
    |> Activities.insert_sync(author.id, :project_description_changed, fn changes ->
      %{
        company_id: project.company_id,
        space_id: project.group_id,
        project_id: project.id,
        project_name: project.name,
        has_description: has_description,
        description: description
      }
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:project)
  end

  def decode_description(description) do
    {:ok, Jason.decode!(description)}
  end

  def respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :project_id, _} -> {:error, :bad_request}
      {:error, :project, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end
end
