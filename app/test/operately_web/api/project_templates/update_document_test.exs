defmodule OperatelyWeb.Api.ProjectTemplates.UpdateDocumentTest do
  use OperatelyWeb.TurboCase

  alias Operately.ProjectTemplates.{ProjectTemplate, ResourceDocument}
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
    |> Factory.add_project_template_resource_document(:document, :template, name: "Original", content: %{"type" => "doc", "content" => []})
    |> Factory.add_project_template_resource_document(:other_document, :other_template)
    |> Factory.log_in_person(:creator)
  end

  test "updates document content and name", ctx do
    content = Jason.encode!(%{"type" => "doc", "content" => [%{"type" => "paragraph"}]})

    assert {200, %{document: %{name: "Updated"}}} = request(ctx, %{name: "Updated", content: content})
    document = Repo.get!(ResourceDocument, ctx.document.id)
    assert document.name == "Updated"
    assert document.content == Jason.decode!(content)
  end

  test "does not disclose a document from another template", ctx do
    assert {404, _} = request(ctx, %{document_id: Paths.project_template_resource_document_id(ctx.other_document)})
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

      assert {code, _} = request(ctx, %{name: "Requester update"})
      assert code == @test.expected
      assert Repo.get!(ResourceDocument, ctx.document.id).name == if(@test.expected == 200, do: "Requester update", else: "Original")
    end
  end

  defp request(ctx, attrs \\ %{}) do
    mutation(
      ctx.conn,
      [:project_templates, :update_document],
      Map.merge(
        %{
          template_id: Paths.project_template_id(ctx.template),
          document_id: Paths.project_template_resource_document_id(ctx.document),
          name: "Updated document",
          content: Jason.encode!(%{"type" => "doc", "content" => []})
        },
        attrs
      )
    )
  end
end
