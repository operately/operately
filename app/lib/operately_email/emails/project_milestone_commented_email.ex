defmodule OperatelyEmail.Emails.ProjectMilestoneCommentedEmail do
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
    |> subject(where: project.name, who: author, action: action_text(milestone, action))
    |> assign(:author, author)
    |> assign(:project, project)
    |> assign(:content, comment.content)
    |> assign(:milestone, milestone)
    |> assign(:action_text, action_text(milestone, action))
    |> assign(:button_text, button_text(action))
    |> assign(:link, link)
    |> render("project_milestone_commented")
  end

  def action_text(milestone, action) do
    case action do
      "none" -> "commented on the #{milestone.title} milestone"
      "complete" -> "completed the #{milestone.title} milestone"
      "reopen" -> "re-opened the #{milestone.title} milestone"
      _ -> raise "Unknown action: #{action}"
    end
  end

  def button_text(action) do
    case action do
      "none" -> "View Comment"
      _ -> "View Milestone"
    end
  end

  def headline_text(milestone, action) do
    case action do
      "none" -> "commented on the milestone \"#{milestone.title}\""
      "complete" -> "completed the milestone \"#{milestone.title}\""
      "reopen" -> "re-opened the milestone \"#{milestone.title}\""
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

    {excerpt_html, excerpt_text} = if action == "none" do
      %{html: html, text: text} = OperatelyEmail.RichTextExcerpt.excerpt(content)
      {html, text}
    else
      {nil, nil}
    end

    %{
      parent_id: parent.id,
      parent_type: parent.type,
      parent_name: parent.name,
      headline: headline_text(milestone, action),
      excerpt_html: excerpt_html,
      excerpt_text: excerpt_text,
      item_url: OperatelyWeb.Paths.project_milestone_path(company, milestone) |> OperatelyWeb.Paths.to_url(),
      actor_name: Operately.People.Person.short_name(author),
      occurred_at: activity.inserted_at,
      coalesce_key: nil
    }
  end
end
