defmodule Operately.Support.Features.ResourceHubDocument.InlineCommentsSteps do
  use Operately.FeatureCase
  import Ecto.Query

  step :setup, ctx do
    ctx = ctx |> Factory.setup() |> Factory.add_space(:space) |> Factory.add_resource_hub(:hub, :space, :creator)
    ctx = Factory.add_document(ctx, :document, :hub, content: Operately.Support.RichText.rich_text("Review this passage before Friday."))
    UI.login_as(ctx, ctx.creator)
  end

  step :visit_document, ctx do
    ctx
    |> UI.visit(Paths.document_path(ctx.company, ctx.document))
    |> UI.assert_has(css: "[data-test-id='resource-hub-document-page'] .ProseMirror[contenteditable='false']")
    |> UI.refute_has(testid: "inline-comments-floating")
  end

  step :given_table_content, ctx do
    content = "test/fixtures/rich_text/tables.json" |> File.read!() |> Jason.decode!() |> Enum.at(0) |> Map.fetch!("document")
    document = ctx.document |> Ecto.Changeset.change(content: content) |> Repo.update!()
    %{ctx | document: document}
  end

  step :capture_browser_errors, ctx do
    UI.execute("capture_browser_errors", ctx, fn session ->
      Wallaby.Browser.execute_script(session, """
      window.tableSelectionErrors = [];
      window.addEventListener('error', event => window.tableSelectionErrors.push(event.message));
      window.addEventListener('unhandledrejection', event => window.tableSelectionErrors.push(String(event.reason)));
      """)
    end)
  end

  step :select_table_passage, ctx do
    UI.execute("select_table_passage", ctx, fn session ->
      Wallaby.Browser.execute_script(session, """
      const editor = document.querySelector('[data-test-id="resource-hub-document-page"] .ProseMirror[contenteditable="false"]');
      const text = document.createTreeWalker(editor.querySelector('table tr:nth-child(2) td:first-child p'), NodeFilter.SHOW_TEXT).nextNode();
      editor.focus();
      const range = document.createRange();
      range.setStart(text, 0);
      range.setEnd(text, 4);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      """)
    end)
    |> UI.click(testid: "inline-add-selection")
    |> UI.assert_has(testid: "inline-new-thread")
  end

  step :close_thread, ctx do
    ctx
    |> UI.click(css: "[data-test-id='resource-hub-document-page'] table tr:nth-child(3) td:last-child")
    |> UI.assert_has(testid: "inline-select-#{ctx.thread_id}")
  end

  step :drag_across_table, ctx do
    UI.execute("drag_across_table", ctx, fn session ->
      session
      |> Wallaby.Browser.hover(Wallaby.Query.css("[data-test-id='resource-hub-document-page'] table tr:nth-child(2) td:first-child"))
      |> Wallaby.Browser.button_down()
      |> Wallaby.Browser.hover(Wallaby.Query.css("[data-test-id='resource-hub-document-page'] table tr:nth-child(3) td:last-child"))
      |> Wallaby.Browser.button_up()
    end)
  end

  step :assert_table_selection_and_highlight, ctx do
    ctx = UI.assert_has(ctx, Wallaby.Query.css("[data-test-id='resource-hub-document-page'] td.selectedCell", count: 4))

    UI.execute("assert_table_selection_and_highlight", ctx, fn session ->
      Wallaby.Browser.execute_script(
        session,
        """
        return {
          errors: window.tableSelectionErrors,
          highlight: document.querySelector('[data-test-id="resource-hub-document-page"] table [data-inline-thread="#{ctx.thread_id}"]')?.textContent
        };
        """,
        fn result ->
          assert result["errors"] == []
          assert result["highlight"] == "Bold"
        end
      )

      session
    end)
    |> then(fn ctx ->
      assert Repo.reload!(ctx.document).content == ctx.document.content
      ctx
    end)
  end

  step :reload_and_reopen_table_thread, ctx do
    ctx
    |> UI.visit(Paths.document_path(ctx.company, ctx.document))
    |> UI.assert_has(css: "[data-test-id='resource-hub-document-page'] table [data-inline-thread='#{ctx.thread_id}']")
    |> UI.click(testid: "inline-select-#{ctx.thread_id}")
    |> UI.assert_has(css: "[data-test-id='inline-thread-#{ctx.thread_id}'] div[data-test-id^='comment-'][id]")
  end

  step :select_passage, ctx do
    UI.execute("select_document_passage", ctx, fn session ->
      Wallaby.Browser.execute_script(session, """
      const editor = document.querySelector('[data-test-id="resource-hub-document-page"] .ProseMirror[contenteditable="false"]');
      const text = document.createTreeWalker(editor.querySelector('p'), NodeFilter.SHOW_TEXT).nextNode();
      editor.focus();
      const range = document.createRange();
      range.setStart(text, 0);
      range.setEnd(text, 19);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      """)
    end)
    |> UI.click(testid: "inline-add-selection")
    |> UI.assert_has(testid: "inline-comments-floating")
    |> UI.assert_has(testid: "inline-new-thread")
  end

  step :post_thread, ctx do
    ctx =
      ctx
      |> UI.fill_rich_text(testid: "inline-new-thread", with: "Please confirm the owner.")
      |> UI.click(css: "[data-test-id='inline-new-thread'] [data-test-id='post-comment']")
      |> UI.refute_has(testid: "inline-new-thread")

    thread = Repo.get_by!(Operately.Comments.InlineThread, resource_id: ctx.document.id)
    Map.put(ctx, :thread_id, Operately.ShortUuid.encode!(thread.id))
  end

  step :reply, ctx do
    ctx
    |> UI.click(css: "[data-test-id='inline-thread-#{ctx.thread_id}'] [data-test-id='add-comment']")
    |> UI.fill_rich_text(testid: "inline-thread-#{ctx.thread_id}", with: "I will own this.")
    |> UI.click(css: "[data-test-id='inline-thread-#{ctx.thread_id}'] [data-test-id='post-comment']")
    |> UI.assert_has(Wallaby.Query.css("[data-test-id='inline-thread-#{ctx.thread_id}'] div[data-test-id^='comment-'][id]", count: 2))
  end

  step :resolve_and_reopen, ctx do
    ctx = UI.hover(ctx, css: "[data-test-id='inline-thread-#{ctx.thread_id}'] div[data-test-id^='comment-'][id]:first-of-type")
    ctx = UI.click(ctx, testid: "inline-resolve-#{ctx.thread_id}")
    ctx = UI.assert_has(ctx, Wallaby.Query.css("[data-test-id='inline-thread-#{ctx.thread_id}'][data-resolved='true']"))
    ctx = UI.hover(ctx, css: "[data-test-id='inline-thread-#{ctx.thread_id}'] div[data-test-id^='comment-'][id]:first-of-type")
    ctx |> UI.click(testid: "inline-resolve-#{ctx.thread_id}") |> UI.assert_has(Wallaby.Query.css("[data-test-id='inline-thread-#{ctx.thread_id}'][data-resolved='false']"))
  end

  step :follow_thread_link, ctx do
    ctx
    |> UI.visit(Paths.document_path(ctx.company, ctx.document) <> "?inlineThread=" <> ctx.thread_id)
    |> UI.assert_has(testid: "inline-comments-floating")
    |> UI.assert_has(Wallaby.Query.css("[data-test-id='inline-thread-#{ctx.thread_id}'] div[data-test-id^='comment-'][id]", count: 2))
    |> UI.take_screenshot()
  end

  step :setup_email_link, ctx, resolved do
    ctx = Factory.add_inline_thread(ctx, :thread, :document, from: 1, to: 7, quote: "Review")
    [initial] = ctx.thread.messages
    {:ok, thread} = Operately.Operations.InlineThreadReplying.run(ctx.creator, ctx.thread, Operately.Support.RichText.rich_text("Follow-up"))
    [reply] = Enum.reject(thread.messages, &(&1.id == initial.id))
    if resolved, do: Operately.Operations.InlineThreadResolving.run(ctx.creator, thread)

    activity = Repo.one!(from a in Operately.Activities.Activity, where: a.action == "resource_hub_document_commented" and a.content["comment_id"] == ^reply.id)
    email = OperatelyEmail.Emails.ResourceHubDocumentCommentedEmail.buffered_item(ctx.creator, activity)

    Map.merge(ctx, %{email_url: email.item_url, reply_id: Paths.comment_id(reply), thread_id: Operately.ShortUuid.encode!(thread.id)})
  end

  step :follow_email_link, ctx, width do
    ctx = Map.update!(ctx, :session, &Wallaby.Browser.resize_window(&1, width, 900))

    ctx =
      ctx
      |> UI.visit(ctx.email_url)
      |> UI.assert_has(testid: "comment-#{ctx.reply_id}")
      |> UI.refute_has(css: "[data-test-id='inline-thread-#{ctx.thread_id}'] [contenteditable='true']")

    UI.execute("assert_linked_message_visible", ctx, fn session ->
      attempts(ctx, 20, fn ->
        Wallaby.Browser.execute_script(session, """
        const message = document.getElementById(#{Jason.encode!(ctx.reply_id)});
        const rect = message.getBoundingClientRect();
        return location.hash === '#' + message.id && rect.top >= 0 && rect.bottom <= window.innerHeight;
        """, fn visible -> assert visible end)
      end)
      session
    end)
  end
end
