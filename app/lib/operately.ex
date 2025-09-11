defmodule Operately do
  @moduledoc """
  Operately keeps the contexts that define your domain
  and business logic.

  Contexts are also responsible for managing your data, regardless
  if it comes from the database, an external API or others.
  """

  def version do
    # This is replaced by the build script when building the release
    "dev-version"
  end

  def installation_id do
    System.get_env("OPERATELY_INSTALLATION_ID") || "unknown"
  end
end
