defmodule Operately.ProjectTemplates.Graph.Copy do
  @moduledoc """
  Pure transformations shared by project-template graph copy operations.

  This module validates and copies workflow metadata, remaps ordered resource
  paths, and converts between concrete dates and template-relative offsets. It
  does not load or persist records; operation modules own those side effects.
  """

  alias Operately.Tasks.{Reminder, Status}
  alias OperatelyWeb.Api.Helpers

  @doc """
  Validates and copies workflow statuses with fresh IDs.

  The returned workflow contains the source statuses, copied statuses, a lookup
  from source ID to copied status, and the copied first open status.
  """
  def copy_workflow(statuses) when is_list(statuses) do
    with :ok <- validate_workflow(statuses),
         first_open when not is_nil(first_open) <- first_open_status(statuses) do
      copied_by_source_id = Map.new(statuses, &{&1.id, copy_status(&1)})

      {:ok,
       %{
         source: statuses,
         copied: Enum.map(statuses, &Map.fetch!(copied_by_source_id, &1.id)),
         copied_by_source_id: copied_by_source_id,
         first_open: Map.fetch!(copied_by_source_id, first_open.id)
       }}
    else
      nil -> {:error, :no_open_task_status}
      error -> error
    end
  end

  def copy_workflow(_statuses), do: {:error, :empty_workflow}

  @doc """
  Replaces source paths in an ordering state with their target paths.

  Existing order is preserved. Resources omitted from the stored ordering are
  appended in the order supplied by `resources`.
  """
  def map_ordering(ordering, resources, source_path, target_path) when is_list(ordering) do
    if Enum.all?(ordering, &is_binary/1) do
      source_paths = Enum.map(resources, source_path)
      source_paths_by_id = Map.new(source_paths, &{path_id(&1), &1})
      ordered_ids = Enum.map(ordering, &path_id/1)

      cond do
        Enum.uniq(ordered_ids) != ordered_ids ->
          {:error, :duplicate_ordering_id}

        not Enum.all?(ordered_ids, &Map.has_key?(source_paths_by_id, &1)) ->
          {:error, :foreign_ordering_id}

        true ->
          complete_ids = ordered_ids ++ (Enum.map(source_paths, &path_id/1) -- ordered_ids)
          targets_by_source_id = Map.new(resources, &{path_id(source_path.(&1)), target_path.(&1)})
          {:ok, Enum.map(complete_ids, &Map.fetch!(targets_by_source_id, &1))}
      end
    else
      {:error, :malformed_ordering_state}
    end
  end

  def map_ordering(_ordering, _resources, _source_path, _target_path), do: {:error, :malformed_ordering_state}

  @doc "Converts a template-relative day offset into a concrete date."
  def date_from_offset(_start_date, nil), do: nil
  def date_from_offset(%Date{} = start_date, offset) when is_integer(offset), do: Date.add(start_date, offset)

  @doc "Converts a concrete date into a day offset relative to the start date."
  def offset_from_date(_start_date, nil), do: nil
  def offset_from_date(%Date{} = start_date, %Date{} = date), do: Date.diff(date, start_date)

  @doc "Keeps only reminders that remain meaningful with a relative due date."
  def due_relative_reminders(reminders) when is_list(reminders), do: Enum.filter(reminders, &Reminder.due_relative?/1)
  def due_relative_reminders(_reminders), do: []

  @doc "Returns the persisted attributes for a copied workflow status."
  def status_attrs(status) do
    %{
      id: status.id,
      label: status.label,
      color: status.color,
      index: status.index,
      value: status.value,
      closed: status.closed
    }
  end

  @doc "Returns the key used for a status in persisted Kanban state."
  def status_key(status), do: status.value || status.id

  @doc "Validates that statuses form a usable workflow with unique IDs and keys."
  def validate_workflow([]), do: {:error, :empty_workflow}

  def validate_workflow(statuses) when is_list(statuses) do
    if Enum.all?(statuses, &match?(%Status{}, &1)) do
      changesets = Enum.map(statuses, &Status.changeset(&1, %{}))
      ids = Enum.map(statuses, & &1.id)
      keys = Enum.map(statuses, &status_key/1)

      cond do
        Enum.any?(changesets, &(not &1.valid?)) -> {:error, :invalid_task_status}
        Enum.uniq(ids) != ids -> {:error, :duplicate_task_status}
        Enum.any?(keys, &is_nil/1) or Enum.uniq(keys) != keys -> {:error, :duplicate_task_status_key}
        Enum.all?(statuses, & &1.closed) -> {:error, :no_open_task_status}
        true -> :ok
      end
    else
      {:error, :invalid_task_status}
    end
  end

  def validate_workflow(_statuses), do: {:error, :empty_workflow}

  defp first_open_status(statuses) do
    # Preserve input order when two statuses have the same workflow index.
    statuses
    |> Enum.with_index()
    |> Enum.sort_by(fn {status, position} -> {status.index, position} end)
    |> Enum.find_value(fn {status, _position} -> if status.closed, do: nil, else: status end)
  end

  defp copy_status(status) do
    %Status{
      id: Ecto.UUID.generate(),
      label: status.label,
      color: status.color,
      index: status.index,
      value: status.value,
      closed: status.closed
    }
  end

  defp path_id(path), do: Helpers.id_without_comments(path)
end
