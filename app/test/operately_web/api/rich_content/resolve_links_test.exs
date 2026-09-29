defmodule OperatelyWeb.Api.RichContent.ResolveLinksTest do
  use OperatelyWeb.TurboCase

  alias Operately.Access.Binding

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space, name: "Website")
    |> Factory.log_in_person(:creator)
  end

  test "resolves internal links and preserves destinations", ctx do
    path = Paths.project_path(ctx.company, ctx.project)
    url = OperatelyWeb.Endpoint.url() <> path <> "?tab=overview#comments"
    assert {200, %{links: links}} = query(ctx.conn, [:rich_content, :resolve_links], %{urls: [path, url, path, "https://example.com" <> path, "/bad"]})
    assert links == [%{url: path, title: "Website"}, %{url: url, title: "Website"}]
  end

  test "requires authentication", ctx do
    assert {401, _} = query(Phoenix.ConnTest.build_conn(), [:rich_content, :resolve_links], %{urls: [Paths.project_path(ctx.company, ctx.project)]})
  end

  test "accepts exactly 100 URLs", ctx do
    projects = Enum.map(1..100, fn index -> Factory.add_project(ctx, :batch_project, :space, name: "Project #{index}").batch_project end)
    expected = Enum.map(projects, &%{url: Paths.project_path(ctx.company, &1), title: &1.name})
    assert {200, %{links: ^expected}} = query(ctx.conn, [:rich_content, :resolve_links], %{urls: Enum.map(expected, & &1.url)})
  end

  test "rejects oversized batches", ctx do
    assert {400, _} = query(ctx.conn, [:rich_content, :resolve_links], %{urls: List.duplicate("/bad", 101)})
  end

  test "accepts empty batches", ctx do
    assert {200, %{links: []}} = query(ctx.conn, [:rich_content, :resolve_links], %{urls: []})
  end

  test "requires the urls field", ctx do
    assert {400, _} = query(ctx.conn, [:rich_content, :resolve_links], %{})
  end

  test "rejects malformed lists and non-string entries", ctx do
    for urls <- ["not-a-list", %{"url" => "/bad"}, [%{"url" => "/bad"}]] do
      assert {400, _} = query(ctx.conn, [:rich_content, :resolve_links], %{urls: urls})
    end
  end

  test "returns titles with view-only company access", ctx do
    ctx =
      ctx
      |> Factory.add_project(:viewable, :space, company_access_level: Binding.view_access(), space_access_level: Binding.no_access())
      |> Factory.add_company_member(:viewer)
      |> Factory.log_in_person(:viewer)

    {:ok, project} = Operately.Projects.Project.get(ctx.viewer, id: ctx.viewable.id)
    assert project.request_info.access_level == Binding.view_access()
    url = Paths.project_path(ctx.company, project)
    assert {200, %{links: [%{url: ^url, title: "viewable"}]}} = query(ctx.conn, [:rich_content, :resolve_links], %{urls: [url]})
  end

  test "returns only accessible resources from a mixed batch", ctx do
    ctx =
      ctx
      |> Factory.add_project(:private, :space, company_access_level: Binding.no_access(), space_access_level: Binding.no_access())
      |> Factory.add_company_member(:viewer)
      |> Factory.log_in_person(:viewer)

    public_url = Paths.project_path(ctx.company, ctx.project)
    private_url = Paths.project_path(ctx.company, ctx.private)
    assert {200, %{links: [%{url: ^public_url, title: "Website"}]}} =
             query(ctx.conn, [:rich_content, :resolve_links], %{urls: [private_url, public_url]})
  end

  test "child resources inherit project access granted through the space", ctx do
    ctx =
      ctx
      |> Factory.add_project(:project, :space, company_access_level: Binding.no_access(), space_access_level: Binding.view_access())
      |> add_project_resources()
      |> Factory.add_space_member(:viewer, :space, permissions: :view_access)
      |> Factory.add_company_member(:outsider)

    {:ok, project} = Operately.Projects.Project.get(ctx.viewer, id: ctx.project.id)
    assert project.request_info.access_level == Binding.view_access()
    expected = project_resource_links(ctx)
    urls = Enum.map(expected, & &1.url)
    viewer = Factory.log_in_person(ctx, :viewer)
    outsider = Factory.log_in_person(ctx, :outsider)

    assert {200, %{links: ^expected}} = query(viewer.conn, [:rich_content, :resolve_links], %{urls: urls})
    assert {200, %{links: []}} = query(outsider.conn, [:rich_content, :resolve_links], %{urls: urls})
  end

  test "space resource hubs restrict documents and files to space viewers", ctx do
    ctx =
      ctx
      |> Factory.add_space(:private_space, company_permissions: Binding.no_access())
      |> Factory.add_resource_hub(:hub, :private_space, :creator)
      |> Factory.add_document(:document, :hub)
      |> Factory.add_file(:file, :hub)
      |> Factory.add_space_member(:viewer, :private_space, permissions: :view_access)
      |> Factory.add_company_member(:outsider)

    expected = [
      %{url: Paths.document_path(ctx.company, ctx.document), title: ctx.document.name},
      %{url: Paths.file_path(ctx.company, ctx.file), title: ctx.file.name}
    ]
    urls = Enum.map(expected, & &1.url)
    viewer = Factory.log_in_person(ctx, :viewer)
    outsider = Factory.log_in_person(ctx, :outsider)

    assert {200, %{links: ^expected}} = query(viewer.conn, [:rich_content, :resolve_links], %{urls: urls})
    assert {200, %{links: []}} = query(outsider.conn, [:rich_content, :resolve_links], %{urls: urls})
  end

  test "omits other-company resources even when URLs use the current company prefix", ctx do
    other =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> add_project_resources()

    urls = Enum.map(project_resource_links(other), & &1.url)
    disguised_urls = Enum.map(project_resource_links(%{other | company: ctx.company}), & &1.url)
    assert {200, %{links: []}} = query(ctx.conn, [:rich_content, :resolve_links], %{urls: urls ++ disguised_urls})
  end

  test "stops resolving a resource after deletion for the same viewer", ctx do
    ctx = ctx |> Factory.add_company_member(:viewer) |> Factory.log_in_person(:viewer)
    url = Paths.project_path(ctx.company, ctx.project)
    assert {200, %{links: [%{url: ^url, title: "Website"}]}} = query(ctx.conn, [:rich_content, :resolve_links], %{urls: [url]})
    Repo.soft_delete!(ctx.project)
    assert {200, %{links: []}} = query(ctx.conn, [:rich_content, :resolve_links], %{urls: [url]})
  end

  test "only the author can resolve a draft discussion", ctx do
    ctx =
      ctx
      |> Factory.add_messages_board(:board, :space)
      |> Factory.add_draft_message(:draft, :board, title: "Unpublished")
      |> Factory.add_company_member(:viewer)

    url = Paths.message_path(ctx.company, ctx.draft)
    assert {200, %{links: [%{url: ^url, title: "Unpublished"}]}} = query(ctx.conn, [:rich_content, :resolve_links], %{urls: [url]})
    viewer = Factory.log_in_person(ctx, :viewer)
    assert {200, %{links: []}} = query(viewer.conn, [:rich_content, :resolve_links], %{urls: [url]})
  end

  defp add_project_resources(ctx) do
    ctx
    |> Factory.add_project_milestone(:milestone, :project)
    |> Factory.add_project_task(:task, :milestone)
    |> Factory.add_resource_hub(:hub, :project, :creator)
    |> Factory.add_document(:document, :hub)
    |> Factory.add_file(:file, :hub)
    |> Factory.add_folder(:folder, :hub)
    |> Factory.add_link(:link, :hub)
  end

  defp project_resource_links(ctx) do
    [
      %{url: Paths.project_path(ctx.company, ctx.project), title: ctx.project.name},
      %{url: Paths.project_milestone_path(ctx.company, ctx.milestone), title: ctx.milestone.title},
      %{url: Paths.task_path(ctx.company, ctx.task), title: ctx.task.name},
      %{url: Paths.document_path(ctx.company, ctx.document), title: ctx.document.name},
      %{url: Paths.file_path(ctx.company, ctx.file), title: ctx.file.name},
      %{url: Paths.folder_path(ctx.company, ctx.folder), title: ctx.folder.name},
      %{url: Paths.link_path(ctx.company, ctx.link), title: ctx.link.name}
    ]
  end
end
