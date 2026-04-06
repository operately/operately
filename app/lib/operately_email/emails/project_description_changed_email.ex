defmodule OperatelyEmail.Emails.ProjectDescriptionChangedEmail do
  import OperatelyEmail.Mailers.ActivityMailer

  alias Operately.{Projects, Repo}
  alias OperatelyWeb.Paths

  def send(person, activity) do
    %{author: author = %{company: company}} = Repo.preload(activity, author: :company)

    project = Projects.get_project!(activity.content["project_id"])

    action = get_action(person, activity, project)

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: project.name, who: author, action: action)
    |> assign(:author, author)
    |> assign(:project_name, project.name)
    |> assign(:description, description(activity))
    |> assign(:cta_url, Paths.project_path(company, project) |> Paths.to_url())
    |> render("project_description_changed")
  end

  defp get_action(person, activity, project) do
    mentioned_ids = Operately.RichContent.find_mentioned_ids(activity.content["description"], :decode_ids)

    if person.id in mentioned_ids do
      "mentioned you in the description for \"#{project.name}\""
    else
      "updated the description for \"#{project.name}\""
    end
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

  def buffered_item(_person, activity) do
    project = Operately.Projects.get_project!(activity.content["project_id"])
    content = decode_description(activity.content["description"])
    author = Operately.Repo.preload(activity, :author).author
    company = Operately.Repo.preload(author, :company).company

    excerpt_html =
      if is_map(content) do
        content
        |> OperatelyEmail.Templates.rich_text()
        |> Phoenix.HTML.safe_to_string()
      else
        nil
      end

    excerpt_text =
      if is_map(content) do
        content
        |> Operately.RichContent.rich_content_to_string()
        |> String.trim()
      else
        nil
      end

    excerpt_html = if excerpt_html in [nil, ""], do: nil, else: excerpt_html
    excerpt_text = if excerpt_text in [nil, ""], do: nil, else: excerpt_text

    %{
      parent_id: project.id,
      parent_type: :project,
      parent_name: project.name,
      headline: "updated this project description",
      excerpt_html: excerpt_html,
      excerpt_text: excerpt_text,
      item_url: OperatelyWeb.Paths.project_path(company, project) |> OperatelyWeb.Paths.to_url(),
      actor_name: Operately.People.Person.short_name(author),
      occurred_at: activity.inserted_at,
      coalesce_key: nil
    }
  end
end
