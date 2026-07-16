defmodule OperatelyWeb.Api.Projects.AcknowledgeRetrospective do
  @moduledoc """
  Acknowledges a project retrospective by project ID.
  """

  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Projects.Retrospective
  alias Operately.Projects.Permissions
  alias Operately.Operations.ProjectRetrospectiveAcknowledgement

  require Logger

  inputs do
    field :project_id, :id, null: false
  end

  outputs do
    field :retrospective, :project_retrospective, null: false
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:retrospective, fn ctx ->
      Retrospective.get(ctx.me, project_id: inputs.project_id, opts: [preload: [:project, :author, :acknowledged_by]])
    end)
    |> run(:check_permissions, fn ctx ->
      Permissions.check(ctx.retrospective.request_info.access_level, :can_edit, company_read_only: company_read_only(conn))
    end)
    |> run(:check_already_acknowledged, fn ctx -> check_already_acknowledged(ctx.retrospective) end)
    |> run(:check_not_the_author, fn ctx -> check_not_the_author(ctx.me, ctx.retrospective) end)
    |> run(:operation, fn ctx -> ProjectRetrospectiveAcknowledgement.run(ctx.me, ctx.retrospective) end)
    |> run(:serialized, fn ctx ->
      retrospective =
        Repo.preload(ctx.operation, [:project, :author, :acknowledged_by], force: true)

      {:ok, %{retrospective: Serializer.serialize(retrospective)}}
    end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} ->
        {:ok, ctx.serialized}

      {:error, :check_already_acknowledged, e} ->
        retrospective = Repo.preload(e.context.retrospective, [:project, :author, :acknowledged_by], force: true)
        {:ok, %{retrospective: Serializer.serialize(retrospective)}}

      {:error, :retrospective, _} ->
        {:error, :not_found}

      {:error, :check_permissions, _} ->
        {:error, :forbidden}

      {:error, :check_not_the_author, _} ->
        {:error, :bad_request, "Authors cannot acknowledge their own retrospectives"}

      {:error, :operation, _} ->
        {:error, :internal_server_error}

      e ->
        Logger.error("AcknowledgeProjectRetrospective mutation failed: #{inspect(e)}")
        {:error, :internal_server_error}
    end
  end

  defp check_already_acknowledged(retrospective) do
    if retrospective.acknowledged_at do
      {:error, :already_acknowledged}
    else
      {:ok, :can_acknowledge}
    end
  end

  defp check_not_the_author(me, retrospective) do
    if me.id == retrospective.author_id do
      {:error, :cant_acknowledge_own_retrospective}
    else
      {:ok, :not_the_author}
    end
  end
end
