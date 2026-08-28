defmodule OperatelyWeb.Api.ProjectTemplates.DeletePersonTest do
  use OperatelyWeb.TurboCase

  alias Operately.ProjectTemplates.{Person, ProjectTemplate, TaskAssignment}
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
    |> Factory.add_project_template_task(:task, :template)
    |> Factory.add_project_template_person(:template_person, :template, :creator)
    |> Factory.add_project_template_task_assignment(:assignment, :template, :task, :template_person)
    |> Factory.log_in_person(:creator)
  end

  test "deletes the person and their assignments", ctx do
    assert {200, %{success: true}} = request(ctx)

    refute Repo.get(Person, ctx.template_person.id)
    refute Repo.get(TaskAssignment, ctx.assignment.id)
  end

  test "does not disclose a person from another template", ctx do
    ctx = ctx |> Factory.add_project_template(:other_template, :space) |> Factory.add_project_template_person(:foreign_person, :other_template, :creator)

    assert {404, _} = request(ctx, %{template_person_id: Paths.project_template_person_id(ctx.foreign_person)})
    assert Repo.get(Person, ctx.template_person.id)
    assert Repo.get(TaskAssignment, ctx.assignment.id)
  end

  test "does not disclose a person from another company", ctx do
    other_company = Operately.CompaniesFixtures.company_fixture(%{company_name: "Other company"})
    other_creator = Operately.PeopleFixtures.person_fixture(%{company_id: other_company.id})
    other_space = Operately.GroupsFixtures.group_fixture(other_creator)

    other_template =
      ProjectTemplate.changeset(%{
        company_id: other_company.id,
        space_id: other_space.id,
        creator_id: other_creator.id,
        name: "Other template"
      })
      |> Repo.insert!()

    other_person = Operately.PeopleFixtures.person_fixture(%{company_id: other_company.id})

    other_template_person =
      Person.changeset(%{
        project_template_id: other_template.id,
        person_id: other_person.id,
        role: :contributor,
        access_level: Operately.Access.Binding.edit_access()
      })
      |> Repo.insert!()

    assert {404, _} =
             request(ctx, %{
               template_id: Paths.project_template_id(other_template),
               template_person_id: Paths.project_template_person_id(other_template_person)
             })

    assert Repo.get(Person, ctx.template_person.id)
    assert Repo.get(Person, other_template_person.id)
    assert Repo.get(TaskAssignment, ctx.assignment.id)
  end

  test "requires authentication", ctx do
    assert {401, _} = request(%{ctx | conn: Phoenix.ConnTest.build_conn()})
    assert Repo.get(Person, ctx.template_person.id)
    assert Repo.get(TaskAssignment, ctx.assignment.id)
  end


  test "rejects archived templates", ctx do
    template = ctx.template |> ProjectTemplate.changeset(%{archived_at: DateTime.utc_now()}) |> Repo.update!()

    assert {403, _} = request(%{ctx | template: template})
    assert Repo.get(Person, ctx.template_person.id)
    assert Repo.get(TaskAssignment, ctx.assignment.id)
  end

  test "rejects writes in company read-only mode", ctx do
    %{company_id: ctx.company.id, access_state: :read_only}
    |> Operately.Billing.CompanyBillingAccount.changeset()
    |> Repo.insert!()

    assert {403, _} = request(ctx)
    assert Repo.get(Person, ctx.template_person.id)
    assert Repo.get(TaskAssignment, ctx.assignment.id)
  end

  tabletest @permissions_table do
    test "returns #{@test.expected} for #{@test.permissions}", ctx do
      ctx = ctx |> Factory.add_space_member(:requester, :space, permissions: @test.permissions) |> Factory.log_in_person(:requester)

      assert {code, _} = request(ctx)

      assert code == @test.expected

      if @test.expected == 200 do
        refute Repo.get(Person, ctx.template_person.id)
      else
        assert Repo.get(Person, ctx.template_person.id)
      end
    end
  end

  defp request(ctx, attrs \\ %{}) do
    mutation(ctx.conn, [:project_templates, :delete_person], Map.merge(default_inputs(ctx), attrs))
  end

  defp default_inputs(ctx) do
    %{
      template_id: Paths.project_template_id(ctx.template),
      template_person_id: Paths.project_template_person_id(ctx.template_person)
    }
  end
end
