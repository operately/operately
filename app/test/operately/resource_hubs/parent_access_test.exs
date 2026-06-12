defmodule Operately.ResourceHubs.ParentAccessTest do
  use Operately.DataCase

  alias Operately.Access.Binding
  alias Operately.ResourceHubs.{Document, File, Folder, Link, ResourceHub}

  describe "changeset validation" do
    test "requires exactly one parent" do
      changeset = ResourceHub.changeset(%{name: "Hub"})

      assert errors_on(changeset) == %{
               project_id: ["either project_id or space_id must be present"],
               space_id: ["either project_id or space_id must be present"]
             }

      changeset =
        ResourceHub.changeset(%{
          name: "Hub",
          project_id: Ecto.UUID.generate(),
          space_id: Ecto.UUID.generate()
        })

      assert errors_on(changeset) == %{
               project_id: ["cannot have both project_id and space_id"],
               space_id: ["cannot have both project_id and space_id"]
             }
    end

    test "accepts either a space parent or a project parent" do
      assert ResourceHub.changeset(%{name: "Hub", space_id: Ecto.UUID.generate()}).valid?
      assert ResourceHub.changeset(%{name: "Hub", project_id: Ecto.UUID.generate()}).valid?
    end
  end

  describe "space-backed hubs" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space, company_permissions: Binding.no_access())
      |> Factory.add_space_member(:space_member, :space, permissions: :view_access)
      |> Factory.add_company_member(:outsider)
      |> Factory.add_resource_hub(:hub, :space, :creator)
      |> Factory.add_folder(:folder, :hub)
      |> Factory.add_document(:document, :hub, folder: :folder)
      |> Factory.add_file(:hub_file, :hub, folder: :folder)
      |> Factory.add_link(:link, :hub, folder: :folder)
      |> then(&{:ok, &1})
    end

    test "hub resources inherit access from the parent space", ctx do
      assert_can_get(ResourceHub, ctx.space_member, ctx.hub.id)
      assert_can_get(Folder, ctx.space_member, ctx.folder.id)
      assert_can_get(Document, ctx.space_member, ctx.document.id)
      assert_can_get(File, ctx.space_member, ctx.hub_file.id)
      assert_can_get(Link, ctx.space_member, ctx.link.id)

      assert_cannot_get(ResourceHub, ctx.outsider, ctx.hub.id)
      assert_cannot_get(Folder, ctx.outsider, ctx.folder.id)
      assert_cannot_get(Document, ctx.outsider, ctx.document.id)
      assert_cannot_get(File, ctx.outsider, ctx.hub_file.id)
      assert_cannot_get(Link, ctx.outsider, ctx.link.id)
    end

    test "potential subscribers come from space members", ctx do
      hub = ResourceHub.load_potential_subscribers(ctx.hub)
      subscriber_ids = MapSet.new(Enum.map(hub.potential_subscribers, & &1.person.id))

      assert MapSet.member?(subscriber_ids, ctx.space_member.id)
      refute MapSet.member?(subscriber_ids, ctx.outsider.id)
    end
  end

  describe "project-backed hubs" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space, company_permissions: Binding.no_access())
      |> Factory.add_space_member(:space_member, :space, permissions: :view_access)
      |> Factory.add_project(:project, :space, company_access_level: Binding.no_access(), space_access_level: Binding.no_access())
      |> Factory.add_project_contributor(:project_member, :project, :as_person)
      |> Factory.add_resource_hub(:hub, :project, :creator)
      |> Factory.add_folder(:folder, :hub)
      |> Factory.add_document(:document, :hub, folder: :folder)
      |> Factory.add_file(:hub_file, :hub, folder: :folder)
      |> Factory.add_link(:link, :hub, folder: :folder)
      |> then(&{:ok, &1})
    end

    test "hub resources inherit access from the parent project", ctx do
      assert_can_get(ResourceHub, ctx.project_member, ctx.hub.id)
      assert_can_get(Folder, ctx.project_member, ctx.folder.id)
      assert_can_get(Document, ctx.project_member, ctx.document.id)
      assert_can_get(File, ctx.project_member, ctx.hub_file.id)
      assert_can_get(Link, ctx.project_member, ctx.link.id)

      assert_cannot_get(ResourceHub, ctx.space_member, ctx.hub.id)
      assert_cannot_get(Folder, ctx.space_member, ctx.folder.id)
      assert_cannot_get(Document, ctx.space_member, ctx.document.id)
      assert_cannot_get(File, ctx.space_member, ctx.hub_file.id)
      assert_cannot_get(Link, ctx.space_member, ctx.link.id)
    end

    test "potential subscribers come from project contributors", ctx do
      hub = ResourceHub.load_potential_subscribers(ctx.hub)
      subscriber_ids = MapSet.new(Enum.map(hub.potential_subscribers, & &1.person.id))

      assert MapSet.member?(subscriber_ids, ctx.project_member.id)
      refute MapSet.member?(subscriber_ids, ctx.space_member.id)
    end
  end

  defp assert_can_get(module, requester, id) do
    assert {:ok, resource} = module.get(requester, id: id)
    assert resource.id == id
  end

  defp assert_cannot_get(module, requester, id) do
    assert {:error, :not_found} = module.get(requester, id: id)
  end
end
