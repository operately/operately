defmodule OperatelyWeb.Graphql.Types.ActivityContentProjectTimelineEdited do
  use Absinthe.Schema.Notation

  object :activity_content_project_timeline_edited do
    field :project, non_null(:project) do
      resolve fn activity, _, _ ->
        project_id = activity.content["project_id"]

        project = Operately.Projects.get_project!(project_id)

        {:ok, project}
      end
    end

    field :old_start_date, :date do
      resolve fn activity, _, _ ->
        {:ok, as_date(activity.content["old_start_date"])}
      end
    end

    field :new_start_date, :date do
      resolve fn activity, _, _ ->
        {:ok, as_date(activity.content["new_start_date"])}
      end
    end

    field :old_end_date, :date do
      resolve fn activity, _, _ ->
        {:ok, as_date(activity.content["old_end_date"])}
      end
    end

    field :new_end_date, :date do
      resolve fn activity, _, _ ->
        {:ok, as_date(activity.content["new_end_date"])}
      end
    end

    field :new_milestones, list_of(:milestone) do
      resolve fn activity, _, _ ->
        new_milestone_ids = activity.content["new_milestones"] |> Enum.map(& &1["milestone_id"])
        {:ok, Operately.Projects.get_milestones(new_milestone_ids)}
      end
    end

    field :updated_milestones, list_of(:milestone) do
      resolve fn activity, _, _ ->
        milestone_ids = activity.content["milestone_updates"] |> Enum.map(& &1["milestone_id"])
        {:ok, Operately.Projects.get_milestones(milestone_ids)}
      end
    end
  end

  defp as_date(nil), do: nil
  defp as_date(%DateTime{} = date), do: date
  defp as_date(date) when is_binary(date), do: NaiveDateTime.from_iso8601!(date)
end
