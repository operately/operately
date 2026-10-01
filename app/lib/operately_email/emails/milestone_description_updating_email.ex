defmodule OperatelyEmail.Emails.MilestoneDescriptionUpdatingEmail do
  use Gettext, backend: OperatelyWeb.Gettext
  import OperatelyEmail.Mailers.ActivityMailer

  alias Operately.Repo
  alias OperatelyWeb.Paths
  alias Operately.Projects.Milestone

  def send(person, activity) do
    %{author: author = %{company: company}} = Repo.preload(activity, author: :company)

    {:ok, milestone} =
      Milestone.get(:system,
        id: activity.content["milestone_id"],
        opts: [preload: [:project]]
      )

    subject_text = subject_text(milestone.project.name, author, person, activity, milestone)

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(subject_text)
    |> assign(:author, author)
    |> assign(:milestone_name, milestone.title)
    |> assign(:description, decode_description(activity.content["description"]))
    |> assign(:cta_url, Paths.project_milestone_path(company, milestone) |> Paths.to_url())
    |> render("milestone_description_updating")
  end

  defp subject_text(where, author, person, activity, milestone) do
    mentioned_ids = Operately.RichContent.find_mentioned_ids(activity.content["description"], :decode_ids)

    if person.id in mentioned_ids do
      gettext("(%{where}) %{author} mentioned you in the description for \"%{milestone_title}\"", where: where, author: Operately.People.Person.short_name(author), milestone_title: milestone.title)
    else
      gettext("(%{where}) %{author} updated the description for \"%{milestone_title}\"", where: where, author: Operately.People.Person.short_name(author), milestone_title: milestone.title)
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
    milestone = Operately.Projects.get_milestone!(activity.content["milestone_id"])
    content = decode_description(activity.content["description"])
    author = Operately.Repo.preload(activity, :author).author
    company = Operately.Repo.preload(author, :company).company
    parent = OperatelyEmail.DigestParent.for_milestone(milestone)
    %{html: excerpt_html, text: excerpt_text} = OperatelyEmail.RichTextExcerpt.excerpt(content)

    %{
      parent_id: parent.id,
      parent_type: parent.type,
      parent_name: parent.name,
      headline: "updated the description of the milestone \"#{milestone.title}\"",
      excerpt_html: excerpt_html,
      excerpt_text: excerpt_text,
      item_url: OperatelyWeb.Paths.project_milestone_path(company, milestone) |> OperatelyWeb.Paths.to_url(),
      actor_name: Operately.People.Person.short_name(author),
      occurred_at: activity.inserted_at,
      coalesce_key: nil
    }
  end
end
