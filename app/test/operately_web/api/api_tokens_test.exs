defmodule OperatelyWeb.Api.ApiTokensTest do
  use OperatelyWeb.TurboCase

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.log_in_person(:creator)
  end

  describe "create api token" do
    test "creates token with read_only true by default", ctx do
      assert {200, res} = mutation(ctx.conn, [:api_tokens, :create], %{})

      assert res.api_token.id
      assert res.api_token.read_only == true
      assert res.api_token.name == nil
      assert is_binary(res.token)
      assert_token_dates(res.api_token, last_used_at: nil)

      {:ok, id} = Operately.ShortUuid.decode(res.api_token.id)
      token = Operately.Repo.get!(Operately.People.ApiToken, id)
      assert token.read_only == true
    end

    test "creates token with provided read_only value", ctx do
      assert {200, res} = mutation(ctx.conn, [:api_tokens, :create], %{read_only: false})

      assert res.api_token.id
      assert res.api_token.read_only == false
      assert res.api_token.name == nil
      assert is_binary(res.token)
      assert_token_dates(res.api_token, last_used_at: nil)

      {:ok, id} = Operately.ShortUuid.decode(res.api_token.id)
      token = Operately.Repo.get!(Operately.People.ApiToken, id)
      assert token.read_only == false
    end

    test "returns token in response", ctx do
      assert {200, res} = mutation(ctx.conn, [:api_tokens, :create], %{read_only: true})

      assert res.api_token.id
      assert res.api_token.read_only == true
      assert res.api_token.name == nil
      assert is_binary(res.token)
      assert_token_dates(res.api_token, last_used_at: nil)
    end
  end

  describe "list api tokens" do
    test "returns only current person's tokens", ctx do
      ctx = Factory.add_company_member(ctx, :another_person)

      {:ok, own_1, _} = Operately.People.create_api_token(ctx.creator, %{read_only: true, name: "Primary"})
      {:ok, own_2, _} = Operately.People.create_api_token(ctx.creator, %{read_only: false, name: "Secondary"})
      {:ok, _other, _} = Operately.People.create_api_token(ctx.another_person, %{read_only: true})

      assert {200, res} = query(ctx.conn, [:api_tokens, :list], %{})

      ids = MapSet.new(Enum.map(res.api_tokens, &extract_id/1))
      expected_ids = MapSet.new([
        Operately.ShortUuid.encode!(own_1.id),
        Operately.ShortUuid.encode!(own_2.id)
      ])
      assert ids == expected_ids

      assert Enum.all?(res.api_tokens, fn token ->
               is_binary(token.inserted_at) and (is_binary(token.last_used_at) or is_nil(token.last_used_at))
             end)
    end

    test "returns empty list when person has no tokens", ctx do
      assert {200, res} = query(ctx.conn, [:api_tokens, :list], %{})

      assert res.api_tokens == []
    end

    test "includes read_only status in list", ctx do
      {:ok, token_1, _} = Operately.People.create_api_token(ctx.creator, %{read_only: true})
      {:ok, token_2, _} = Operately.People.create_api_token(ctx.creator, %{read_only: false, name: "Deploy"})

      assert {200, res} = query(ctx.conn, [:api_tokens, :list], %{})

      assert length(res.api_tokens) == 2

      encoded_id_1 = Operately.ShortUuid.encode!(token_1.id)
      encoded_id_2 = Operately.ShortUuid.encode!(token_2.id)

      token_1_res = Enum.find(res.api_tokens, &(&1.id == encoded_id_1))
      token_2_res = Enum.find(res.api_tokens, &(&1.id == encoded_id_2))

      assert token_1_res.read_only == true
      assert token_2_res.read_only == false
      assert token_1_res.name == nil
      assert token_2_res.name == "Deploy"
      assert_token_dates(token_1_res, last_used_at: nil)
      assert_token_dates(token_2_res, last_used_at: nil)
    end
  end

  describe "set_read_only" do
    test "updates read_only from true to false", ctx do
      {:ok, token, _} = Operately.People.create_api_token(ctx.creator, %{read_only: true, name: "Deploy"})

      assert {200, res} = mutation(ctx.conn, [:api_tokens, :set_read_only], %{
        id: Paths.token_id(token),
        read_only: false
      })

      assert res.api_token.id
      assert res.api_token.read_only == false
      assert res.api_token.name == "Deploy"
      assert_token_dates(res.api_token)

      updated = Operately.Repo.get!(Operately.People.ApiToken, token.id)
      assert updated.read_only == false
    end

    test "updates read_only from false to true", ctx do
      {:ok, token, _} = Operately.People.create_api_token(ctx.creator, %{read_only: false})

      assert {200, res} = mutation(ctx.conn, [:api_tokens, :set_read_only], %{
        id: Paths.token_id(token),
        read_only: true
      })

      assert res.api_token.id
      assert res.api_token.read_only == true
      assert_token_dates(res.api_token)

      updated = Operately.Repo.get!(Operately.People.ApiToken, token.id)
      assert updated.read_only == true
    end

    test "returns not_found for unknown id", ctx do
      assert {404, res} = mutation(ctx.conn, [:api_tokens, :set_read_only], %{
        id: Ecto.UUID.generate(),
        read_only: false
      })

      assert res.message == "The requested resource was not found"
    end

    test "returns not_found for token owned by another person", ctx do
      ctx = Factory.add_company_member(ctx, :another_person)

      {:ok, other_token, _} = Operately.People.create_api_token(ctx.another_person, %{read_only: true})

      assert {404, res} = mutation(ctx.conn, [:api_tokens, :set_read_only], %{
        id: Paths.token_id(other_token),
        read_only: false
      })

      assert res.message == "The requested resource was not found"
    end
  end

  describe "update_name" do
    test "updates own token name", ctx do
      {:ok, token, _} = Operately.People.create_api_token(ctx.creator, %{read_only: true})

      assert {200, res} = mutation(ctx.conn, [:api_tokens, :update_name], %{
        id: Paths.token_id(token),
        name: "Deploy Bot"
      })

      assert res.api_token.id
      assert res.api_token.name == "Deploy Bot"
      assert_token_dates(res.api_token)

      updated = Operately.Repo.get!(Operately.People.ApiToken, token.id)
      assert updated.name == "Deploy Bot"
    end

    test "trims the provided name", ctx do
      {:ok, token, _} = Operately.People.create_api_token(ctx.creator, %{read_only: true})

      assert {200, res} = mutation(ctx.conn, [:api_tokens, :update_name], %{
        id: Paths.token_id(token),
        name: "  Deploy Bot  "
      })

      assert res.api_token.name == "Deploy Bot"

      updated = Operately.Repo.get!(Operately.People.ApiToken, token.id)
      assert updated.name == "Deploy Bot"
    end

    test "clears name when blank", ctx do
      {:ok, token, _} = Operately.People.create_api_token(ctx.creator, %{read_only: true, name: "CI"})

      assert {200, res} = mutation(ctx.conn, [:api_tokens, :update_name], %{
        id: Paths.token_id(token),
        name: "   "
      })

      assert res.api_token.name == nil

      updated = Operately.Repo.get!(Operately.People.ApiToken, token.id)
      assert updated.name == nil
    end

    test "returns not_found for unknown id", ctx do
      assert {404, res} = mutation(ctx.conn, [:api_tokens, :update_name], %{
        id: Ecto.UUID.generate(),
        name: "Deploy Bot"
      })

      assert res.message == "The requested resource was not found"
    end

    test "returns not_found for token owned by another person", ctx do
      ctx = Factory.add_company_member(ctx, :another_person)
      {:ok, other_token, _} = Operately.People.create_api_token(ctx.another_person, %{read_only: true})

      assert {404, res} = mutation(ctx.conn, [:api_tokens, :update_name], %{
        id: Paths.token_id(other_token),
        name: "Deploy Bot"
      })

      assert res.message == "The requested resource was not found"
    end

    test "returns bad_request for invalid name length", ctx do
      {:ok, token, _} = Operately.People.create_api_token(ctx.creator, %{read_only: true})
      long_name = String.duplicate("a", 256)

      assert {400, res} = mutation(ctx.conn, [:api_tokens, :update_name], %{
        id: Paths.token_id(token),
        name: long_name
      })

      assert res.message == "The request was malformed"
    end

    test "returns forbidden for token-auth mode", ctx do
      conn = Plug.Conn.assign(ctx.conn, :api_auth_mode, :api_token)

      assert {403, res} = mutation(conn, [:api_tokens, :update_name], %{
        id: Ecto.UUID.generate(),
        name: "Deploy Bot"
      })

      assert res.message == "You don't have permission to perform this action"
    end
  end

  describe "delete api token" do
    test "deletes token", ctx do
      {:ok, token, _} = Operately.People.create_api_token(ctx.creator, %{read_only: true})

      assert {200, res} = mutation(ctx.conn, [:api_tokens, :delete], %{id: Paths.token_id(token)})

      assert res.success == true

      assert_raise Ecto.NoResultsError, fn ->
        Operately.Repo.get!(Operately.People.ApiToken, token.id)
      end
    end

    test "deletes only selected token", ctx do
      {:ok, token_1, _} = Operately.People.create_api_token(ctx.creator, %{read_only: true})
      {:ok, token_2, _} = Operately.People.create_api_token(ctx.creator, %{read_only: false})

      assert {200, res} = mutation(ctx.conn, [:api_tokens, :delete], %{id: Paths.token_id(token_1)})

      assert res.success == true

      tokens = Operately.People.list_api_tokens(ctx.creator)
      ids = Enum.map(tokens, & &1.id)

      refute token_1.id in ids
      assert token_2.id in ids
    end

    test "returns not_found for unknown id", ctx do
      assert {404, res} = mutation(ctx.conn, [:api_tokens, :delete], %{
        id: Ecto.UUID.generate()
      })

      assert res.message == "The requested resource was not found"
    end

    test "returns not_found for token owned by another person", ctx do
      ctx = Factory.add_company_member(ctx, :another_person)

      {:ok, other_token, _} = Operately.People.create_api_token(ctx.another_person, %{read_only: true})

      assert {404, res} = mutation(ctx.conn, [:api_tokens, :delete], %{
        id: Paths.token_id(other_token)
      })

      assert res.message == "The requested resource was not found"
    end
  end

  defp extract_id(map) when is_map(map) do
    map[:id] || map["id"]
  end

  defp assert_token_dates(token, opts \\ []) do
    assert is_binary(token.inserted_at)

    expected_last_used = Keyword.get(opts, :last_used_at, :any)

    if expected_last_used == :any do
      assert is_binary(token.last_used_at) or is_nil(token.last_used_at)
    else
      assert token.last_used_at == expected_last_used
    end
  end
end
