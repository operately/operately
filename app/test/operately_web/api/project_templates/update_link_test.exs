defmodule OperatelyWeb.Api.ProjectTemplates.UpdateLinkTest do
  use OperatelyWeb.TurboCase

  alias Operately.ProjectTemplates.{ProjectTemplate, ResourceLink}
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
    |> Factory.add_project_template_resource_link(:link, :template, name: "Original", url: "https://example.com")
    |> Factory.add_project_template_resource_link(:other_link, :other_template)
    |> Factory.log_in_person(:creator)
  end

  test "updates a link", ctx do
    assert {200, %{link: %{name: "Updated"}}} = request(ctx, %{name: "Updated", url: "https://operately.com"})

    link = Repo.get!(ResourceLink, ctx.link.id)
    assert link.name == "Updated"
    assert link.url == "https://operately.com"
  end

  test "does not disclose a link from another template", ctx do
    assert {404, _} = request(ctx, %{link_id: Paths.project_template_resource_link_id(ctx.other_link)})
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
      assert Repo.get!(ResourceLink, ctx.link.id).name == if(@test.expected == 200, do: "Requester update", else: "Original")
    end
  end

  defp request(ctx, attrs \\ %{}) do
    mutation(
      ctx.conn,
      [:project_templates, :update_link],
      Map.merge(
        %{
          template_id: Paths.project_template_id(ctx.template),
          link_id: Paths.project_template_resource_link_id(ctx.link),
          name: "Updated link",
          url: "https://example.com/updated",
          type: "other"
        },
        attrs
      )
    )
  end
end
