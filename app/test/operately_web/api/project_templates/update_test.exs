defmodule OperatelyWeb.Api.ProjectTemplates.UpdateTest do
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
    |> Factory.add_project_template(:template, :space)
    |> Factory.log_in_person(:creator)
  end

  test "updates the template", ctx do
    assert {200, %{success: true}} = request(ctx, %{name: "Updated", duration_days: 0})
    template = Repo.reload!(ctx.template)
    assert template.name == "Updated"
    assert template.duration_days == 0
  end

  test "rejects invalid offsets", ctx do
    assert {400, _} = request(ctx, %{duration_days: -1})
  end

  tabletest @permissions_table do
    test "returns #{@test.expected} for #{@test.permissions}", ctx do
      ctx = ctx |> Factory.add_space_member(:person, :space, permissions: @test.permissions) |> Factory.log_in_person(:person)

      assert {code, _} = request(ctx, %{name: "Updated"})
      assert code == @test.expected
    end
  end

  test "rejects archived templates", ctx do
    {:ok, template} = ctx.template |> ProjectTemplate.changeset(%{archived_at: DateTime.utc_now()}) |> Repo.update()
    assert {403, _} = request(%{ctx | template: template}, %{name: "Forbidden"})
  end

  test "rejects writes in company read-only mode", ctx do
    alias Operately.Billing.CompanyBillingAccount

    %{company_id: ctx.company.id, access_state: :read_only}
    |> CompanyBillingAccount.changeset()
    |> Repo.insert!()

    assert {403, _} = request(ctx, %{name: "Forbidden"})
  end

  defp request(ctx, attrs) do
    mutation(ctx.conn, [:project_templates, :update], Map.put(attrs, :id, Paths.project_template_id(ctx.template)))
  end
end
