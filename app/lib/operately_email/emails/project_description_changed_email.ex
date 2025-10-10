defmodule OperatelyEmail.Emails.ProjectDescriptionChangedEmail do
  import OperatelyEmail.Mailers.ActivityMailer

  alias Operately.{Projects, Repo}
  alias OperatelyWeb.Paths

  def send(person, activity) do
    %{author: author = %{company: company}} = Repo.preload(activity, author: :company)

    project = Projects.get_project!(activity.content["project_id"])

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: project.name, who: author, action: "updated the project description")
    |> assign(:author, author)
    |> assign(:project_name, project.name)
    |> assign(:description, description(activity))
    |> assign(:cta_url, Paths.project_path(company, project) |> Paths.to_url())
    |> render("project_description_changed")
  end

  defp description(activity) do
    activity.content["description"]
    |> decode_description()
    |> case do
      nil -> decode_description(get_in(activity.content, ["project", "description"]))
      value -> value
    end
  end

  defp decode_description(nil), do: nil

  defp decode_description(description) when is_binary(description) do
    case Jason.decode(description) do
      {:ok, decoded} -> decoded
      _ -> nil
    end
  end

  defp decode_description(description) when is_map(description), do: description
  defp decode_description(_), do: nil
end
