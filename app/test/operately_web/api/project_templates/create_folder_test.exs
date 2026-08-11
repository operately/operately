defmodule OperatelyWeb.Api.ProjectTemplates.CreateFolderTest do
  use OperatelyWeb.TurboCase

  alias Operately.ProjectTemplates.{ProjectTemplate, ResourceFolder, ResourceNode}
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
    |> Factory.add_project_template(:other_template, :space)
    |> Factory.add_project_template_resource_folder(:existing_folder, :template, position: 0)
    |> Factory.add_project_template_resource_folder(:other_folder, :other_template)
    |> Factory.log_in_person(:creator)
  end

  test "creates a folder first in its container", ctx do
    assert {200, %{folder: folder}} = request(ctx, %{name: "Plans"})

    node = Repo.get_by!(ResourceNode, project_template_id: ctx.template.id, type: :folder, position: 0)
    assert Repo.get_by!(ResourceFolder, node_id: node.id)
    assert folder.name == "Plans"
    assert Repo.get!(ResourceNode, ctx.existing_folder.node.id).position == 1
  end

  test "does not accept a parent folder from another template", ctx do
    assert {404, _} = request(ctx, %{parent_folder_id: Paths.project_template_resource_folder_id(ctx.other_folder)})
  end

  test "requires authentication", ctx do
    assert {401, _} = request(%{ctx | conn: Phoenix.ConnTest.build_conn()})
  end

  test "returns not found when the feature is disabled", ctx do
    assert {404, _} = request(Factory.disable_feature(ctx, "project_templates"))
  end

  test "rejects archived templates", ctx do
    template = ctx.template |> ProjectTemplate.changeset(%{archived_at: DateTime.utc_now()}) |> Repo.update!()
    assert {403, _} = request(%{ctx | template: template})
  end

  test "rejects writes in company read-only mode", ctx do
    %{company_id: ctx.company.id, access_state: :read_only}
    |> Operately.Billing.CompanyBillingAccount.changeset()
    |> Repo.insert!()

    assert {403, _} = request(ctx)
  end

  tabletest @permissions_table do
    test "returns #{@test.expected} for #{@test.permissions}", ctx do
      ctx = ctx |> Factory.add_space_member(:requester, :space, permissions: @test.permissions) |> Factory.log_in_person(:requester)

      assert {code, _} = request(ctx, %{name: "Requester folder"})
      assert code == @test.expected
    end
  end

  defp request(ctx, attrs \\ %{}) do
    mutation(ctx.conn, [:project_templates, :create_folder], Map.merge(%{template_id: Paths.project_template_id(ctx.template), name: "Folder"}, attrs))
  end
end
