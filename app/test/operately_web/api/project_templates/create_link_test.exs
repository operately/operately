defmodule OperatelyWeb.Api.ProjectTemplates.CreateLinkTest do
  use OperatelyWeb.TurboCase

  alias Operately.ProjectTemplates.{ProjectTemplate, ResourceLink, ResourceNode}
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
    |> Factory.add_project_template_resource_folder(:other_folder, :other_template)
    |> Factory.log_in_person(:creator)
  end

  test "creates a link in its parent folder", ctx do
    assert {200, %{link: link}} = request(ctx, %{parent_folder_id: Paths.project_template_resource_folder_id(ctx.folder), name: "Launch dashboard"})

    node = Repo.get_by!(ResourceNode, project_template_id: ctx.template.id, type: :link)
    assert node.parent_folder_id == ctx.folder.id
    assert Repo.get_by!(ResourceLink, node_id: node.id).name == "Launch dashboard"
    assert link.name == "Launch dashboard"
  end

  test "does not accept a parent folder from another template", ctx do
    assert {404, _} = request(ctx, %{parent_folder_id: Paths.project_template_resource_folder_id(ctx.other_folder)})
  end

  test "requires authentication", ctx do
    assert {401, _} = request(%{ctx | conn: Phoenix.ConnTest.build_conn()})
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

      assert {code, _} = request(ctx, %{name: "Requester link"})
      assert code == @test.expected
    end
  end

  defp request(ctx, attrs \\ %{}) do
    mutation(
      ctx.conn,
      [:project_templates, :create_link],
      Map.merge(%{template_id: Paths.project_template_id(ctx.template), name: "Link", url: "https://example.com", type: "other"}, attrs)
    )
  end
end
