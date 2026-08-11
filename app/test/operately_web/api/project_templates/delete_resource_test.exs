defmodule OperatelyWeb.Api.ProjectTemplates.DeleteResourceTest do
  use OperatelyWeb.TurboCase

  alias Operately.ProjectTemplates.{ProjectTemplate, ResourceDocument, ResourceFolder, ResourceNode}
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
    |> Factory.add_project_template_resource_folder(:folder, :template)
    |> Factory.add_project_template_resource_document(:document, :template, parent_folder: :folder)
    |> Factory.add_project_template_resource_document(:other_document, :other_template)
    |> Factory.log_in_person(:creator)
  end

  test "deletes a folder and its subtree", ctx do
    assert {200, %{success: true}} = request(ctx, %{node_id: Paths.project_template_resource_node_id(ctx.folder.node)})

    refute Repo.get(ResourceNode, ctx.folder.node.id)
    refute Repo.get(ResourceFolder, ctx.folder.id)
    refute Repo.get(ResourceNode, ctx.document.node.id)
    refute Repo.get(ResourceDocument, ctx.document.id)
  end

  test "does not disclose a resource from another template", ctx do
    assert {404, _} = request(ctx, %{node_id: Paths.project_template_resource_node_id(ctx.other_document.node)})
    assert Repo.get(ResourceNode, ctx.folder.node.id)
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

      assert {code, _} = request(ctx, %{node_id: Paths.project_template_resource_node_id(ctx.document.node)})
      assert code == @test.expected

      if @test.expected == 200 do
        refute Repo.get(ResourceDocument, ctx.document.id)
      else
        assert Repo.get(ResourceDocument, ctx.document.id)
      end
    end
  end

  defp request(ctx, attrs \\ %{}) do
    mutation(
      ctx.conn,
      [:project_templates, :delete_resource],
      Map.merge(%{template_id: Paths.project_template_id(ctx.template), node_id: Paths.project_template_resource_node_id(ctx.document.node)}, attrs)
    )
  end
end
