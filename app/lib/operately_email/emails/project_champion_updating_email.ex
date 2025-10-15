defmodule OperatelyEmail.Emails.ProjectChampionUpdatingEmail do
  import OperatelyEmail.Mailers.ActivityMailer

  alias Operately.Repo
  alias Operately.Projects.Project
  alias Operately.People.Person
  alias OperatelyWeb.Paths

  def send(person, activity) do
    %{author: author = %{company: company}} = Repo.preload(activity, author: :company)

    project = Project.get!(:system, id: activity.content["project_id"])
    champion = get_champion(activity.content["new_champion_id"])

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: project.name, who: author, action: get_action(person, champion))
    |> assign(:author, author)
    |> assign(:project, project)
    |> assign(:champion, champion)
    |> assign(:cta_url, Paths.project_path(company, project) |> Paths.to_url())
    |> render("project_champion_updating")
  end

  defp get_champion(nil), do: nil
  defp get_champion(id), do: Person.get!(:system, id: id)

  defp get_action(_person, nil), do: "removed the champion"
  defp get_action(person, champion) do
    if person.id == champion.id do
      "assigned you as the champion"
    else
      "assigned #{Person.short_name(champion)} as the champion"
    end
  end
end
