defmodule OperatelyWeb.Api.Queries.ListProjectSubscribersCandidates do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Projects.{Project, Permissions}
  alias Operately.Notifications.Subscriber

  inputs do
    field :project_id, :string
  end

  outputs do
    field :candidates, list_of(:boolean)
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:id, fn -> decode_id(inputs.project_id) end)
    |> run(:me, fn -> find_me(conn) end)
    |> run(:project, fn ctx -> load(ctx) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.project.request_info.access_level, :can_view) end)
    |> run(:candidates, fn ctx -> {:ok, Subscriber.from_project_contributor(ctx.project.contributors)} end)
    |> run(:serialized, fn ctx -> {:ok, %{candidates: Serializer.serialize(ctx.candidates)}} end)
    |> respond()
  end

  def respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :id, _} -> {:error, :bad_request}
      {:error, :project, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :not_found}
      _ -> {:error, :internal_server_error}
    end
  end

  defp load(ctx) do
    Project.get(ctx.me, id: ctx.id, opts: [
      preload: [contributors: :person],
    ])
  end
end
