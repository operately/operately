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
      assert is_binary(res.token)

      {:ok, id} = Operately.ShortUuid.decode(res.api_token.id)
      token = Operately.Repo.get!(Operately.People.ApiToken, id)
      assert token.read_only == true
    end

    test "creates token with provided read_only value", ctx do
      assert {200, res} = mutation(ctx.conn, [:api_tokens, :create], %{read_only: false})

      assert res.api_token.id
      assert res.api_token.read_only == false
      assert is_binary(res.token)

      {:ok, id} = Operately.ShortUuid.decode(res.api_token.id)
      token = Operately.Repo.get!(Operately.People.ApiToken, id)
      assert token.read_only == false
    end

    test "returns token in response", ctx do
      assert {200, res} = mutation(ctx.conn, [:api_tokens, :create], %{read_only: true})

      assert res.api_token.id
      assert res.api_token.read_only == true
      assert is_binary(res.token)
    end
  end

  describe "list api tokens" do
    test "returns only current person's tokens", ctx do
      ctx = Factory.add_company_member(ctx, :another_person)

      {:ok, own_1, _} = Operately.People.create_api_token(ctx.creator, %{read_only: true})
      {:ok, own_2, _} = Operately.People.create_api_token(ctx.creator, %{read_only: false})
      {:ok, _other, _} = Operately.People.create_api_token(ctx.another_person, %{read_only: true})

      assert {200, res} = query(ctx.conn, [:api_tokens, :list], %{})

      ids = MapSet.new(Enum.map(res.api_tokens, &extract_id/1))
      expected_ids = MapSet.new([
        Operately.ShortUuid.encode!(own_1.id),
        Operately.ShortUuid.encode!(own_2.id)
      ])
      assert ids == expected_ids
    end

    test "returns empty list when person has no tokens", ctx do
      assert {200, res} = query(ctx.conn, [:api_tokens, :list], %{})

      assert res.api_tokens == []
    end

    test "includes read_only status in list", ctx do
      {:ok, token_1, _} = Operately.People.create_api_token(ctx.creator, %{read_only: true})
      {:ok, token_2, _} = Operately.People.create_api_token(ctx.creator, %{read_only: false})

      assert {200, res} = query(ctx.conn, [:api_tokens, :list], %{})

      assert length(res.api_tokens) == 2

      encoded_id_1 = Operately.ShortUuid.encode!(token_1.id)
      encoded_id_2 = Operately.ShortUuid.encode!(token_2.id)

      token_1_res = Enum.find(res.api_tokens, &(&1.id == encoded_id_1))
      token_2_res = Enum.find(res.api_tokens, &(&1.id == encoded_id_2))

      assert token_1_res.read_only == true
      assert token_2_res.read_only == false
    end
  end

  describe "set_read_only" do
    test "updates read_only from true to false", ctx do
      {:ok, token, _} = Operately.People.create_api_token(ctx.creator, %{read_only: true})

      assert {200, res} = mutation(ctx.conn, [:api_tokens, :set_read_only], %{
        id: token.id,
        read_only: false
      })

      assert res.api_token.id
      assert res.api_token.read_only == false

      updated = Operately.Repo.get!(Operately.People.ApiToken, token.id)
      assert updated.read_only == false
    end

    test "updates read_only from false to true", ctx do
      {:ok, token, _} = Operately.People.create_api_token(ctx.creator, %{read_only: false})

      assert {200, res} = mutation(ctx.conn, [:api_tokens, :set_read_only], %{
        id: token.id,
        read_only: true
      })

      assert res.api_token.id
      assert res.api_token.read_only == true

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
        id: other_token.id,
        read_only: false
      })

      assert res.message == "The requested resource was not found"
    end
  end

  describe "delete api token" do
    test "deletes token", ctx do
      {:ok, token, _} = Operately.People.create_api_token(ctx.creator, %{read_only: true})

      assert {200, res} = mutation(ctx.conn, [:api_tokens, :delete], %{id: token.id})

      assert res.success == true

      assert_raise Ecto.NoResultsError, fn ->
        Operately.Repo.get!(Operately.People.ApiToken, token.id)
      end
    end

    test "deletes only selected token", ctx do
      {:ok, token_1, _} = Operately.People.create_api_token(ctx.creator, %{read_only: true})
      {:ok, token_2, _} = Operately.People.create_api_token(ctx.creator, %{read_only: false})

      assert {200, res} = mutation(ctx.conn, [:api_tokens, :delete], %{id: token_1.id})

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
        id: other_token.id
      })

      assert res.message == "The requested resource was not found"
    end
  end

  defp extract_id(map) when is_map(map) do
    map[:id] || map["id"]
  end
end
