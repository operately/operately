defmodule OperatelyWeb.Api.ProjectTemplates.CreatePersonTest do
  use OperatelyWeb.TurboCase

  alias Operately.Access.Binding
  alias Operately.ProjectTemplates.{Person, ProjectTemplate}
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
    assert {200, res} = request(ctx, %{responsibility: "Delivery"})
    assert res.person.responsibility == "Delivery"
    assert {400, _} = request(ctx, %{responsibility: "Delivery"})
    assert Repo.aggregate(Person, :count) == 1
  end

  test "demotes the previous champion and forces Full Access", ctx do
    ctx = Factory.add_project_template_person(ctx, :champion, :template, :creator, role: :champion, access_level: Binding.full_access())

    assert {200, res} =
             request(ctx, %{
               role: "champion",
               access_level: Binding.view_access()
             })

    assert res.person.access_level == Binding.full_access()
    assert Repo.reload!(ctx.champion).role == :contributor
  end

  test "requires authentication", ctx do
    assert {401, _} = request(%{ctx | conn: Phoenix.ConnTest.build_conn()})
    assert Repo.aggregate(Person, :count) == 0
  end


  test "rejects archived templates", ctx do
    template = ctx.template |> ProjectTemplate.changeset(%{archived_at: DateTime.utc_now()}) |> Repo.update!()

    assert {403, _} = request(%{ctx | template: template})
    assert Repo.aggregate(Person, :count) == 0
  end

  test "rejects writes in company read-only mode", ctx do
    %{company_id: ctx.company.id, access_state: :read_only}
    |> Operately.Billing.CompanyBillingAccount.changeset()
    |> Repo.insert!()

    assert {403, _} = request(ctx)
    assert Repo.aggregate(Person, :count) == 0
  end

  test "does not accept contributors from another company", ctx do
    other_company = Operately.CompaniesFixtures.company_fixture(%{company_name: "Other company"})
    other_person = Operately.PeopleFixtures.person_fixture(%{company_id: other_company.id})

    assert {404, _} = request(ctx, %{person_id: Paths.person_id(other_person)})
    assert Repo.aggregate(Person, :count) == 0
  end

  tabletest @permissions_table do
    test "returns #{@test.expected} for #{@test.permissions}", ctx do
      ctx = ctx |> Factory.add_space_member(:requester, :space, permissions: @test.permissions) |> Factory.add_company_member(:candidate) |> Factory.log_in_person(:requester)

      assert {code, _} = request(ctx, %{person_id: Paths.person_id(ctx.candidate)})

      assert code == @test.expected
      assert Repo.aggregate(Person, :count) == if(@test.expected == 200, do: 1, else: 0)
    end
  end

  defp request(ctx, attrs \\ %{}) do
    mutation(ctx.conn, [:project_templates, :create_person], Map.merge(default_inputs(ctx), attrs))
  end

  defp default_inputs(ctx) do
    %{
      template_id: Paths.project_template_id(ctx.template),
      person_id: Paths.person_id(ctx.member),
      role: "contributor",
      access_level: Binding.edit_access()
    }
  end
end
