defmodule OperatelyWeb.Api.ProjectTemplates.MoveResourceTest do
  use OperatelyWeb.TurboCase

  alias Operately.ProjectTemplates.{ProjectTemplate, ResourceNode}
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
    |> Factory.add_project_template_resource_folder(:source_folder, :template)
    |> Factory.add_project_template_resource_folder(:destination_folder, :template)
    |> Factory.add_project_template_resource_document(:document, :template, parent_folder: :source_folder)
    |> Factory.add_project_template_resource_document(:other_document, :other_template)
    |> Factory.log_in_person(:creator)
  end

  test "moves a resource and places it first in the destination", ctx do
    assert {200, %{success: true}} = request(ctx, %{parent_folder_id: Paths.project_template_resource_folder_id(ctx.destination_folder)})

    node = Repo.get!(ResourceNode, ctx.document.node.id)
    assert node.parent_folder_id == ctx.destination_folder.id
    assert node.position == 0
  end

  test "rejects moves into a descendant folder and resources from another template", ctx do
    ctx = Factory.add_project_template_resource_folder(ctx, :child_folder, :template, parent_folder: :source_folder)

    assert {400, _} =
             request(ctx, %{
               node_id: Paths.project_template_resource_node_id(ctx.source_folder.node),
               parent_folder_id: Paths.project_template_resource_folder_id(ctx.child_folder)
             })

    assert {404, _} = request(ctx, %{node_id: Paths.project_template_resource_node_id(ctx.other_document.node)})
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

      assert {code, _} = request(ctx, %{parent_folder_id: Paths.project_template_resource_folder_id(ctx.destination_folder)})
      assert code == @test.expected

      parent_folder_id = Repo.get!(ResourceNode, ctx.document.node.id).parent_folder_id
      assert parent_folder_id == if(@test.expected == 200, do: ctx.destination_folder.id, else: ctx.source_folder.id)
    end
  end

  defp request(ctx, attrs \\ %{}) do
    mutation(
      ctx.conn,
      [:project_templates, :move_resource],
      Map.merge(%{template_id: Paths.project_template_id(ctx.template), node_id: Paths.project_template_resource_node_id(ctx.document.node)}, attrs)
    )
  end
end
