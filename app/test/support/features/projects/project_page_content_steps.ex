defmodule Operately.Support.Features.Projects.ProjectPageContentSteps do
  use Operately.FeatureCase

  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
    |> Factory.fetch_default_project_resource_hub(:hub, :project)
    |> Factory.add_document(:document, :hub)
    |> Factory.add_project_milestone(:milestone, :project)
    |> Factory.add_project_task(:task, :milestone)
    |> Factory.submit_project_check_in(:check_in, :project, :creator)
    |> Factory.add_project_discussion(:discussion, :project)
    |> Factory.log_in_person(:creator)
  end

  step :visit_work_map, ctx do
    UI.visit(ctx, Paths.space_work_map_path(ctx.company, ctx.space) <> "?tab=projects")
  end

  step :visit_task, ctx do
    ctx
    |> UI.visit(Paths.task_path(ctx.company, ctx.task))
    |> UI.assert_has(testid: "tab-check-ins")
  end

  step :open_project, ctx do
    UI.click_link(ctx, ctx.project.name)
  end

  step :open_tab, ctx, tab do
    label = if tab == "docs-and-files", do: "docs & files", else: tab
    UI.click(ctx, testid: "tab-#{label}")
  end

  step :assert_overview_loaded, ctx do
    UI.assert_has(ctx, testid: "project-name-field")
  end

  step :assert_still_on_task, ctx do
    UI.assert_location(ctx, Paths.task_path(ctx.company, ctx.task))
  end

  step :assert_skeleton, ctx, tab do
    UI.assert_has(ctx, testid: "#{tab}-skeleton")
  end

  step :assert_content_loaded, ctx, tab do
    selector =
      case tab do
        "check-ins" -> [css: "a[href='#{Paths.project_check_in_path(ctx.company, ctx.check_in)}']"]
        "discussions" -> [css: "a[href='#{Paths.project_discussion_path(ctx.company, ctx.discussion)}']"]
        "tasks" -> [testid: UI.testid(["task", Paths.task_id(ctx.task)])]
        "docs-and-files" -> [css: "a[href='#{Paths.document_path(ctx.company, ctx.document)}']"]
      end

    ctx
    |> UI.assert_has(selector)
    |> UI.refute_has(testid: "#{tab}-skeleton")
  end

  step :create_document_and_return_to_project, ctx, name do
    ctx
    |> UI.click(testid: "add-options")
    |> UI.click(testid: "new-document")
    |> UI.fill(testid: "title", with: name)
    |> UI.fill_rich_text("A new project document")
    |> UI.click(testid: "submit")
    |> UI.assert_has(testid: "resource-hub-document-page")
    |> UI.find(UI.query(testid: "navigation"), fn el -> UI.click_link(el, "Docs & Files") end)
    |> UI.assert_has(testid: "docs-and-files-tab")
    |> UI.assert_text(name)
  end

  step :pause_content_requests, ctx do
    script = """
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;
    window.projectContentRequests = [];
    window.projectContentPending = [];
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      this.contentPath = new URL(url, window.location.origin).pathname;
      return originalOpen.call(this, method, url, ...args);
    };
    XMLHttpRequest.prototype.send = function(...args) {
      const tab = this.contentPath.endsWith('/projects/list_check_ins') ? 'check-ins'
        : this.contentPath.endsWith('/projects/list_discussions') ? 'discussions'
        : this.contentPath.endsWith('/tasks/list') ? 'tasks'
        : this.contentPath.endsWith('/resource_hubs/get') ? 'docs-hub'
        : this.contentPath.endsWith('/resource_hubs/list_nodes') ? 'docs-and-files' : null;
      if (!tab) return originalSend.apply(this, args);
      window.projectContentRequests.push(tab);
      window.projectContentPending.push({ tab, send: () => originalSend.apply(this, args) });
    };
    """

    UI.execute("pause_content_requests", ctx, fn session -> Wallaby.Browser.execute_script(session, script) end)
  end

  step :release_content, ctx, tab do
    script = """
    const pending = window.projectContentPending.filter(request => request.tab === #{Jason.encode!(tab)});
    window.projectContentPending = window.projectContentPending.filter(request => request.tab !== #{Jason.encode!(tab)});
    pending.forEach(request => request.send());
    """

    UI.execute("release_content", ctx, fn session -> Wallaby.Browser.execute_script(session, script) end)
  end

  step :assert_content_requests, ctx, expected do
    attempts(ctx, 5, fn ->
      Wallaby.Browser.execute_script(ctx.session, "return window.projectContentRequests", fn requests ->
        assert Enum.sort(requests) == Enum.sort(expected)
      end)
    end)
  end

  step :upload_project_file, ctx do
    # The picker creates a detached input; expose it to WebDriver without opening
    # the operating system file dialog. The real upload pipeline still runs.
    script = """
    const original = HTMLInputElement.prototype.click;
    HTMLInputElement.prototype.click = function() {
      if (this.type !== "file") return original.call(this);
      HTMLInputElement.prototype.click = original;
      this.dataset.testId = "project-file-upload";
      this.style.display = "none";
      document.body.appendChild(this);
    };
    """

    ctx
    |> then(fn ctx -> UI.execute("prepare_file_picker", ctx, fn session -> Wallaby.Browser.execute_script(session, script) end) end)
    |> UI.click(testid: "add-options")
    |> UI.click(testid: "upload-files")
    |> UI.upload_file(testid: "project-file-upload", path: "/home/dev/app/README.md")
    |> UI.click(testid: "submit")
    |> UI.refute_has(testid: "submit")
    |> assert_uploaded_project_file()
  end

  step :assert_uploaded_project_file, ctx do
    ctx = UI.assert_text(ctx, "README.md")

    attempts(ctx, 5, fn ->
      file = Operately.Repo.get_by!(Operately.ResourceHubs.File, author_id: ctx.creator.id, name: "README.md") |> Operately.Repo.preload(:node)
      assert file.node.resource_hub_id == ctx.hub.id
      blob = Operately.Repo.get!(Operately.Blobs.Blob, file.blob_id)
      assert blob.status == :uploaded
    end)
  end
end
