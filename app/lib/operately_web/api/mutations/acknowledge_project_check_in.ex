defmodule OperatelyWeb.Api.Mutations.AcknowledgeProjectCheckIn do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Projects.CheckIn
  alias Operately.Projects.Permissions

  inputs do
    field :id, :id
  end

  outputs do
    field? :check_in, :project_check_in, null: true
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:check_in, fn ctx -> CheckIn.get(ctx.me, id: inputs.id, opts: [preload: [project: [:champion, :reviewer]]]) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.check_in.request_info.access_level, :can_acknowledge_check_in) end)
    |> run(:check_already_acknowledged, fn ctx -> check_already_acknowledged(ctx.check_in) end)
    |> run(:check_not_the_author, fn ctx -> check_not_the_author(ctx.me, ctx.check_in) end)
    |> run(:operation, fn ctx -> Operately.Operations.ProjectCheckInAcknowledgement.run(ctx.me, ctx.check_in) end)
    |> run(:serialized, fn ctx -> {:ok, %{check_in: Serializer.serialize(ctx.operation, level: :essential)}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :id, _} -> {:error, :bad_request}
      {:error, :check_in, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end

  defp check_already_acknowledged(check_in) do
    if check_in.acknowledged_at do
      {:error, :bad_request, "This check-in has already been acknowledged"}
    else
      {:ok, :can_acknowledge}
    end
  end

  defp check_not_the_author(me, check_in) do
    if me.id == check_in.author_id do
      {:error, :bad_request, "Authors cannot acknowledge their own check-ins"}
    else
      {:ok, :not_the_author}
    end
  end
end
