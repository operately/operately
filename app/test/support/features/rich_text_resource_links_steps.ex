defmodule Operately.Support.Features.RichTextResourceLinksSteps do
  use Operately.FeatureCase

  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space, name: "Website launch")
    |> Factory.add_resource_hub(:hub, :space, :creator)
    |> Factory.add_document(:document, :hub)
    |> Factory.preload(:document, :resource_hub)
    |> Factory.log_in_person(:creator)
  end

  step :edit_document, ctx do
    ctx |> UI.visit(Paths.edit_document_path(ctx.company, ctx.document)) |> UI.assert_has(css: "[contenteditable=true]")
  end

  step :paste_link, ctx do
    ctx = UI.fill_rich_text(ctx, "")
    paste(ctx, false)
    ctx
  end

  step :paste_and_save_immediately, ctx do
    ctx = UI.fill_rich_text(ctx, "")
    paste(ctx, true)
    ctx |> UI.refute_has(testid: "submit")
  end

  step :assert_editor_title, ctx do
    ctx |> UI.assert_has(Wallaby.Query.css("[contenteditable=true] a[href='#{url(ctx)}']", text: ctx.project.name))
  end

  step :save_document, ctx do
    ctx |> UI.click(testid: "submit") |> UI.refute_has(testid: "submit")
  end

  step :assert_persisted_url, ctx do
    saved = Repo.reload!(ctx.document).content
    [paragraph | _] = saved["content"]
    assert [%{"text" => title, "marks" => marks}] = paragraph["content"]
    assert title == url(ctx)
    assert Enum.any?(marks, &(&1["type"] == "link" && &1["attrs"]["href"] == url(ctx)))
    refute Jason.encode!(saved) =~ "operatelyResourceLink"
    ctx
  end

  defp url(ctx), do: OperatelyWeb.Endpoint.url() <> Paths.project_path(ctx.company, ctx.project)

  defp paste(ctx, save_immediately) do
    Wallaby.Browser.execute_script(ctx.session, """
      const editor = document.querySelector('[contenteditable=true]');
      editor.focus();
      const data = new DataTransfer();
      data.setData('text/plain', arguments[0]);
      editor.dispatchEvent(new ClipboardEvent('paste', {bubbles: true, cancelable: true, clipboardData: data}));
      if (arguments[1]) setTimeout(() => document.querySelector('[data-test-id=submit]').click(), 0);
    """, [url(ctx), save_immediately])
  end
end
