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
    |> assign(:content, comment.content["message"])
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

  def buffered_item(_person, activity) do
    milestone = Operately.Projects.get_milestone!(activity.content["milestone_id"])
    comment = Operately.Updates.get_comment!(activity.content["comment_id"])
    content = comment.content["message"]
    author = Operately.Repo.preload(activity, :author).author
    company = Operately.Repo.preload(author, :company).company

    excerpt_html =
      if is_map(content) do
        OperatelyEmail.Templates.rich_text(content) |> Phoenix.HTML.safe_to_string()
      else
        nil
      end

    excerpt_text =
      if is_map(content) do
        Operately.RichContent.rich_content_to_string(content)
        |> String.trim()
      else
        nil
      end

    excerpt_html = if excerpt_html in [nil, ""], do: nil, else: excerpt_html
    excerpt_text = if excerpt_text in [nil, ""], do: nil, else: excerpt_text

    %{
      parent_id: milestone.id,
      parent_type: :milestone,
      parent_name: milestone.title,
      headline: "commented on this milestone",
      excerpt_html: excerpt_html,
      excerpt_text: excerpt_text,
      item_url: OperatelyWeb.Paths.project_milestone_path(company, milestone) |> OperatelyWeb.Paths.to_url(),
      actor_name: Operately.People.Person.short_name(author),
      occurred_at: activity.inserted_at,
      coalesce_key: nil
    }
  end
end
