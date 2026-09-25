defmodule Operately.Support.Features.RichTextTablesSteps do
  use Operately.FeatureCase

  @html "<p>Before</p><table><tr><th>Name</th><th>Notes</th></tr><tr><td>Alice</td><td><strong>Ready</strong></td></tr></table><p>After</p>"

  def setup(ctx) do
    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space, company_access_level: Operately.Access.Binding.no_access(), space_access_level: Operately.Access.Binding.view_access())
      |> Factory.add_resource_hub(:hub, :space, :creator)
      |> Factory.add_document(:document, :hub)
      |> Factory.preload(:document, :resource_hub)
      |> Factory.add_space_member(:viewer, :space, permissions: :view_access)

    ctx.project |> Ecto.Changeset.change(description: Operately.Support.RichText.rich_text("Project notes")) |> Repo.update!()
    Factory.log_in_person(ctx, :creator)
  end

  step :visit_document, ctx do
    ctx |> UI.visit(Paths.document_path(ctx.company, ctx.document))
  end

  step :visit_project, ctx do
    ctx |> UI.visit(Paths.project_path(ctx.company, ctx.project))
  end

  step :edit_document, ctx do
    ctx |> UI.visit(Paths.edit_document_path(ctx.company, ctx.document)) |> UI.assert_has(css: "[contenteditable=true]")
  end

  step :paste_table, ctx do
    ctx = UI.fill_rich_text(ctx, "")

    Wallaby.Browser.execute_script(
      ctx.session,
      """
        const editor = document.querySelector('[contenteditable=true]');
        editor.focus();
        const data = new DataTransfer();
        data.setData('text/html', arguments[0]);
        editor.dispatchEvent(new ClipboardEvent('paste', {bubbles: true, cancelable: true, clipboardData: data}));
      """,
      [@html]
    )

    ctx |> UI.assert_has(css: "[contenteditable=true] table")
  end

  step :save_document, ctx do
    ctx |> UI.click(testid: "submit") |> UI.refute_has(testid: "submit")
  end

  step :reload_table, ctx do
    path = Wallaby.Browser.current_url(ctx.session)
    ctx |> UI.visit(path) |> UI.assert_has(Wallaby.Query.css("table td", text: "Alice")) |> UI.assert_has(Wallaby.Query.css("table strong", text: "Ready"))
  end

  step :assert_document_version, ctx do
    document = Repo.reload!(ctx.document)
    assert document.current_version == 2
    [version, previous] = Operately.ResourceHubs.DocumentVersion.list_for_document(document.id)
    assert version.editor_id == ctx.creator.id
    assert version.content == document.content
    assert previous.content == ctx.document.content
    ctx
  end

  step :replace_text, ctx do
    ctx |> UI.fill_rich_text("Discard this edit")
  end

  step :cancel_document, ctx do
    ctx |> UI.click(testid: "cancel") |> UI.refute_has(testid: "submit")
  end

  step :edit_description, ctx do
    ctx |> visit_project() |> UI.click(testid: "edit-description") |> UI.assert_has(css: "[contenteditable=true]")
  end

  step :save_description, ctx do
    ctx |> UI.click(Wallaby.Query.button("Save")) |> UI.refute_has(css: "[contenteditable=true]")
  end

  step :open_comment, ctx do
    ctx |> visit_document() |> UI.click(testid: "add-comment") |> UI.assert_has(css: "[contenteditable=true]")
  end

  step :save_comment, ctx do
    ctx |> UI.click(testid: "post-comment") |> UI.refute_has(css: "[contenteditable=true]")
  end

  step :given_table_content, ctx do
    content = "test/fixtures/rich_text/tables.json" |> File.read!() |> Jason.decode!() |> Enum.at(1) |> Map.fetch!("document")
    ctx.document |> Ecto.Changeset.change(content: content) |> Repo.update!()
    ctx.project |> Ecto.Changeset.change(description: content) |> Repo.update!()
    ctx
  end

  step :login_as_viewer, ctx do
    UI.login_as(ctx, ctx.viewer)
  end

  step :assert_read_only, ctx do
    ctx |> UI.assert_has(css: "table") |> UI.refute_has(css: "[contenteditable=true]") |> UI.refute_has(testid: "edit-description") |> UI.refute_has(testid: "edit-document-link")
  end
end
