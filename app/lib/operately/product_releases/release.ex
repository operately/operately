defmodule Operately.ProductReleases.Release do
  @moduledoc """
  Latest published marketing release, parsed from the official RSS feed.
  """

  def __api_typename__, do: "product_release"

  @enforce_keys [:id, :title, :published_at]
  defstruct [:id, :title, :published_at, :teaser, :version]
end
