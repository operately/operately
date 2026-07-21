defmodule OperatelyWeb.Api.Documents.GetVersionTest do
  use OperatelyWeb.TurboCase

  import Operately.GroupsFixtures
  import Operately.ResourceHubsFixtures

  alias Operately.Access.Binding
  alias Operately.Support.RichText

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_resource_hub(:hub, :space, :creator)
  end

  describe "security" do
    test "requires authentication", ctx do
      assert {401, _} = query(ctx.conn, [:documents, :get_version], %{})
    end
  end

  describe "permissions" do
    setup ctx do
      ctx
      |> Factory.add_company_member(:person)
      |> Factory.log_in_person(:person)
    end

    test "viewer without access cannot get a version", ctx do
      space = create_space(ctx, :no_access, :no_access)
      hub = resource_hub_fixture(ctx.creator, space)
      document = document_fixture(hub.id, ctx.creator.id)

      assert {404, _} =
               query(ctx.conn, [:documents, :get_version], %{
                 document_id: Paths.document_id(document),
                 version_number: 1
               })
    end

    test "viewer can get a version", ctx do
      space = create_space(ctx, :no_access, :view_access)
      hub = resource_hub_fixture(ctx.creator, space)
      document = document_fixture(hub.id, ctx.creator.id)

      assert {200, res} =
               query(ctx.conn, [:documents, :get_version], %{
                 document_id: Paths.document_id(document),
                 version_number: 1
               })

      assert res.version.version_number == 1
      assert res.version.is_current == true
      assert res.version.content != nil
    end
  end

  describe "functionality" do
    setup ctx do
      ctx
      |> Factory.log_in_person(:creator)
      |> Factory.add_document(:document, :hub)
      |> then(&create_extra_versions/1)
    end

    test "returns full snapshot for owned version", ctx do
      assert {200, res} =
               query(ctx.conn, [:documents, :get_version], %{
                 document_id: Paths.document_id(ctx.document),
                 version_number: 2
               })

      assert res.version.version_number == 2
      assert res.version.title == "Version two"
      assert res.version.content != nil
    end

    test "rejects missing version numbers", ctx do
      assert {404, _} =
               query(ctx.conn, [:documents, :get_version], %{
                 document_id: Paths.document_id(ctx.document),
                 version_number: 99
               })
    end

    test "returns versions only for the requested document", ctx do
      other = document_fixture(ctx.hub.id, ctx.creator.id)

      assert {200, _} =
               query(ctx.conn, [:documents, :get_version], %{
                 document_id: Paths.document_id(other),
                 version_number: 1
               })
    end
  end

  defp create_extra_versions(ctx) do
    document = Repo.preload(ctx.document, [:resource_hub, :node])

    {:ok, _} =
      Operately.Operations.ResourceHubDocumentEditing.run(ctx.creator, document, %{
        name: "Version two",
        content: RichText.rich_text("Second")
      })

    {:ok, _} =
      Operately.Operations.ResourceHubDocumentEditing.run(
        ctx.creator,
        Repo.reload!(document) |> Repo.preload([:resource_hub, :node], force: true),
        %{
          name: "Version three",
          content: RichText.rich_text("Third")
        }
      )

    Map.put(ctx, :document, Repo.reload!(document))
  end

  defp create_space(ctx, company_members_level, space_members_level) do
    space =
      group_fixture(ctx.creator, %{
        company_id: ctx.company.id,
        company_permissions: Binding.from_atom(company_members_level)
      })

    if space_members_level != :no_access do
      {:ok, _} =
        Operately.Groups.add_members(ctx.creator, space.id, [
          %{
            id: ctx.person.id,
            access_level: Binding.from_atom(space_members_level)
          }
        ])
    end

    space
  end
end
