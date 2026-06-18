defmodule Operately.ResourceHubs.GetterTest do
  use Operately.DataCase

  alias Operately.Access.Binding
  alias Operately.ResourceHubs.{Document, File, Folder, Link, Node, ResourceHub}

  describe "space-backed hubs" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space, company_permissions: Binding.no_access())
      |> Factory.add_space_member(:viewer, :space, permissions: :view_access)
      |> Factory.add_space_member(:editor, :space, permissions: :edit_access)
      |> Factory.add_company_member(:outsider)
      |> Factory.add_resource_hub(:hub, :space, :creator)
      |> Factory.add_folder(:folder, :hub)
      |> Factory.add_document(:document, :hub, folder: :folder)
      |> Factory.add_file(:hub_file, :hub, folder: :folder)
      |> Factory.add_link(:link, :hub, folder: :folder)
      |> preload_nodes()
      |> then(&{:ok, &1})
    end

    test "ResourceHub.get uses the hub auth path and evaluates permissions", ctx do
      assert {:ok, hub} = ResourceHub.get(ctx.viewer, id: ctx.hub.id)
      assert hub.id == ctx.hub.id
      assert hub.request_info.requester.id == ctx.viewer.id
      assert hub.request_info.access_level == Binding.view_access()

      assert {:error, :not_found} = ResourceHub.get(ctx.outsider, id: ctx.hub.id)
      assert {:error, :not_found} =
               ResourceHub.get(ctx.viewer, id: ctx.hub.id, opts: [required_access_level: Binding.edit_access()])

      assert {:ok, hub} =
               ResourceHub.get(ctx.editor, id: ctx.hub.id, opts: [required_access_level: Binding.edit_access()])

      assert hub.request_info.access_level == Binding.edit_access()
    end

    test "Node.get uses the node auth path for all resource node types", ctx do
      [ctx.folder_node, ctx.document_node, ctx.file_node, ctx.link_node]
      |> Enum.each(fn node ->
        assert {:ok, fetched} = Node.get(ctx.viewer, id: node.id)
        assert fetched.id == node.id
        assert fetched.request_info.access_level == Binding.view_access()
      end)

      assert {:error, :not_found} = Node.get(ctx.outsider, id: ctx.folder_node.id)
      assert {:error, :not_found} =
               Node.get(ctx.viewer, id: ctx.folder_node.id, opts: [required_access_level: Binding.edit_access()])

      assert {:ok, node} =
               Node.get(ctx.editor, id: ctx.folder_node.id, opts: [required_access_level: Binding.edit_access()])

      assert node.request_info.access_level == Binding.edit_access()
    end

    test "node-child getters use the node_child auth path and evaluate permissions", ctx do
      [
        {Folder, ctx.folder.id},
        {Document, ctx.document.id},
        {File, ctx.hub_file.id},
        {Link, ctx.link.id}
      ]
      |> Enum.each(fn {module, id} ->
        assert {:ok, resource} = module.get(ctx.viewer, id: id)
        assert resource.id == id
        assert resource.request_info.access_level == Binding.view_access()

        assert {:error, :not_found} = module.get(ctx.outsider, id: id)

        assert {:error, :not_found} =
                 module.get(ctx.viewer, id: id, opts: [required_access_level: Binding.edit_access()])

        assert {:ok, resource} =
                 module.get(ctx.editor, id: id, opts: [required_access_level: Binding.edit_access()])

        assert resource.request_info.access_level == Binding.edit_access()
      end)
    end
  end

  describe "project-backed hubs" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space, company_permissions: Binding.no_access())
      |> Factory.add_space_member(:space_member, :space, permissions: :view_access)
      |> Factory.add_project(:project, :space, company_access_level: Binding.no_access(), space_access_level: Binding.no_access())
      |> Factory.add_project_contributor(:project_viewer, :project, :as_person)
      |> Factory.add_resource_hub(:hub, :project, :creator)
      |> Factory.add_document(:document, :hub)
      |> then(&{:ok, &1})
    end

    test "getters resolve access through the project context", ctx do
      assert {:ok, hub} = ResourceHub.get(ctx.project_viewer, id: ctx.hub.id)
      assert hub.request_info.access_level == Binding.edit_access()

      assert {:ok, document} = Document.get(ctx.project_viewer, id: ctx.document.id)
      assert document.request_info.access_level == Binding.edit_access()

      assert {:error, :not_found} = ResourceHub.get(ctx.space_member, id: ctx.hub.id)
      assert {:error, :not_found} = Document.get(ctx.space_member, id: ctx.document.id)
    end
  end

  describe "goal-backed hubs" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space, company_permissions: Binding.no_access())
      |> Factory.add_space_member(:space_member, :space, permissions: :view_access)
      |> Factory.add_company_member(:goal_editor)
      |> Factory.add_goal(:goal, :space, company_access: Binding.no_access(), space_access: Binding.no_access())
      |> grant_goal_access(:goal_editor, :goal, :edit_access)
      |> Factory.add_resource_hub(:hub, :goal, :creator)
      |> Factory.add_folder(:folder, :hub)
      |> Factory.add_document(:document, :hub, folder: :folder)
      |> Factory.add_file(:hub_file, :hub, folder: :folder)
      |> Factory.add_link(:link, :hub, folder: :folder)
      |> preload_nodes()
      |> then(&{:ok, &1})
    end

    test "getters resolve access through the goal context", ctx do
      assert {:ok, hub} =
               ResourceHub.get(ctx.goal_editor, id: ctx.hub.id, opts: [required_access_level: Binding.edit_access()])

      assert hub.request_info.access_level == Binding.edit_access()
      assert {:error, :not_found} = ResourceHub.get(ctx.space_member, id: ctx.hub.id)

      [ctx.folder_node, ctx.document_node, ctx.file_node, ctx.link_node]
      |> Enum.each(fn node ->
        assert {:ok, fetched} =
                 Node.get(ctx.goal_editor, id: node.id, opts: [required_access_level: Binding.edit_access()])

        assert fetched.id == node.id
        assert fetched.request_info.access_level == Binding.edit_access()
        assert {:error, :not_found} = Node.get(ctx.space_member, id: node.id)
      end)

      [
        {Folder, ctx.folder.id},
        {Document, ctx.document.id},
        {File, ctx.hub_file.id},
        {Link, ctx.link.id}
      ]
      |> Enum.each(fn {module, id} ->
        assert {:ok, resource} =
                 module.get(ctx.goal_editor, id: id, opts: [required_access_level: Binding.edit_access()])

        assert resource.id == id
        assert resource.request_info.access_level == Binding.edit_access()
        assert {:error, :not_found} = module.get(ctx.space_member, id: id)
      end)
    end
  end

  defp preload_nodes(ctx) do
    folder = Repo.preload(ctx.folder, :node)
    document = Repo.preload(ctx.document, :node)
    hub_file = Repo.preload(ctx.hub_file, :node)
    link = Repo.preload(ctx.link, :node)

    ctx
    |> Map.put(:folder_node, folder.node)
    |> Map.put(:document_node, document.node)
    |> Map.put(:file_node, hub_file.node)
    |> Map.put(:link_node, link.node)
  end

  defp grant_goal_access(ctx, person_name, goal_name, access_level) do
    person = Map.fetch!(ctx, person_name)
    goal = Map.fetch!(ctx, goal_name)

    {:ok, _} =
      Operately.Operations.ResourceAccessGranting.run(person.id, [
        %{resource_type: :goal, resource_id: goal.id, access_level: access_level}
      ])

    ctx
  end
end
