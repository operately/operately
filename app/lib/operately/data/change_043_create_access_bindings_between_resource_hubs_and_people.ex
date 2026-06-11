defmodule Operately.Data.Change043CreateAccessBindingsBetweenResourceHubsAndPeople do
  alias Operately.Repo

  # This module is still called by the historical 20241115093941 migration during
  # migrate-from-scratch setups. Resource hubs no longer have their own access
  # context and instead inherit bindings from their parent, so there is nothing
  # to create here anymore.
  def run do
    Repo.transaction(fn -> :ok end)
  end
end
