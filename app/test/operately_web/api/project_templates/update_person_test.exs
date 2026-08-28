defmodule OperatelyWeb.Api.ProjectTemplates.UpdatePersonTest do
  use OperatelyWeb.TurboCase

  alias Operately.Access.Binding
  alias Operately.ProjectTemplates.{ProjectTemplate, TaskAssignment}
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
    |> Factory.add_company_member(:replacement)
    |> Factory.add_project_template_task(:task, :template)
    |> Factory.add_project_template_person(:template_person, :template, :member,
      responsibility: "Coordinates launch support",
      access_level: Binding.comment_access()
    )
    |> Factory.add_project_template_task_assignment(:assignment, :template, :task, :template_person)
    |> Factory.log_in_person(:creator)
  end

  test "updates responsibility, access, and role", ctx do
    assert {200, res} =
             request(ctx, %{
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
             request(ctx, %{
               template_person_id: Paths.project_template_person_id(ctx.foreign),
               responsibility: "No"
             })
  end

  test "promotes an existing contributor and demotes the previous role holder", ctx do
    ctx = Factory.add_project_template_person(ctx, :champion, :template, :creator, role: :champion, access_level: Binding.full_access())

    assert {200, res} =
             request(ctx, %{
               template_person_id: Paths.project_template_person_id(ctx.champion),
               person_id: Paths.person_id(ctx.member),
               role: "champion"
             })

    assert res.person.id == Paths.project_template_person_id(ctx.template_person)
    assert res.person.access_level == Binding.full_access()
    assert Repo.reload!(ctx.champion).role == :contributor
  end

  test "replaces a suspended contributor while retaining their template record and assignments", ctx do
    ctx = Factory.suspend_company_member(ctx, :member)

    assert {200, res} = request(ctx, %{person_id: Paths.person_id(ctx.replacement)})

    template_person = Repo.reload!(ctx.template_person)

    assert res.person.id == Paths.project_template_person_id(ctx.template_person)
    assert template_person.person_id == ctx.replacement.id
    assert template_person.role == :contributor
    assert template_person.responsibility == "Coordinates launch support"
    assert template_person.access_level == Binding.comment_access()
    assert Repo.get(TaskAssignment, ctx.assignment.id).project_template_person_id == ctx.template_person.id
  end

  test "replaces a removed contributor while retaining their template record and assignments", ctx do
    Repo.delete!(ctx.member)

    assert Repo.reload!(ctx.template_person).person_id == nil
    assert {200, _} = request(ctx, %{person_id: Paths.person_id(ctx.replacement)})

    template_person = Repo.reload!(ctx.template_person)

    assert template_person.person_id == ctx.replacement.id
    assert template_person.responsibility == "Coordinates launch support"
    assert template_person.access_level == Binding.comment_access()
    assert Repo.get(TaskAssignment, ctx.assignment.id).project_template_person_id == ctx.template_person.id
  end

  test "rejects unavailable and cross-company replacements without changing the contributor", ctx do
    other_company = Operately.CompaniesFixtures.company_fixture(%{company_name: "Other company"})
    other_person = Operately.PeopleFixtures.person_fixture(%{company_id: other_company.id})
    ctx = Factory.suspend_company_member(ctx, :replacement)

    assert {404, _} = request(ctx, %{person_id: Paths.person_id(ctx.replacement)})
    assert Repo.reload!(ctx.template_person).person_id == ctx.member.id
    assert Repo.get(TaskAssignment, ctx.assignment.id)

    assert {404, _} = request(ctx, %{person_id: Paths.person_id(other_person)})
    assert Repo.reload!(ctx.template_person).person_id == ctx.member.id
    assert Repo.get(TaskAssignment, ctx.assignment.id)
  end

  test "rejects an already represented replacement without changing either contributor", ctx do
    ctx = Factory.add_project_template_person(ctx, :represented, :template, :replacement)

    assert {400, _} = request(ctx, %{person_id: Paths.person_id(ctx.replacement)})

    assert Repo.reload!(ctx.template_person).person_id == ctx.member.id
    assert Repo.reload!(ctx.represented).person_id == ctx.replacement.id
    assert Repo.get(TaskAssignment, ctx.assignment.id)
  end

  test "requires authentication", ctx do
    assert {401, _} = request(%{ctx | conn: Phoenix.ConnTest.build_conn()})
    assert Repo.reload!(ctx.template_person).responsibility == "Coordinates launch support"
  end


  test "rejects archived templates", ctx do
    template = ctx.template |> ProjectTemplate.changeset(%{archived_at: DateTime.utc_now()}) |> Repo.update!()

    assert {403, _} = request(%{ctx | template: template})
    assert Repo.reload!(ctx.template_person).responsibility == "Coordinates launch support"
  end

  test "rejects writes in company read-only mode", ctx do
    %{company_id: ctx.company.id, access_state: :read_only}
    |> Operately.Billing.CompanyBillingAccount.changeset()
    |> Repo.insert!()

    assert {403, _} = request(ctx)
    assert Repo.reload!(ctx.template_person).responsibility == "Coordinates launch support"
  end

  tabletest @permissions_table do
    test "returns #{@test.expected} for #{@test.permissions}", ctx do
      ctx = ctx |> Factory.add_space_member(:requester, :space, permissions: @test.permissions) |> Factory.log_in_person(:requester)

      assert {code, _} = request(ctx, %{responsibility: "Changed"})

      assert code == @test.expected
      expected_responsibility = if @test.expected == 200, do: "Changed", else: "Coordinates launch support"
      assert Repo.reload!(ctx.template_person).responsibility == expected_responsibility
    end
  end

  defp request(ctx, attrs \\ %{}) do
    mutation(ctx.conn, [:project_templates, :update_person], Map.merge(default_inputs(ctx), attrs))
  end

  defp default_inputs(ctx) do
    %{
      template_id: Paths.project_template_id(ctx.template),
      template_person_id: Paths.project_template_person_id(ctx.template_person)
    }
  end
end
