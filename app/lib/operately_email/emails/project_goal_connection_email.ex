defmodule OperatelyEmail.Emails.ProjectGoalConnectionEmail do
  use Gettext, backend: OperatelyWeb.Gettext
  import OperatelyEmail.Mailers.ActivityMailer

  alias Operately.Repo
  alias Operately.Projects
  alias Operately.Goals.Goal

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    project = Projects.get_project!(activity.content["project_id"])
    goal = visible_goal(person, activity.content["goal_id"])
    company = Repo.preload(project, :company).company
    link = OperatelyWeb.Paths.project_path(company, project) |> OperatelyWeb.Paths.to_url()

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(email_subject(project, author, goal))
    |> assign(:author, author)
    |> assign(:project, project)
    |> assign(:goal, goal)
    |> assign(:link, link)
    |> render("project_goal_connection")
  end

  def buffered_item(person, activity) do
    project = Operately.Projects.get_project!(activity.content["project_id"])
    goal = visible_goal(person, activity.content["goal_id"])
    author = Operately.Repo.preload(activity, :author).author
    company = Operately.Repo.preload(author, :company).company

    %{
      parent_id: project.id,
      parent_type: :project,
      parent_name: project.name,
      headline: buffered_headline(project, goal),
      excerpt_html: nil,
      excerpt_text: nil,
      item_url: OperatelyWeb.Paths.project_path(company, project) |> OperatelyWeb.Paths.to_url(),
      actor_name: Operately.People.Person.short_name(author),
      occurred_at: activity.inserted_at,
      coalesce_key: nil
    }
  end

  defp visible_goal(_, nil), do: nil

  defp visible_goal(person, id) do
    case Goal.get(person, id: id, company_id: person.company_id) do
      {:ok, goal} -> goal
      {:error, _} -> nil
    end
  end

  defp email_subject(project, _, nil), do: gettext("Updated the parent goal of %{projectName} project", projectName: project.name)

  defp email_subject(project, author, goal) do
    gettext("(%{project_name}) %{author} connected the project to the %{goal_name} goal",
      project_name: project.name,
      author: Operately.People.Person.short_name(author),
      goal_name: goal.name
    )
  end

  defp buffered_headline(project, nil), do: gettext("Updated the parent goal of %{projectName} project", projectName: project.name)
  defp buffered_headline(_, goal), do: gettext("connected the project to the goal \"%{goal_name}\"", goal_name: goal.name)
end
