defmodule OperatelyWeb.Api.ProjectTemplates.UpdateFileTest do
  use OperatelyWeb.TurboCase

  alias Operately.Blobs.Blob
  alias Operately.ProjectTemplates.{ProjectTemplate, ResourceFile}
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
    |> Factory.add_blob(:blob)
    |> then(fn ctx -> %{ctx | blob: ctx.blob |> Blob.changeset(%{status: :uploaded}) |> Repo.update!()} end)
    |> Factory.add_project_template_resource_file(:resource_file, :template, :blob, name: "Original")
    |> Factory.add_project_template_resource_file(:other_file, :other_template, :blob)
    |> Factory.log_in_person(:creator)
  end

  test "updates a file name and description", ctx do
    description = Jason.encode!(%{"type" => "doc", "content" => []})

    assert {200, %{file: %{name: "Updated"}}} = request(ctx, %{name: "Updated", description: description})
    file = Repo.get!(ResourceFile, ctx.resource_file.id)
    assert file.name == "Updated"
    assert file.description == Jason.decode!(description)
  end

  test "does not disclose a file from another template", ctx do
    assert {404, _} = request(ctx, %{file_id: Paths.project_template_resource_file_id(ctx.other_file)})
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

      assert {code, _} = request(ctx, %{name: "Requester update"})
      assert code == @test.expected
      assert Repo.get!(ResourceFile, ctx.resource_file.id).name == if(@test.expected == 200, do: "Requester update", else: "Original")
    end
  end

  defp request(ctx, attrs \\ %{}) do
    mutation(
      ctx.conn,
      [:project_templates, :update_file],
      Map.merge(%{template_id: Paths.project_template_id(ctx.template), file_id: Paths.project_template_resource_file_id(ctx.resource_file), name: "Updated file"}, attrs)
    )
  end
end
