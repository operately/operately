defmodule Operately.Search.Sources.ResourceHub.Record do
  @moduledoc """
  Holds a resource-hub resource and the related metadata needed to index it.

  Resource-hub source adapters load this struct with the resource's node,
  ownership, access context, and folder information. `build/4` then converts
  an eligible record into search-entry attributes, skips hidden or deleted
  records, and rejects records that are missing required metadata.
  """

  defstruct [
    :id,
    :resource,
    :parent,
    :node,
    :company_id,
    :access_context_id,
    :resource_hub_id,
    :space_id,
    :project_id,
    :goal_id,
    :scope_updated_at,
    :owning_parent_deleted?,
    :hidden_by_deleted_folder?
  ]

  def build(%__MODULE__{} = record, title, body, body_kind) do
    cond do
      excluded?(record) ->
        :skip

      missing_metadata?(record) ->
        {:error, {:invalid, :missing_search_metadata}}

      not is_binary(title) or String.trim(title) == "" ->
        {:error, {:invalid, :missing_title}}

      true ->
        {:ok,
         %{
           company_id: record.company_id,
           access_context_id: record.access_context_id,
           resource_hub_id: record.resource_hub_id,
           space_id: record.space_id,
           project_id: record.project_id,
           goal_id: record.goal_id,
           title: title,
           body: body || "",
           body_kind: body_kind,
           source_inserted_at: record.resource.inserted_at,
           source_updated_at: latest_timestamp([record.resource.updated_at, record.node.updated_at, record.scope_updated_at])
         }}
    end
  end

  def excluded?(%__MODULE__{node: nil}), do: true
  def excluded?(%__MODULE__{node: %{deleted_at: deleted_at}}) when not is_nil(deleted_at), do: true
  def excluded?(%__MODULE__{owning_parent_deleted?: true}), do: true
  def excluded?(%__MODULE__{hidden_by_deleted_folder?: true}), do: true
  def excluded?(%__MODULE__{}), do: false

  def latest_timestamp(timestamps) do
    timestamps
    |> Enum.reject(&is_nil/1)
    |> Enum.reduce(fn timestamp, latest ->
      if NaiveDateTime.compare(timestamp, latest) == :gt, do: timestamp, else: latest
    end)
  end

  defp missing_metadata?(record) do
    is_nil(record.company_id) or is_nil(record.access_context_id) or is_nil(record.resource_hub_id) or is_nil(record.space_id) or
      is_nil(record.scope_updated_at)
  end
end
