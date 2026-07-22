defmodule OperatelyWeb.Api.Documents.RestoreVersionTest do
  use OperatelyWeb.TurboCase

  import Operately.GroupsFixtures
  import Operately.ResourceHubsFixtures

  alias Operately.Access.Binding
  alias Operately.ResourceHubs.DocumentVersion
  alias Operately.Support.RichText

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_resource_hub(:hub, :space, :creator)
  end

  describe "security" do
    test "requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:documents, :restore_version], %{})
    end
  end

  describe "permissions" do
    setup ctx do
      ctx
      |> Factory.add_company_member(:person)
      |> Factory.log_in_person(:person)
    end

    test "viewer without access cannot restore", ctx do
      space = create_space(ctx, :no_access, :no_access)
      hub = resource_hub_fixture(ctx.creator, space)
      document = document_fixture(hub.id, ctx.creator.id)

      assert {404, _} =
               mutation(ctx.conn, [:documents, :restore_version], %{
                 document_id: Paths.document_id(document),
                 version_number: 1,
                 expected_current_version: 1
               })
    end

    test "viewer with view access cannot restore", ctx do
      space = create_space(ctx, :no_access, :view_access)
      hub = resource_hub_fixture(ctx.creator, space)
      document = document_fixture(hub.id, ctx.creator.id)

      assert {403, _} =
               mutation(ctx.conn, [:documents, :restore_version], %{
                 document_id: Paths.document_id(document),
                 version_number: 1,
                 expected_current_version: 1
               })
    end

    test "editor can restore", ctx do
      space = create_space(ctx, :no_access, :edit_access)
      hub = resource_hub_fixture(ctx.creator, space)
      document = document_with_versions(ctx, hub)

      assert {200, res} =
               mutation(ctx.conn, [:documents, :restore_version], %{
                 document_id: Paths.document_id(document),
                 version_number: 1,
                 expected_current_version: 2
               })

      assert res.document.current_version == 3
      assert res.restored_version.version_number == 3
      assert res.restored_version.origin == "restored"
      assert res.restored_version.restored_from_version_number == 1
    end
  end

  describe "functionality" do
    setup ctx do
      ctx
      |> Factory.log_in_person(:creator)
      |> Factory.add_document(:document, :hub)
      |> then(&create_extra_version/1)
    end

    test "restores and returns new version metadata", ctx do
      assert {200, res} =
               mutation(ctx.conn, [:documents, :restore_version], %{
                 document_id: Paths.document_id(ctx.document),
                 version_number: 1,
                 expected_current_version: 2
               })

      assert res.document.current_version == 3
      assert res.restored_version.version_number == 3
      assert Enum.map(DocumentVersion.list_for_document(ctx.document.id), & &1.version_number) == [3, 2, 1]
    end

    test "returns null restored_version on identical restore", ctx do
      assert {200, res} =
               mutation(ctx.conn, [:documents, :restore_version], %{
                 document_id: Paths.document_id(ctx.document),
                 version_number: 2,
                 expected_current_version: 2
               })

      assert res.document.current_version == 2
      assert res.restored_version == nil
    end

    test "returns version_conflict for stale expected_current_version", ctx do
      assert {400, res} =
               mutation(ctx.conn, [:documents, :restore_version], %{
                 document_id: Paths.document_id(ctx.document),
                 version_number: 1,
                 expected_current_version: 1
               })

      assert res.details["reason"] == "version_conflict" or res.details[:reason] == "version_conflict"
      assert Repo.reload!(ctx.document).current_version == 2
    end

    test "returns not_found for missing version", ctx do
      assert {404, _} =
               mutation(ctx.conn, [:documents, :restore_version], %{
                 document_id: Paths.document_id(ctx.document),
                 version_number: 99,
                 expected_current_version: 2
               })
    end
  end

  defp create_extra_version(ctx) do
    document = Repo.preload(ctx.document, [:resource_hub, :node])

    {:ok, _} =
      Operately.Operations.ResourceHubDocumentEditing.run(ctx.creator, document, %{
        name: "Version two",
        content: RichText.rich_text("Second")
      })

    Map.put(ctx, :document, Repo.reload!(document))
  end

  defp document_with_versions(ctx, hub) do
    document = document_fixture(hub.id, ctx.creator.id)
    document = Repo.preload(document, [:resource_hub, :node])

    {:ok, _} =
      Operately.Operations.ResourceHubDocumentEditing.run(ctx.creator, document, %{
        name: "Version two",
        content: RichText.rich_text("Second")
      })

    Repo.reload!(document)
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
