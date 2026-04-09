defmodule Operately.CompanyTransfers.Schema.TopologicalSort do
  @moduledoc """
  Topological ordering of tables to satisfy foreign key constraints.

  Orders tables for import using depth-first search, with intelligent cycle breaking
  for schemas with circular dependencies.

  ## Features

  - Detects and breaks circular dependencies (e.g., `companies` ↔ `groups`)
  - Excludes self-referencing FKs from ordering
  - Provides cycle detection for validation

  ## Key Functions

  - `sort/1` - Returns tables in dependency order
  - `validate_acyclic/1` - Check for cycles (returns ok with cycle info)
  - `detect_cycles/1` - Get list of tables involved in cycles

  ## Cycle Handling

  The schema has legitimate cycles (e.g., `companies.company_space_id` → `groups`,
  `groups.company_id` → `companies`). The sort algorithm breaks cycles by skipping
  back-edges during traversal, producing a valid import order.

  Import logic must handle nullable FKs specially:
  1. Insert parent with NULL for cyclic FK
  2. Insert child
  3. Update parent to set cyclic FK

  ## Why Break Cycles Instead of Failing?

  Rather than failing on cycles, the algorithm breaks them intelligently because:
  - Real schemas have legitimate cycles (companies ↔ groups)
  - Nullable FKs can be handled with two-phase insertion
  - Export doesn't need ordering (can dump in any order)
  - Import can use the ordering with special handling for cyclic edges
  """

  def sort(dependency_graph) when is_map(dependency_graph) do
    all_tables = Map.keys(dependency_graph) |> MapSet.new()

    referenced_tables =
      dependency_graph
      |> Map.values()
      |> List.flatten()
      |> MapSet.new()

    all_nodes = MapSet.union(all_tables, referenced_tables)

    graph =
      Enum.reduce(all_nodes, dependency_graph, fn node, acc ->
        Map.put_new(acc, node, [])
      end)

    case topological_sort_dfs(graph) do
      {:ok, sorted} ->
        {:ok, sorted}

      {:error, {:cycle_detected, _node}} ->
        sort_with_cycle_breaking(graph)
    end
  end

  defp sort_with_cycle_breaking(graph) do
    visited = MapSet.new()
    result = []
    nodes = Map.keys(graph)

    {final_result, _visited} =
      Enum.reduce(nodes, {result, visited}, fn node, {acc_result, acc_visited} ->
        if MapSet.member?(acc_visited, node) do
          {acc_result, acc_visited}
        else
          visit_with_cycle_breaking(node, graph, acc_visited, MapSet.new(), acc_result)
        end
      end)

    {:ok, Enum.reverse(final_result)}
  end

  defp visit_with_cycle_breaking(node, graph, visited, temp_mark, result) do
    cond do
      MapSet.member?(temp_mark, node) ->
        {result, visited}

      MapSet.member?(visited, node) ->
        {result, visited}

      true ->
        temp_mark = MapSet.put(temp_mark, node)
        dependencies = Map.get(graph, node, [])

        {new_result, new_visited} =
          Enum.reduce(dependencies, {result, visited}, fn dep, {acc_result, acc_visited} ->
            visit_with_cycle_breaking(dep, graph, acc_visited, temp_mark, acc_result)
          end)

        new_visited = MapSet.put(new_visited, node)
        new_result = [node | new_result]
        {new_result, new_visited}
    end
  end

  defp topological_sort_dfs(graph) do
    visited = MapSet.new()
    temp_mark = MapSet.new()
    result = []

    nodes = Map.keys(graph)

    case visit_all_nodes(nodes, graph, visited, temp_mark, result) do
      {:ok, sorted} -> {:ok, Enum.reverse(sorted)}
      {:error, reason} -> {:error, reason}
    end
  end

  defp visit_all_nodes([], _graph, _visited, _temp_mark, result) do
    {:ok, result}
  end

  defp visit_all_nodes([node | rest], graph, visited, temp_mark, result) do
    cond do
      MapSet.member?(visited, node) ->
        visit_all_nodes(rest, graph, visited, temp_mark, result)

      true ->
        case visit_node(node, graph, visited, temp_mark, result) do
          {:ok, new_visited, new_result} ->
            visit_all_nodes(rest, graph, new_visited, temp_mark, new_result)

          {:error, reason} ->
            {:error, reason}
        end
    end
  end

  defp visit_node(node, graph, visited, temp_mark, result) do
    cond do
      MapSet.member?(temp_mark, node) ->
        {:error, {:cycle_detected, node}}

      MapSet.member?(visited, node) ->
        {:ok, visited, result}

      true ->
        temp_mark = MapSet.put(temp_mark, node)
        dependencies = Map.get(graph, node, [])

        case visit_dependencies(dependencies, graph, visited, temp_mark, result) do
          {:ok, new_visited, new_result} ->
            new_visited = MapSet.put(new_visited, node)
            new_result = [node | new_result]
            {:ok, new_visited, new_result}

          {:error, reason} ->
            {:error, reason}
        end
    end
  end

  defp visit_dependencies([], _graph, visited, _temp_mark, result) do
    {:ok, visited, result}
  end

  defp visit_dependencies([dep | rest], graph, visited, temp_mark, result) do
    case visit_node(dep, graph, visited, temp_mark, result) do
      {:ok, new_visited, new_result} ->
        visit_dependencies(rest, graph, new_visited, temp_mark, new_result)

      {:error, reason} ->
        {:error, reason}
    end
  end

  def validate_acyclic(dependency_graph) when is_map(dependency_graph) do
    all_tables = Map.keys(dependency_graph) |> MapSet.new()

    referenced_tables =
      dependency_graph
      |> Map.values()
      |> List.flatten()
      |> MapSet.new()

    all_nodes = MapSet.union(all_tables, referenced_tables)

    graph =
      Enum.reduce(all_nodes, dependency_graph, fn node, acc ->
        Map.put_new(acc, node, [])
      end)

    case topological_sort_dfs(graph) do
      {:ok, _sorted} ->
        {:ok, :no_cycles}

      {:error, {:cycle_detected, node}} ->
        {:ok, {:has_cycles, node}}
    end
  end

  def detect_cycles(dependency_graph) when is_map(dependency_graph) do
    all_tables = Map.keys(dependency_graph) |> MapSet.new()

    referenced_tables =
      dependency_graph
      |> Map.values()
      |> List.flatten()
      |> MapSet.new()

    all_nodes = MapSet.union(all_tables, referenced_tables)

    graph =
      Enum.reduce(all_nodes, dependency_graph, fn node, acc ->
        Map.put_new(acc, node, [])
      end)

    case topological_sort_dfs(graph) do
      {:ok, _sorted} ->
        {:ok, []}

      {:error, {:cycle_detected, node}} ->
        {:ok, [node]}
    end
  end
end
