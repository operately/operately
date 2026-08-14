defmodule Operately.Repo.Migrations.UniqueMcpRefreshTokenPreviousTokenId do
  use Ecto.Migration

  def change do
    # Replace the lookup-only index with a unique one so a refresh token can have
    # at most one successor. Postgres cannot alter that index in place, and keeping
    # both would collide on the default name.
    drop index(:mcp_refresh_tokens, [:previous_token_id])
    create unique_index(:mcp_refresh_tokens, [:previous_token_id])
  end
end
