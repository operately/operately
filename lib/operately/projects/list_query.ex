defmodule Operately.Projects.ListQuery do
  import Ecto.Query, warn: false

  alias Operately.Projects.Project

  def build(filters) do
    query = from p in Project

    query = apply_group_filter(query, filters[:group_id])
    query = apply_objective_filter(query, filters[:objective_id])

    query
  end

  #
  # Filter by group if the filter is present
  #
  defp apply_group_filter(query, nil) do
    query
  end

  defp apply_group_filter(query, group_id) do
    from p in query, where: p.group_id == ^group_id
  end

  #
  # Filter by objective if the filter is present
  #
  defp apply_objective_filter(query, nil) do
    query
  end

  defp apply_objective_filter(query, objective_id) do
    from p in query, where: p.objective_id == ^objective_id
  end

end
