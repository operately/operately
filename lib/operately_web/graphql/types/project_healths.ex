defmodule OperatelyWeb.Graphql.Types.ProjectHealths do
  use Absinthe.Schema.Notation

  object :project_health do
    field :status, non_null(:string) do
      resolve fn health, _, _ ->
        {:ok, health["status"]}
      end
    end

    field :schedule, non_null(:string) do
      resolve fn health, _, _ ->
        {:ok, health["schedule"]["value"]}
      end
    end

    field :schedule_comments, non_null(:string) do
      resolve fn health, _, _ ->
        {:ok, health["schedule"]["comments"]}
      end
    end

    field :budget, non_null(:string) do
      resolve fn health, _, _ ->
        {:ok, health["budget"]["value"]}
      end
    end

    field :budget_comments, non_null(:string) do
      resolve fn health, _, _ ->
        {:ok, health["budget"]["comments"]}
      end
    end

    field :team, non_null(:string) do
      resolve fn health, _, _ ->
        {:ok, health["team"]["value"]}
      end
    end

    field :team_comments, non_null(:string) do
      resolve fn health, _, _ ->
        {:ok, health["team"]["comments"]}
      end
    end

    field :risks, non_null(:string) do
      resolve fn health, _, _ ->
      IO.inspect(health)
        {:ok, health["risks"] && health["risks"]["value"] || "no_known_risks"}
      end
    end

    field :risks_comments, non_null(:string) do
      resolve fn health, _, _ ->
        {:ok, health["risks"] && health["risks"]["comments"] || ""}
      end
    end
  end
end
