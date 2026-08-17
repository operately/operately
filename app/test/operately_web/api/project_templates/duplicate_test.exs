defmodule OperatelyWeb.Api.ProjectTemplates.DuplicateTest do
  use OperatelyWeb.TurboCase

  alias Operately.ProjectTemplates.{ProjectTemplate, Task}
  alias OperatelyWeb.Paths

  @permissions_table [
    %{permissions: :no_access, expected: 404},
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
    |> Factory.add_project_template(:template, :space, name: "Launch kit", duration_days: 10)
    |> Factory.add_project_template_task(:task, :template, name: "Prepare brief", due_offset_days: 3)
    |> Factory.log_in_person(:creator)
  end

  test "duplicates an active template", ctx do
    assert {200, response} = request(ctx)
    {:ok, duplicate_id} = OperatelyWeb.Api.Helpers.decode_id(response.template.id)
    duplicate = Repo.get!(ProjectTemplate, duplicate_id)
    copied_task = Repo.get_by!(Task, project_template_id: duplicate.id)

    assert duplicate.name == "Launch kit copy"
    assert duplicate.space_id == ctx.space.id
    assert duplicate.creator_id == ctx.creator.id
    assert duplicate.source_project_id == nil
    assert copied_task.name == "Prepare brief"
    assert copied_task.id != ctx.task.id
  end

  test "requires authentication and the feature gate", ctx do
    assert {401, _} = mutation(Phoenix.ConnTest.build_conn(), [:project_templates, :duplicate], %{})
    ctx = Factory.disable_feature(ctx, "project_templates")
    assert {404, _} = request(ctx)
  end

  test "does not disclose templates from inaccessible Spaces or companies", ctx do
    outsider_ctx = ctx |> Factory.add_company_member(:outsider) |> Factory.log_in_person(:outsider)
    assert {404, _} = request(outsider_ctx)

    other_ctx =
      %{conn: Phoenix.ConnTest.build_conn()}
      |> Factory.setup()
      |> Factory.enable_feature("project_templates")
      |> Factory.log_in_person(:creator)

    assert {404, _} = mutation(other_ctx.conn, [:project_templates, :duplicate], %{id: Paths.project_template_id(ctx.template), name: "Copy"})
  end

  test "rejects archived templates and company read-only mode", ctx do
    archived = ctx.template |> ProjectTemplate.changeset(%{archived_at: DateTime.utc_now()}) |> Repo.update!()
    assert {403, _} = request(%{ctx | template: archived})

    active = archived |> ProjectTemplate.changeset(%{archived_at: nil}) |> Repo.update!()
    %{company_id: ctx.company.id, access_state: :read_only} |> Operately.Billing.CompanyBillingAccount.changeset() |> Repo.insert!()
    assert {403, _} = request(%{ctx | template: active})
  end

  tabletest @permissions_table do
    test "returns #{@test.expected} for #{@test.permissions}", ctx do
      ctx = ctx |> Factory.add_space_member(:person, :space, permissions: @test.permissions) |> Factory.log_in_person(:person)
      assert {code, _} = request(ctx)
      assert code == @test.expected
    end
  end

  defp request(ctx) do
    mutation(ctx.conn, [:project_templates, :duplicate], %{
      id: Paths.project_template_id(ctx.template),
      name: "Launch kit copy"
    })
  end
end
