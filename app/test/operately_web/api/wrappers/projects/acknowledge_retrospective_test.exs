defmodule OperatelyWeb.Api.Wrappers.Projects.AcknowledgeRetrospectiveTest do
  use OperatelyWeb.TurboCase

  alias Operately.Repo
  alias OperatelyWeb.Paths

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_company_member(:coworker)
    |> Factory.add_api_token(:api_token, :coworker, read_only: false)
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
    |> Factory.add_project_retrospective(:retrospective, :project, :creator)
  end

  test "acknowledges retrospective by project_id", ctx do
    refute ctx.retrospective.acknowledged_at

    assert {200, res} =
             external_mutation(ctx.conn, ctx.api_token, "projects/acknowledge_retrospective", %{
               project_id: Paths.project_id(ctx.project)
             })

    retrospective = Repo.reload(ctx.retrospective)

    assert retrospective.acknowledged_at
    assert retrospective.acknowledged_by_id == ctx.coworker.id
    assert res.retrospective.id == Paths.project_retrospective_id(retrospective)
  end

  test "returns not found when project has no retrospective", ctx do
    ctx = Factory.add_project(ctx, :other_project, :space)

    assert {404, _} =
             external_mutation(ctx.conn, ctx.api_token, "projects/acknowledge_retrospective", %{
               project_id: Paths.project_id(ctx.other_project)
             })
  end

  test "returns not found for unknown project", ctx do
    assert {404, _} =
             external_mutation(ctx.conn, ctx.api_token, "projects/acknowledge_retrospective", %{
               project_id: Operately.ShortUuid.encode!(Ecto.UUID.generate())
             })
  end

  test "authors cannot acknowledge their own retrospectives", ctx do
    ctx = Factory.add_api_token(ctx, :author_token, :creator, read_only: false)

    assert {400, res} =
             external_mutation(ctx.conn, ctx.author_token, "projects/acknowledge_retrospective", %{
               project_id: Paths.project_id(ctx.project)
             })

    assert res.message == "Authors cannot acknowledge their own retrospectives"
  end
end
