defmodule OperatelyEmail.Emails.TaskDescriptionChangeEmail do
  import OperatelyEmail.Mailers.ActivityMailer

  alias Operately.Repo
  alias OperatelyWeb.Paths
  alias Operately.Tasks.Task

  def send(person, activity) do
    %{author: author = %{company: company}} = Repo.preload(activity, author: :company)

    {:ok, task} =
      Task.get(:system, id: activity.content["task_id"], opts: [preload: [:project]])

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: task.project.name, who: author, action: "updated the description for \"#{task.name}\"")
    |> assign(:author, author)
    |> assign(:task_name, task.name)
    |> assign(:description, decode_description(activity.content["description"]))
    |> assign(:cta_url, Paths.project_task_path(company, task) |> Paths.to_url())
    |> render("task_description_change")
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
