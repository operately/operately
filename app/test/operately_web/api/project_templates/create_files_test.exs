defmodule OperatelyWeb.Api.ProjectTemplates.CreateFilesTest do
  use OperatelyWeb.TurboCase

  alias Operately.Blobs.Blob
  alias Operately.ProjectTemplates.{ProjectTemplate, ResourceFile, ResourceNode}
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
    |> Factory.add_blob(:blob)
    |> then(fn ctx -> %{ctx | blob: ctx.blob |> Blob.changeset(%{status: :uploaded}) |> Repo.update!()} end)
    |> Factory.log_in_person(:creator)
  end

  test "creates files in their parent folder", ctx do
    assert {200, %{files: [file]}} = request(ctx, %{parent_folder_id: Paths.project_template_resource_folder_id(ctx.folder), files: [%{blob_id: ctx.blob.id, name: "Launch artwork"}]})

    node = Repo.get_by!(ResourceNode, project_template_id: ctx.template.id, type: :file)
    assert node.parent_folder_id == ctx.folder.id
    assert Repo.get_by!(ResourceFile, node_id: node.id).blob_id == ctx.blob.id
    assert file.name == "Launch artwork"
  end

  test "rejects a blob or parent folder from another company or template", ctx do
    other_company = Operately.CompaniesFixtures.company_fixture(%{company_name: "Other company"})
    other_person = Operately.PeopleFixtures.person_fixture(%{company_id: other_company.id})
    other_blob = Operately.BlobsFixtures.blob_fixture(%{company_id: other_company.id, author_id: other_person.id, status: :uploaded})

    assert {400, _} = request(ctx, %{files: [%{blob_id: other_blob.id, name: "Foreign file"}]})
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

      assert {code, _} = request(ctx)
      assert code == @test.expected
    end
  end

  defp request(ctx, attrs \\ %{}) do
    mutation(
      ctx.conn,
      [:project_templates, :create_files],
      Map.merge(%{template_id: Paths.project_template_id(ctx.template), files: [%{blob_id: ctx.blob.id, name: "File"}]}, attrs)
    )
  end
end
