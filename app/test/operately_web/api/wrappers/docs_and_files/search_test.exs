defmodule OperatelyWeb.Api.Wrappers.DocsAndFiles.SearchTest do
  use OperatelyWeb.TurboCase

  alias Operately.Access.Binding
  alias Operately.Search.SourceIndexer
  alias Operately.Support.{Factory, RichText}

  setup ctx do
    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_api_token(:api_token, :creator)
      |> Factory.add_space(:space)
      |> Factory.fetch_default_resource_hub(:space_hub, :space)
      |> Factory.add_document(:space_document, :space_hub,
        name: "Space search result",
        content: RichText.rich_text("Scoped search evidence")
      )

    index_document(ctx.space_document)
    ctx
  end

  test "searches by space_id", ctx do
    assert_document_found(ctx, %{space_id: Paths.space_id(ctx.space)}, ctx.space_document)
  end

  test "searches by project_id", ctx do
    ctx =
      ctx
      |> Factory.add_project(:project, :space)
      |> Factory.fetch_default_project_resource_hub(:project_hub, :project)
      |> Factory.add_document(:project_document, :project_hub,
        name: "Project search result",
        content: RichText.rich_text("Scoped search evidence")
      )

    index_document(ctx.project_document)

    assert_document_found(ctx, %{project_id: Paths.project_id(ctx.project)}, ctx.project_document)
  end

  test "searches by goal_id", ctx do
    ctx =
      ctx
      |> Factory.add_goal(:goal, :space)
      |> Factory.fetch_default_goal_resource_hub(:goal_hub, :goal)
      |> Factory.add_document(:goal_document, :goal_hub,
        name: "Goal search result",
        content: RichText.rich_text("Scoped search evidence")
      )

    index_document(ctx.goal_document)

    assert_document_found(ctx, %{goal_id: Paths.goal_id(ctx.goal)}, ctx.goal_document)
  end

  test "requires exactly one scope", ctx do
    assert {400, _} = search(ctx, %{})

    assert {400, _} =
             search(ctx, %{
               space_id: Paths.space_id(ctx.space),
               goal_id: Paths.goal_id(Ecto.UUID.generate())
             })
  end

  test "does not reveal inaccessible or cross-company scopes", ctx do
    ctx =
      ctx
      |> Factory.add_company_member(:member)
      |> Factory.add_api_token(:member_token, :member)

    hidden_space =
      Operately.GroupsFixtures.group_fixture(ctx.creator, %{
        company_id: ctx.company.id,
        company_permissions: Binding.no_access()
      })

    Operately.ResourceHubsFixtures.resource_hub_fixture(ctx.creator, hidden_space)

    other_company = Operately.CompaniesFixtures.company_fixture(%{company_name: "Other company"})
    other_creator = other_company |> Ecto.assoc(:people) |> Repo.one!()
    other_space = Operately.GroupsFixtures.group_fixture(other_creator)
    Operately.ResourceHubsFixtures.resource_hub_fixture(other_creator, other_space)

    assert {404, _} = search(ctx, %{space_id: Paths.space_id(hidden_space)}, ctx.member_token)
    assert {404, _} = search(ctx, %{space_id: Paths.space_id(other_space)})
  end

  defp assert_document_found(ctx, scope, document) do
    assert {200, %{nodes: nodes}} = search(ctx, scope)

    assert Enum.any?(nodes, fn node ->
             node[:document] && node.document.id == Paths.document_id(document)
           end)
  end

  defp search(ctx, scope, token \\ nil) do
    inputs = Map.put(scope, :query, "scoped search evidence")
    external_query(ctx.conn, token || ctx.api_token, "documents/search", inputs)
  end

  defp index_document(document) do
    assert {:ok, _} = SourceIndexer.sync("resource_hub_document", document.id)
  end
end
