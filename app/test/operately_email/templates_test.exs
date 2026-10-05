defmodule OperatelyEmail.TemplatesTest do
  use ExUnit.Case, async: true

  alias OperatelyEmail.Mailers.NotificationMailer

  @account_emails ~w(company_admin_added company_admin_removed company_owner_removing company_owners_adding
    company_member_restoring company_member_converted_to_guest company_members_permissions_edited guest_invited
    current_email_verification email_change_code email_changed email_activation_code reset_password)

  for template <- @account_emails do
    @template template
    test "#{template} localizes HTML and text with missing-locale fallback" do
      assigns = %{
        subject: "Subject", author: %Operately.People.Person{full_name: "<Ana> Silva"},
        company: %{name: "Company <literal>"}, link: "https://example.com/literal", login_url: "https://example.com/literal",
        previous_access_level: "Previous", updated_access_level: "Next", destination: "<literal>@example.com",
        new_email: "<literal>@example.com", code: "ABC-123", reset_url: "https://example.com/literal?token=literal"
      }
      english = render(@template, assigns, "en")
      portuguese = render(@template, assigns, "pt_BR")
      assert elem(english, 0) != elem(portuguese, 0)
      assert elem(english, 1) != elem(portuguese, 1)
      assert render(@template, assigns, "fr") == english
      for {html, text} <- [english, portuguese] do
        refute html =~ "<literal>"
        refute html =~ "<Ana>"
        refute html =~ "%{"
        refute text =~ "%{"
      end
    end
  end

  test "catalog-owned email emphasis preserves reordered text and literal email addresses" do
    html = OperatelyEmail.Templates.email_with_emphasis("<email/> is your address. <script>literal</script>", "<email/> & <user>@example.com")
      |> Phoenix.HTML.safe_to_string()
    assert html == "<strong>&lt;email/&gt; &amp; &lt;user&gt;@example.com</strong> is your address. &lt;script&gt;literal&lt;/script&gt;"
  end

  @work_emails ~w(
    goal_archived goal_champion_updating goal_check_in_acknowledgement goal_check_in
    goal_closing goal_created goal_description_changed goal_editing goal_reopening goal_reparent
    goal_retrospective_acknowledged goal_reviewer_updating goal_timeframe_editing
    milestone_description_updating milestone_due_date_updating project_archived
    project_champion_updating project_check_in_acknowledged project_check_in_submitted project_closed
    project_contributor_addition project_contributors_addition project_created project_description_changed
    project_due_date_updating project_goal_connection project_goal_disconnection project_milestone_creation
    project_pausing project_resuming project_retrospective_acknowledged project_reviewer_updating
    project_timeline_edited task_assignee_updating task_description_change task_due_date_updating task_moving
  )

  @discussion_emails ~w(
    discussion_posting discussion_comment_submitted goal_discussion_creation project_discussion_submitted
    comment_added goal_check_in_commented project_check_in_commented project_retrospective_commented
    project_milestone_commented project_task_commented space_task_commented kpi_entry_commented
    resource_hub_document_created resource_hub_document_edited resource_hub_document_deleted
    resource_hub_document_commented resource_hub_file_created resource_hub_file_deleted resource_hub_file_commented
    resource_hub_link_created resource_hub_link_edited resource_hub_link_deleted resource_hub_link_commented
    space_members_added
  )

  for template <- @discussion_emails do
    @template template
    test "#{template} translates complete headings and actions with literal user content" do
      assigns = discussion_assigns(@template)
      {english_html, english_text} = render(@template, assigns, "en")
      {portuguese_html, portuguese_text} = render(@template, assigns, "pt_BR")

      assert english_html != portuguese_html
      assert english_text != portuguese_text
      assert render(@template, assigns, "fr") == {english_html, english_text}

      for body <- [english_html, portuguese_html] do
        assert body =~ "&lt;Ana&gt; S."
        assert body =~ assigns.cta_url
        refute body =~ "<script>"
        refute body =~ "%{"
      end

      for body <- [english_text, portuguese_text] do
        assert body =~ "<Ana> S."
        assert body =~ assigns.cta_url
        refute body =~ "%{"
      end
    end
  end

  for template <- @work_emails do
    @template template
    test "#{template} translates HTML and plain text while preserving names and links" do
      assigns = assigns()
      {english_html, english_text} = render(@template, assigns, "en")
      {portuguese_html, portuguese_text} = render(@template, assigns, "pt_BR")

      assert english_html != portuguese_html
      assert english_text != portuguese_text

      for body <- [english_html, portuguese_html] do
        assert body =~ "&lt;Ana&gt; S."
        assert body =~ assigns.cta_url
        refute body =~ "%{"
        refute body =~ "<script>"
      end

      for body <- [english_text, portuguese_text] do
        assert body =~ "<Ana> S."
        assert body =~ assigns.cta_url
        refute body =~ "%{"
      end
    end
  end

  test "falls back to complete English sentences when a locale has no translations" do
    for template <- @work_emails do
      assert render(template, assigns(), "en") == render(template, assigns(), "fr")
    end
  end

  test "goal success identifiers remain unchanged in Portuguese" do
    for {success, expected} <- [{"yes", "Marcado como alcançado"}, {"no", "Marcado como não alcançado"}] do
      {html, _} = render("goal_closing", Map.put(assigns(), :success, success), "pt_BR")
      assert html =~ expected
      assert html =~ "User-written update"
    end
  end

  test "renders removed dates, assignments and descriptions in Portuguese" do
    assigns = Map.merge(assigns(), %{new_date: nil, new_assignee: nil, description: nil, champion: nil, reviewer: nil, new_parent_goal: nil})

    for {template, expected} <- [
          {"task_due_date_updating", "A data de conclusão foi removida."},
          {"milestone_due_date_updating", "A data de conclusão foi removida."},
          {"project_due_date_updating", "A data de conclusão foi removida."},
          {"task_description_change", "A descrição foi apagada."},
          {"task_assignee_updating", "O responsável foi removido."},
          {"project_champion_updating", "removeu o champion"},
          {"project_reviewer_updating", "removeu o revisor"},
          {"goal_reparent", "O objetivo superior foi removido"}
        ] do
      {html, _} = render(template, assigns, "pt_BR")
      assert html =~ expected
    end
  end

  test "document copies preserve original and new names without changing legacy plain text" do
    assigns = discussion_assigns("resource_hub_document_created")
    assigns = %{assigns | copied_document: %{name: "Original <literal>"}}
    {html, text} = render("resource_hub_document_created", assigns, "pt_BR")

    assert html =~ "criou uma cópia de Original &lt;literal&gt; e a nomeou Launch &lt;script&gt;"
    assert text =~ "adicionou um documento: Launch <script>"
    assert html =~ "User-written update"
  end

  test "file uploads translate counts and retain single-file and multi-file destinations" do
    for count <- [1, 2, 5] do
      assigns = discussion_assigns("resource_hub_file_created")
      assigns = %{assigns | files: List.duplicate(assigns.file, count), file_url: "https://example.com/file"}
      {html, text} = render("resource_hub_file_created", assigns, "pt_BR")
      {english_html, english_text} = render("resource_hub_file_created", assigns, "en")
      assert render("resource_hub_file_created", assigns, "fr") == {english_html, english_text}

      if count == 1 do
        assert html =~ "enviou o arquivo &quot;Launch &lt;script&gt;&quot;"
        assert text =~ ~s(enviou o arquivo "Launch <script>")
        assert html =~ assigns.file_url
        assert text =~ assigns.file_url
        assert html =~ "Ver arquivo"
      else
        assert html =~ "enviou #{count} arquivos"
        assert text =~ "enviou #{count} arquivos"
        assert english_text =~ "uploaded #{count} files"
        assert html =~ assigns.cta_url
        assert text =~ assigns.cta_url
        assert html =~ "Ver arquivos"
      end
    end
  end

  test "milestone comment, complete and reopen branches translate without translating action identifiers" do
    for {action, english, portuguese} <- [
          {"none", "commented on", "comentou no"},
          {"complete", "completed", "concluiu o"},
          {"reopen", "re-opened", "reabriu o"}
        ] do
      assigns = %{discussion_assigns("project_milestone_commented") | comment_action: action}
      assigns = if action == "none", do: assigns, else: %{assigns | content: nil}
      {html, text} = render("project_milestone_commented", assigns, "pt_BR")
      {english_html, english_text} = render("project_milestone_commented", assigns, "en")
      assert render("project_milestone_commented", assigns, "fr") == {english_html, english_text}
      assert html =~ portuguese
      assert text =~ portuguese
      assert english_text =~ english
      assert text =~ "Launch <script>"
      assert html =~ if(action == "none", do: "Ver comentário", else: "Ver marco")
      assert (html =~ "User-written update") == (action == "none")
    end
  end

  defp discussion_assigns(template) do
    assigns = assigns()
    resource = %{name: "Launch <script>", content: assigns.message, url: assigns.cta_url}

    assigns = Map.merge(assigns, %{
      title: resource.name,
      space: resource,
      document: resource,
      copied_document: nil,
      file: resource,
      files: [resource],
      file_url: assigns.cta_url,
      comment: %{content: assigns.message},
      content: assigns.message,
      comment_action: "none",
      comment_context: {:goal_closing, nil}
    })

    assigns = if template == "discussion_posting", do: %{assigns | message: %{body: assigns.message}}, else: assigns
    if template in ~w(resource_hub_link_created resource_hub_link_edited resource_hub_link_deleted), do: %{assigns | link: resource}, else: assigns
  end

  defp render(template, assigns, locale) do
    Gettext.with_locale(OperatelyWeb.Gettext, locale, fn ->
      {NotificationMailer.html(template, assigns), NotificationMailer.text(template, assigns)}
    end)
  end

  defp assigns do
    person = %{id: "author", full_name: "<Ana> Silva"}
    resource = %{name: "Launch <script>", title: "Launch <script>"}
    content = Operately.RichContent.Builder.doc([Operately.RichContent.Builder.paragraph([Operately.RichContent.Builder.text("User-written update")])])

    %{
      subject: "Notification",
      author: person,
      person: person,
      goal: resource,
      project: resource,
      milestone: resource,
      goal_name: resource.name,
      project_name: resource.name,
      milestone_name: resource.name,
      task_name: resource.name,
      name: resource.name,
      link: "https://example.com/resource?literal=1",
      cta_url: "https://example.com/resource?literal=1",
      cta_text: "CTA",
      role: "reviewer",
      author_role: "reviewer",
      responsibility: "User responsibility",
      message: content,
      overview: content,
      description: content,
      update: %{message: content},
      check_in: %{description: content},
      retrospective: %{content: content},
      success: "yes",
      checks: [],
      targets: [],
      new_milestones: [resource],
      new_parent_goal: resource,
      champion: person,
      reviewer: person,
      old_champion: person,
      new_champion: person,
      old_reviewer: person,
      new_reviewer: person,
      old_assignee: person,
      new_assignee: person,
      assigned_to_recipient: false,
      removed_from_recipient: false,
      mentioned: false,
      previous_date: "2026-01-01",
      new_date: "2026-02-01",
      due_date: "2026-02-01",
      old_timeframe: %{start_date: ~D[2026-01-01], end_date: ~D[2026-02-01]},
      new_timeframe: %{start_date: ~D[2026-02-01], end_date: ~D[2026-03-01]},
      duration_changed: true,
      old_duration: "1 week",
      new_duration: "2 weeks",
      destination_name: resource.name,
      content: %{
        old_name: "Old name",
        new_name: resource.name,
        old_timeframe: "Q1",
        new_timeframe: "Q2",
        old_champion_id: "old",
        new_champion_id: "new",
        old_reviewer_id: "old",
        new_reviewer_id: "new",
        added_targets: [],
        updated_targets: [],
        deleted_targets: []
      }
    }
  end
end
