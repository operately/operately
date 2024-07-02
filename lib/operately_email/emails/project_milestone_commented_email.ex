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
    link = OperatelyWeb.Paths.project_milestone_path(company, project, milestone) |> OperatelyWeb.Paths.to_url()

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

end
