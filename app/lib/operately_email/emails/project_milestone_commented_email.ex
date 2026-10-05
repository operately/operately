defmodule OperatelyEmail.Emails.ProjectMilestoneCommentedEmail do
  use Gettext, backend: OperatelyWeb.Gettext
  import OperatelyEmail.Mailers.ActivityMailer
  alias Operately.{Repo, Projects, Updates}

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    company = Repo.preload(author, :company).company
    project = Projects.get_project!(activity.content["project_id"])
    milestone = Projects.get_milestone!(activity.content["milestone_id"])
    comment = Updates.get_comment!(activity.content["comment_id"])
    action = activity.content["comment_action"]
    link = OperatelyWeb.Paths.project_milestone_path(company, milestone, comment) |> OperatelyWeb.Paths.to_url()

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(subject_text(author, project, milestone, action))
    |> assign(:author, author)
    |> assign(:project, project)
    |> assign(:content, comment_content(action, comment.content))
    |> assign(:milestone, milestone)
    |> assign(:comment_action, action)
    |> assign(:link, link)
    |> render("project_milestone_commented")
  end

  defp comment_content("none", %{} = content) when map_size(content) > 0, do: content
  defp comment_content(_, _), do: nil

  def subject_text(author, project, milestone, action) do
    case action do
      "none" ->
        gettext("(%{project_name}) %{author} commented on the %{milestone_name} milestone",
          project_name: project.name,
          author: Operately.People.Person.short_name(author),
          milestone_name: milestone.title
        )

      "complete" ->
        gettext("(%{project_name}) %{author} completed the %{milestone_name} milestone",
          project_name: project.name,
          author: Operately.People.Person.short_name(author),
          milestone_name: milestone.title
        )

      "reopen" ->
        gettext("(%{project_name}) %{author} re-opened the %{milestone_name} milestone",
          project_name: project.name,
          author: Operately.People.Person.short_name(author),
          milestone_name: milestone.title
        )

      _ ->
        raise "Unknown action: #{action}"
    end
  end

  def heading(author, milestone, action) do
    case action do
      "none" ->
        gettext("%{author} commented on the %{milestone_name} milestone", author: Operately.People.Person.short_name(author), milestone_name: milestone.title)

      "complete" ->
        gettext("%{author} completed the %{milestone_name} milestone", author: Operately.People.Person.short_name(author), milestone_name: milestone.title)

      "reopen" ->
        gettext("%{author} re-opened the %{milestone_name} milestone", author: Operately.People.Person.short_name(author), milestone_name: milestone.title)

      _ ->
        raise "Unknown action: #{action}"
    end
  end

  def button_text(action) do
    case action do
      "none" ->
        gettext("View Comment")
      _ ->
        gettext("View Milestone")
    end
  end

  def headline_text(milestone, action) do
    case action do
      "none" -> gettext("commented on the milestone \"%{milestone_title}\"", milestone_title: milestone.title)
      "complete" -> gettext("completed the milestone \"%{milestone_title}\"", milestone_title: milestone.title)
      "reopen" -> gettext("re-opened the milestone \"%{milestone_title}\"", milestone_title: milestone.title)
      _ -> raise "Unknown action: #{action}"
    end
  end

  def buffered_item(_person, activity) do
    milestone = Operately.Projects.get_milestone!(activity.content["milestone_id"])
    comment = Operately.Updates.get_comment!(activity.content["comment_id"])
    content = comment.content
    action = activity.content["comment_action"]
    author = Operately.Repo.preload(activity, :author).author
    company = Operately.Repo.preload(author, :company).company
    parent = OperatelyEmail.DigestParent.for_milestone(milestone)

    {excerpt_html, excerpt_text} =
      if action == "none" do
        %{html: html, text: text} = OperatelyEmail.RichTextExcerpt.excerpt(content)
        {html, text}
      else
        {nil, nil}
      end

    item_url =
      if action == "none" do
        OperatelyWeb.Paths.project_milestone_path(company, milestone, comment)
      else
        OperatelyWeb.Paths.project_milestone_path(company, milestone)
      end

    %{
      parent_id: parent.id,
      parent_type: parent.type,
      parent_name: parent.name,
      headline: headline_text(milestone, action),
      excerpt_html: excerpt_html,
      excerpt_text: excerpt_text,
      item_url: item_url |> OperatelyWeb.Paths.to_url(),
      actor_name: Operately.People.Person.short_name(author),
      occurred_at: activity.inserted_at,
      coalesce_key: nil
    }
  end
end
