defmodule Operately.Support.Factory.People do
  alias Operately.Repo
  alias Operately.People.Person
  alias Operately.People.ApiToken

  def add_api_token(ctx, testid, person_name, opts \\ []) do
    person = Map.fetch!(ctx, person_name)
    read_only = Keyword.get(opts, :read_only, true)
    name = Keyword.get(opts, :name)

    attrs =
      %{read_only: read_only}
      |> maybe_put_name(name)

    {:ok, _api_token, raw_token} = Operately.People.create_api_token(person, attrs)

    # testid points to the unhashed token string (not the DB object)
    Map.put(ctx, testid, raw_token)
  end

  def set_api_token_mode(ctx, token_testid, read_only) when is_boolean(read_only) do
    raw_token = Map.fetch!(ctx, token_testid)
    token_hash = ApiToken.hash_token(raw_token)

    token = Repo.get_by!(ApiToken, token_hash: token_hash)
    person = Repo.get!(Person, token.person_id)
    {:ok, _updated_token} = Operately.People.set_api_token_read_only(person, token.id, read_only)

    # preserve the same testid value (raw token string)
    ctx
  end

  defp maybe_put_name(attrs, nil), do: attrs
  defp maybe_put_name(attrs, name), do: Map.put(attrs, :name, name)
end
