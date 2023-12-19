defmodule OperatelyEmail.ProjectArchivedEmail do
  alias OperatelyEmail.ActivityEmail
  alias Operately.{Repo, Projects}

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    project = Projects.get_project!(activity.content["project_id"])
    company = Repo.preload(project, :company).company

    company
    |> ActivityEmail.new()
    |> ActivityEmail.to(person)
    |> ActivityEmail.subject(who: author, action: "archived the #{project.name} project")
    |> ActivityEmail.assign(:author, author)
    |> ActivityEmail.assign(:project, project)
    |> ActivityEmail.deliver(OperatelyEmail.Views.ProjectArchived)
  end
end
