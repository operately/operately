defmodule OperatelyWeb.Api.ProjectTemplates.CreatePersonTest do
  use OperatelyWeb.TurboCase

  alias Operately.Access.Binding
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
    |> Factory.add_project_template(:template, :space)
    |> Factory.add_company_member(:member)
    |> Factory.log_in_person(:creator)
  end

  test "creates a contributor and prevents duplicates", ctx do
    inputs = %{template_id: Paths.project_template_id(ctx.template), person_id: Paths.person_id(ctx.member), role: "contributor", responsibility: "Delivery", access_level: Binding.edit_access()}
    assert {200, res} = mutation(ctx.conn, [:project_templates, :create_person], inputs)
    assert res.person.responsibility == "Delivery"
    assert {400, _} = mutation(ctx.conn, [:project_templates, :create_person], inputs)
  end

  test "demotes the previous champion and forces Full Access", ctx do
    ctx = Factory.add_project_template_person(ctx, :champion, :template, :creator, role: :champion, access_level: Binding.full_access())

    assert {200, res} =
             mutation(ctx.conn, [:project_templates, :create_person], %{
               template_id: Paths.project_template_id(ctx.template),
               person_id: Paths.person_id(ctx.member),
               role: "champion",
               access_level: Binding.view_access()
             })

    assert res.person.access_level == Binding.full_access()
    assert Repo.reload!(ctx.champion).role == :contributor
  end

  tabletest @permissions_table do
    test "returns #{@test.expected} for #{@test.permissions}", ctx do
      ctx = ctx |> Factory.add_space_member(:requester, :space, permissions: @test.permissions) |> Factory.add_company_member(:candidate) |> Factory.log_in_person(:requester)

      assert {code, _} =
               mutation(ctx.conn, [:project_templates, :create_person], %{
                 template_id: Paths.project_template_id(ctx.template),
                 person_id: Paths.person_id(ctx.candidate),
                 role: "contributor",
                 access_level: Binding.edit_access()
               })

      assert code == @test.expected
    end
  end
end
