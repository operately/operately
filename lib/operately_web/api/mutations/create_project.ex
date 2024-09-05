defmodule OperatelyWeb.Api.Mutations.CreateProject do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Groups
  alias Operately.Groups.Permissions
  alias Operately.Operations.ProjectCreation

  inputs do
    field :space_id, :string
    field :name, :string
    field :champion_id, :string
    field :reviewer_id, :string
    field :creator_is_contributor, :string
    field :creator_role, :string
    field :goal_id, :string
    field :anonymous_access_level, :integer
    field :company_access_level, :integer
    field :space_access_level, :integer
  end

  outputs do
    field :project, :project
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:attrs, fn ctx -> decode_inputs(ctx.me, inputs) end)
    |> run(:space, fn ctx -> Groups.get_group_with_access_level(ctx.attrs.group_id, ctx.me.id) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.space.requester_access_level, :can_create_project) end)
    |> run(:operation, fn ctx -> ProjectCreation.run(ctx.attrs) end)
    |> run(:serialized, fn ctx -> {:ok, %{project: Serializer.serialize(ctx.operation, level: :essential)}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :attrs, _} -> {:error, :bad_request}
      {:error, :space, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end

  defp decode_inputs(person, inputs) do
    {:ok, goal_id} = decode_id(inputs[:goal_id], :allow_nil)
    {:ok, space_id} = decode_id(inputs[:space_id], :allow_nil)
    {:ok, champion_id} = decode_id(inputs[:champion_id], :allow_nil)
    {:ok, reviewer_id} = decode_id(inputs[:reviewer_id], :allow_nil)

    {:ok, %ProjectCreation{
      name: inputs.name,
      champion_id: champion_id,
      reviewer_id: reviewer_id,
      creator_is_contributor: inputs[:creator_is_contributor],
      creator_role: inputs[:creator_role],
      creator_id: person.id,
      company_id: person.company_id,
      group_id: space_id,
      goal_id: goal_id,
      anonymous_access_level: inputs.anonymous_access_level,
      company_access_level: inputs.company_access_level,
      space_access_level: inputs.space_access_level,
    }}
  end
end
