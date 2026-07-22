defmodule OperatelyWeb.Api.Documents.ListVersionsTest do
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
      assert {401, _} = query(ctx.conn, [:documents, :list_versions], %{})
    end
  end

  describe "permissions" do
    setup ctx do
      ctx
      |> Factory.add_company_member(:person)
      |> Factory.log_in_person(:person)
    end

    test "viewer without access cannot list versions", ctx do
      space = create_space(ctx, :no_access, :no_access)
      hub = resource_hub_fixture(ctx.creator, space)
      document = document_fixture(hub.id, ctx.creator.id)

      assert {404, _} =
               query(ctx.conn, [:documents, :list_versions], %{
                 document_id: Paths.document_id(document)
               })
    end

    test "viewer can list versions", ctx do
      space = create_space(ctx, :no_access, :view_access)
      hub = resource_hub_fixture(ctx.creator, space)
      document = document_fixture(hub.id, ctx.creator.id)

      assert {200, res} =
               query(ctx.conn, [:documents, :list_versions], %{
                 document_id: Paths.document_id(document)
               })

      assert length(res.versions) == 1
      assert hd(res.versions).version_number == 1
      assert hd(res.versions).is_current == true
      assert hd(res.versions).content != nil
    end
  end

  describe "functionality" do
    setup ctx do
      ctx
      |> Factory.log_in_person(:creator)
      |> Factory.add_document(:document, :hub)
      |> then(&create_extra_versions/1)
    end

    test "returns versions newest first with content", ctx do
      assert {200, res} =
               query(ctx.conn, [:documents, :list_versions], %{
                 document_id: Paths.document_id(ctx.document)
               })

      assert Enum.map(res.versions, & &1.version_number) == [3, 2, 1]

      Enum.each(res.versions, fn version ->
        assert version.content != nil
      end)
    end

    test "flags title-only and content changes against the previous version", ctx do
      assert {200, res} =
               query(ctx.conn, [:documents, :list_versions], %{
                 document_id: Paths.document_id(ctx.document)
               })

      by_number = Map.new(res.versions, &{&1.version_number, &1})

      assert by_number[1].title_changed == false
      assert by_number[1].content_changed == false

      assert by_number[2].title_changed == true
      assert by_number[2].content_changed == true

      assert by_number[3].title_changed == true
      assert by_number[3].content_changed == false
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
          content: RichText.rich_text("Second")
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
