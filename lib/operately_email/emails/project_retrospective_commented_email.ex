defmodule OperatelyEmail.Emails.ProjectRetrospectiveCommentedEmail do
  import OperatelyEmail.Mailers.ActivityMailer

  alias Operately.{Repo, Updates}
  alias Operately.Projects.Project
  alias OperatelyWeb.Paths

  def send(person, activity) do
    %{author: author} = Repo.preload(activity, [:author])
    {:ok, project = %{group: space, company: company}} = Project.get(:system, id: activity.content["project_id"], opts: [
      preload: [:group, :company]
    ])
    comment = Updates.get_comment!(activity.content["comment_id"])
    action = "commented on the project retrospective"

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: space.name, who: author, action: action)
    |> assign(:author, author)
    |> assign(:project, project)
    |> assign(:comment, comment)
    |> assign(:cta_text, "View Retrospective")
    |> assign(:cta_url, Paths.project_retrospective_path(company, project) |> Paths.to_url())
    |> render("project_retrospective_commented")
  end
end
