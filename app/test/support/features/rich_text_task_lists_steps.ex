defmodule Operately.Support.Features.RichTextTaskListsSteps do
  use Operately.FeatureCase

  def setup(ctx) do
    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space, company_access_level: Operately.Access.Binding.no_access(), space_access_level: Operately.Access.Binding.view_access())
      |> Factory.add_resource_hub(:hub, :space, :creator)
      |> Factory.add_document(:document, :hub)
      |> Factory.preload(:document, :resource_hub)
      |> Factory.add_comment(:comment, :document)
      |> Factory.add_space_member(:viewer, :space, permissions: :view_access)

    ctx.project |> Ecto.Changeset.change(description: content("Project item")) |> Repo.update!()
    ctx.document |> Ecto.Changeset.change(content: content("Document item")) |> Repo.update!()
    ctx.comment |> Ecto.Changeset.change(content: content("Comment item")) |> Repo.update!()
    UI.login_as(ctx, ctx.creator)
  end

  step :visit_document, ctx do
    ctx |> UI.visit(Paths.document_path(ctx.company, ctx.document)) |> UI.assert_has(css: checkbox("Document item"))
  end

  step :visit_new_document, ctx do
    ctx |> UI.visit(Paths.new_document_path(ctx.company, ctx.hub)) |> UI.fill(testid: "title", with: "Toolbar task list")
  end

  step :create_task_list_from_toolbar, ctx do
    ctx = ctx |> UI.click(testid: "toolbar-button-task-list") |> UI.assert_has(css: checkbox("Task item"))
    Wallaby.Browser.send_keys(ctx.session, ["Created from toolbar", :enter, "Second item"])

    ctx
    |> UI.assert_has(css: checkbox("Created from toolbar"))
    |> UI.assert_has(css: checkbox("Second item"))
    |> UI.click(testid: "submit")
    |> UI.refute_has(testid: "submit")
  end

  step :assert_created_task_list, ctx do
    {:ok, document} = Operately.ResourceHubs.Document.get(:system, name: "Toolbar task list")
    assert get_in(document.content, ["content", Access.at(0), "type"]) == "taskList"
    assert length(get_in(document.content, ["content", Access.at(0), "content"])) == 2
    ctx |> UI.visit(Paths.document_path(ctx.company, document)) |> UI.assert_has(css: checkbox("Created from toolbar")) |> UI.assert_has(css: checkbox("Second item"))
  end

  step :visit_project, ctx do
    ctx |> UI.visit(Paths.project_path(ctx.company, ctx.project)) |> UI.assert_has(css: checkbox("Project item"))
  end

  step :toggle_and_reload, ctx, label do
    ctx =
      if label == "Document item" do
        Wallaby.Browser.find(ctx.session, Wallaby.Query.css(checkbox(label)), fn element -> Wallaby.Browser.send_keys(element, [" "]) end)
        ctx
      else
        UI.click(ctx, css: checkbox(label))
      end

    ctx = ctx |> UI.assert_has(css: checkbox(label) <> "[aria-checked='true']:not([disabled])")
    path = Wallaby.Browser.current_url(ctx.session)
    ctx |> UI.visit(path) |> UI.assert_has(css: checkbox(label) <> "[aria-checked='true']")
  end

  step :assert_document_version, ctx do
    document = Repo.reload!(ctx.document)
    assert document.current_version == ctx.document.current_version + 1
    assert checked(document.content)
    ctx
  end

  step :login_as_viewer, ctx do
    UI.login_as(ctx, ctx.viewer)
  end

  step :assert_disabled, ctx, label do
    UI.assert_has(ctx, css: checkbox(label) <> "[disabled][aria-checked='false']")
  end

  step :change_document_concurrently, ctx do
    ctx.document |> Ecto.Changeset.change(content: content("Updated document item")) |> Repo.update!()
    ctx
  end

  step :toggle_stale_document, ctx do
    ctx |> UI.click(css: checkbox("Document item")) |> UI.assert_has(css: checkbox("Updated document item") <> "[aria-checked='false']:not([disabled])")
  end

  step :assert_concurrent_content_preserved, ctx do
    document = Repo.reload!(ctx.document)
    assert document.content == content("Updated document item")
    assert document.current_version == ctx.document.current_version
    ctx
  end

  defp checkbox(label), do: "[data-test-id='task-list-checkbox'][aria-label='#{label}']"
  defp checked(content), do: get_in(content, ["content", Access.at(0), "content", Access.at(0), "attrs", "checked"])

  defp content(label),
    do: %{
      "type" => "doc",
      "content" => [
        %{"type" => "taskList", "content" => [%{"type" => "taskItem", "attrs" => %{"checked" => false}, "content" => [%{"type" => "paragraph", "content" => [%{"type" => "text", "text" => label}]}]}]}
      ]
    }
end
