defmodule Operately.ProductReleases do
  @moduledoc """
  Latest published marketing release, loaded from the official RSS feed.
  """

  alias Operately.ProductReleases.{Cache, Fetcher}

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
