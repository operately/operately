defmodule OperatelyWeb.Api.ProjectTemplates.CreateTest do
  use OperatelyWeb.TurboCase

  alias Operately.ProjectTemplates.ProjectTemplate
  alias OperatelyWeb.Paths

  @permissions_table [
    %{permissions: :view_access, expected: 403},
    %{permissions: :comment_access, expected: 403},
    %{permissions: :edit_access, expected: 200},
    %{permissions: :full_access, expected: 200}
  ]

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.enable_feature("project_templates")
    |> Factory.add_space(:space)
    |> Factory.log_in_person(:creator)
  end

  test "requires authentication", ctx do
    assert {401, _} = mutation(Phoenix.ConnTest.build_conn(), [:project_templates, :create], %{space_id: Paths.space_id(ctx.space), name: "Template"})
  end

  test "creates a blank template", ctx do
    assert {200, res} = mutation(ctx.conn, [:project_templates, :create], %{space_id: Paths.space_id(ctx.space), name: "Template", duration_days: 0})
    assert res.template.name == "Template"
    assert res.template.duration_days == 0
    assert Repo.get_by!(ProjectTemplate, name: "Template").creator_id == ctx.creator.id
  end

  tabletest @permissions_table do
    test "returns #{@test.expected} for #{@test.permissions}", ctx do
      ctx = ctx |> Factory.add_space_member(:person, :space, permissions: @test.permissions) |> Factory.log_in_person(:person)

      assert {code, _} = mutation(ctx.conn, [:project_templates, :create], %{space_id: Paths.space_id(ctx.space), name: "Template"})
      assert code == @test.expected
    end
  end

end
