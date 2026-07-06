defmodule Operately.Drafts do
  @moduledoc """
  Helpers for draft-capable resources with `state`, `published_at`, and `inserted_at`.
  """

  alias Operately.Time

  def display_date(%{state: :draft, inserted_at: inserted_at}) do
    Time.as_datetime(inserted_at)
  end

  def display_date(%{state: :published, published_at: published_at, inserted_at: inserted_at}) do
    (published_at || inserted_at) |> Time.as_datetime()
  end

  def sort_by_display_date_desc(resources, key \\ &display_date/1) when is_list(resources) do
    Enum.sort_by(resources, key, {:desc, DateTime})
  end

  def node_display_date(%{type: :document, document: %{state: _} = document}) when not is_nil(document) do
    display_date(document)
  end

  def node_display_date(node), do: Time.as_datetime(node.inserted_at)
end
