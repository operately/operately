defmodule Operately.ProductReleases do
  @moduledoc """
  Latest published marketing release, loaded from the official RSS feed.
  """

  alias Operately.Companies
  alias Operately.ProductReleases.{Cache, Fetcher}

  @feature_name "product_release_announcements"

  def feature_name, do: @feature_name

  def ensure_feature_enabled(company) do
    if Companies.has_experimental_feature?(company, @feature_name) do
      {:ok, :enabled}
    else
      {:error, :not_found}
    end
  end

  def latest do
    case Cache.get() do
      {:fresh, release} -> release
      {:expired, stale} -> refresh(stale)
      :miss -> refresh(nil)
    end
  end

  defp refresh(stale) do
    case Fetcher.fetch() do
      {:ok, release} ->
        Cache.put(release)
        release

      {:error, _reason} ->
        stale
    end
  end
end
