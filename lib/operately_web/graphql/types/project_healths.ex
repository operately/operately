defmodule OperatelyWeb.Graphql.Types.ProjectHealths do
  use Absinthe.Schema.Notation

  object :project_health do
    field :status, non_null(:string) do
      resolve get_health_value("status", "on_track")
    end

    field :status_comments, non_null(:string) do
      resolve get_health_comments("status")
    end

    field :schedule, non_null(:string) do
      resolve get_health_value("schedule", "on_schedule")
    end

    field :schedule_comments, non_null(:string) do
      resolve get_health_comments("schedule")
    end

    field :budget, non_null(:string) do
      resolve get_health_value("budget", "within_budget")
    end

    field :budget_comments, non_null(:string) do
      resolve get_health_comments("budget")
    end

    field :team, non_null(:string) do
      resolve get_health_value("team", "staffed")
    end

    field :team_comments, non_null(:string) do
      resolve get_health_comments("team")
    end

    field :risks, non_null(:string) do
      resolve get_health_value("risks", "no_known_risks")
    end

    field :risks_comments, non_null(:string) do
      resolve get_health_comments("risks")
    end
  end

  defp get_health_value(key, default) do
    fn health, _args, _resolution ->
      case health[key] do
        nil -> {:ok, default}
        %{"value" => value} -> {:ok, value}
        "unknown" -> {:ok, default}
        _value -> {:ok, default}
      end
    end
  end

  defp get_health_comments(key) do
    fn health, _args, _resolution ->
      case health[key] do
        nil -> {:ok, "{}"}
        %{"comments" => comments} -> {:ok, comments}
        _value -> {:ok, "{}"}
      end
    end
  end
end
