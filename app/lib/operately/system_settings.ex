defmodule Operately.SystemSettings do
  alias Operately.Repo
  alias Operately.SystemSettings.Settings

  @global_key "global"

  def global_key, do: @global_key

  def get do
    Repo.get_by(Settings, key: @global_key)
  end

  def get! do
    Repo.get_by!(Settings, key: @global_key)
  end

  def upsert(attrs \\ %{}) do
    attrs = Map.put_new(attrs, :key, @global_key)

    case get() do
      nil -> %Settings{} |> Settings.changeset(attrs) |> Repo.insert()
      settings -> settings |> Settings.changeset(attrs) |> Repo.update()
    end
  end
end
