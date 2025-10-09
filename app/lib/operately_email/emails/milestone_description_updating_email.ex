defmodule OperatelyEmail.Emails.MilestoneDescriptionUpdatingEmail do
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

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(
      where: milestone.project.name,
      who: author,
      action: "updated the description for \"#{milestone.title}\""
    )
    |> assign(:author, author)
    |> assign(:milestone_name, milestone.title)
    |> assign(:description, decode_description(activity.content["description"]))
    |> assign(:cta_url, Paths.project_milestone_path(company, milestone) |> Paths.to_url())
    |> render("milestone_description_updating")
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
