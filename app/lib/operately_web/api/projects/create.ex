defmodule OperatelyWeb.Api.Projects.Create do
  @moduledoc """
  Creates a new project in a space.
  """

  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Access.Binding
  alias Operately.Groups.{Group, Permissions}
  alias Operately.Operations.ProjectCreation
  alias Operately.People

  inputs do
    field :space_id, :id, null: false
    field :name, :string, null: false
    field? :champion_id, :id, null: true
    field? :reviewer_id, :id, null: true
    field? :goal_id, :id, null: true
    field? :description, :json, null: true
    field :anonymous_access_level, :access_options_int, null: false
    field :company_access_level, :access_options_int, null: false
    field :space_access_level, :access_options_int, null: false
  end

  outputs do
    field :project, :project, null: false
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:space, fn ctx -> Group.get(ctx.me, id: inputs.space_id, company_id: ctx.me.company_id) end)
    |> run(:check_permissions, fn ctx ->
      Permissions.check(ctx.space.request_info.access_level, :can_edit, company_read_only: company_read_only(conn))
    end)
    |> run(:owners, fn ctx -> validate_owners(ctx.space, inputs) end)
    |> run(:attrs, fn ctx -> decode_inputs(ctx.me, ctx.space, inputs) end)
    |> run(:enforced_attrs, fn ctx -> {:ok, sanitize_company_access_level(ctx.space, ctx.attrs)} end)
    |> run(:operation, fn ctx -> ProjectCreation.run(%{ctx.enforced_attrs | analytics_context: OperatelyWeb.Analytics.context(conn)}) end)
    |> run(:serialized, fn ctx -> {:ok, %{project: Serializer.serialize(ctx.operation, level: :essential)}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :space, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :owners, _} -> {:error, :bad_request}
      {:error, :attrs, _} -> {:error, :bad_request}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end

  defp validate_owners(space, inputs) do
    case People.validate_active_company_members(space.company_id, [inputs[:champion_id], inputs[:reviewer_id]]) do
      :ok -> {:ok, :valid}
      {:error, :invalid_company_member} = error -> error
    end
  end

  defp decode_inputs(person, space, inputs) do
    {:ok,
     %ProjectCreation{
       name: inputs.name,
       champion_id: inputs[:champion_id],
       reviewer_id: inputs[:reviewer_id],
       creator_role: "Contributor",
       visibility: "everyone",
       creator_id: person.id,
       company_id: space.company_id,
       group_id: space.id,
       goal_id: inputs[:goal_id],
       description: inputs[:description],
       anonymous_access_level: inputs.anonymous_access_level,
       company_access_level: inputs.company_access_level,
       space_access_level: inputs.space_access_level
     }}
  end

  defp sanitize_company_access_level(space, attrs) do
    space = Group.preload_access_levels(space)

    if space.access_levels.company == Binding.no_access() do
      Map.put(attrs, :company_access_level, Binding.no_access())
    else
      attrs
    end
  end
end
