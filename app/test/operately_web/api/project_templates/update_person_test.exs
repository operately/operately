defmodule OperatelyWeb.Api.ProjectTemplates.UpdatePersonTest do
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
    |> Factory.add_project_template_person(:template_person, :template, :member)
    |> Factory.log_in_person(:creator)
  end

  test "updates responsibility, access, and role", ctx do
    assert {200, res} =
             mutation(ctx.conn, [:project_templates, :update_person], %{
               template_id: Paths.project_template_id(ctx.template),
               template_person_id: Paths.project_template_person_id(ctx.template_person),
               responsibility: "Own delivery",
               access_level: Binding.comment_access(),
               role: "contributor"
             })

    assert res.person.responsibility == "Own delivery"
    assert res.person.access_level == Binding.comment_access()
  end

  test "does not disclose a person from another template", ctx do
    ctx = ctx |> Factory.add_project_template(:other, :space) |> Factory.add_project_template_person(:foreign, :other, :creator)

    assert {404, _} =
             mutation(ctx.conn, [:project_templates, :update_person], %{
               template_id: Paths.project_template_id(ctx.template),
               template_person_id: Paths.project_template_person_id(ctx.foreign),
               responsibility: "No"
             })
  end

  test "promotes an existing contributor and demotes the previous role holder", ctx do
    ctx = Factory.add_project_template_person(ctx, :champion, :template, :creator, role: :champion, access_level: Binding.full_access())

    assert {200, res} =
             mutation(ctx.conn, [:project_templates, :update_person], %{
               template_id: Paths.project_template_id(ctx.template),
               template_person_id: Paths.project_template_person_id(ctx.champion),
               person_id: Paths.person_id(ctx.member),
               role: "champion"
             })

    assert res.person.id == Paths.project_template_person_id(ctx.template_person)
    assert res.person.access_level == Binding.full_access()
    assert Repo.reload!(ctx.champion).role == :contributor
  end

  tabletest @permissions_table do
    test "returns #{@test.expected} for #{@test.permissions}", ctx do
      ctx = ctx |> Factory.add_space_member(:requester, :space, permissions: @test.permissions) |> Factory.log_in_person(:requester)

      assert {code, _} =
               mutation(ctx.conn, [:project_templates, :update_person], %{
                 template_id: Paths.project_template_id(ctx.template),
                 template_person_id: Paths.project_template_person_id(ctx.template_person),
                 responsibility: "Changed"
               })

      assert code == @test.expected
    end
  end
end
