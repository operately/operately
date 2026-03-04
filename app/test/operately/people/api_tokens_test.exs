defmodule Operately.People.ApiTokensTest do
  use Operately.DataCase

  import Operately.PeopleFixtures

  alias Operately.People
  alias Operately.People.ApiToken
  alias Operately.People.Person

  describe "create_api_token/2" do
    setup do
      ctx =
        %{}
        |> Factory.setup()
        |> Factory.add_company_member(:member)

      {:ok, ctx}
    end

    test "it creates a token, returns the raw token, and stores only a hash", ctx do
      assert {:ok, api_token, raw_token} = People.create_api_token(ctx.member, %{})

      assert String.starts_with?(raw_token, "opk_")
      assert api_token.person_id == ctx.member.id
      assert api_token.name == nil
      assert api_token.read_only == true
      assert api_token.token_hash == :crypto.hash(:sha256, raw_token)
      refute api_token.token_hash == raw_token
    end

    test "it accepts explicit read_only=false", ctx do
      assert {:ok, api_token, _raw_token} = People.create_api_token(ctx.member, %{read_only: false})

      assert api_token.read_only == false
    end

    test "it stores an optional name as metadata", ctx do
      assert {:ok, api_token, _raw_token} = People.create_api_token(ctx.member, %{name: "  Deploy Bot  "})

      assert api_token.name == "Deploy Bot"
    end

    test "it normalizes blank name to nil", ctx do
      assert {:ok, api_token, _raw_token} = People.create_api_token(ctx.member, %{name: "   "})

      assert api_token.name == nil
    end

    test "it allows duplicate names", ctx do
      assert {:ok, _first, _raw_token} = People.create_api_token(ctx.member, %{name: "CI"})
      assert {:ok, _second, _raw_token} = People.create_api_token(ctx.member, %{name: "CI"})
    end
  end

  describe "list_api_tokens/1" do
    setup do
      ctx =
        %{}
        |> Factory.setup()
        |> Factory.add_company_member(:member)
        |> Factory.add_company_member(:other_member)

      {:ok, ctx}
    end

    test "it lists only tokens from the given person ordered by newest first", ctx do
      assert {:ok, first_token, _raw_token} = People.create_api_token(ctx.member, %{name: "First"})
      assert {:ok, _other_token, _raw_token} = People.create_api_token(ctx.other_member, %{name: "Other"})

      old_time =
        case first_token.inserted_at do
          %DateTime{} ->
            DateTime.utc_now() |> DateTime.add(-3600, :second) |> DateTime.truncate(:second)

          %NaiveDateTime{} ->
            NaiveDateTime.utc_now() |> NaiveDateTime.add(-3600, :second) |> NaiveDateTime.truncate(:second)
        end

      Repo.update_all(from(t in ApiToken, where: t.id == ^first_token.id), set: [inserted_at: old_time, updated_at: old_time])

      assert {:ok, second_token, _raw_token} = People.create_api_token(ctx.member, %{name: "Second"})

      tokens = People.list_api_tokens(ctx.member)

      assert Enum.map(tokens, & &1.id) == [second_token.id, first_token.id]
    end
  end

  describe "delete_api_token/2" do
    setup do
      ctx =
        %{}
        |> Factory.setup()
        |> Factory.add_company_member(:member)
        |> Factory.add_company_member(:other_member)

      {:ok, ctx}
    end

    test "it deletes a token owned by the person", ctx do
      assert {:ok, api_token, _raw_token} = People.create_api_token(ctx.member, %{})

      assert {:ok, :deleted} = People.delete_api_token(ctx.member, api_token.id)
      assert Repo.get(ApiToken, api_token.id) == nil
    end

    test "it returns not_found for a token owned by another person", ctx do
      assert {:ok, api_token, _raw_token} = People.create_api_token(ctx.member, %{})

      assert {:error, :not_found} = People.delete_api_token(ctx.other_member, api_token.id)
    end

    test "it returns not_found for a missing token", ctx do
      assert {:error, :not_found} = People.delete_api_token(ctx.member, Ecto.UUID.generate())
    end
  end

  describe "set_api_token_read_only/3" do
    setup do
      ctx =
        %{}
        |> Factory.setup()
        |> Factory.add_company_member(:member)
        |> Factory.add_company_member(:other_member)

      {:ok, ctx}
    end

    test "it updates a token owned by the person", ctx do
      assert {:ok, api_token, _raw_token} = People.create_api_token(ctx.member, %{read_only: true})

      assert {:ok, updated} = People.set_api_token_read_only(ctx.member, api_token.id, false)
      assert updated.read_only == false
    end

    test "it returns not_found for a token owned by another person", ctx do
      assert {:ok, api_token, _raw_token} = People.create_api_token(ctx.member, %{read_only: true})

      assert {:error, :not_found} = People.set_api_token_read_only(ctx.other_member, api_token.id, false)
    end

    test "it returns not_found for a missing token", ctx do
      assert {:error, :not_found} = People.set_api_token_read_only(ctx.member, Ecto.UUID.generate(), false)
    end
  end

  describe "set_api_token_name/3" do
    setup do
      ctx =
        %{}
        |> Factory.setup()
        |> Factory.add_company_member(:member)
        |> Factory.add_company_member(:other_member)

      {:ok, ctx}
    end

    test "it updates token name for the owner", ctx do
      assert {:ok, api_token, _raw_token} = People.create_api_token(ctx.member, %{name: "Old Name"})

      assert {:ok, updated} = People.set_api_token_name(ctx.member, api_token.id, "Deploy Bot")
      assert updated.name == "Deploy Bot"
    end

    test "it trims and normalizes blank names", ctx do
      assert {:ok, api_token, _raw_token} = People.create_api_token(ctx.member, %{name: "Old Name"})

      assert {:ok, updated} = People.set_api_token_name(ctx.member, api_token.id, "  Deploy Bot  ")
      assert updated.name == "Deploy Bot"

      assert {:ok, cleared} = People.set_api_token_name(ctx.member, api_token.id, "   ")
      assert cleared.name == nil
    end

    test "it returns not_found for foreign token", ctx do
      assert {:ok, api_token, _raw_token} = People.create_api_token(ctx.member, %{name: "Owned"})

      assert {:error, :not_found} = People.set_api_token_name(ctx.other_member, api_token.id, "Deploy Bot")
    end

    test "it returns not_found for missing token", ctx do
      assert {:error, :not_found} = People.set_api_token_name(ctx.member, Ecto.UUID.generate(), "Deploy Bot")
    end

    test "it returns changeset error for too long names", ctx do
      assert {:ok, api_token, _raw_token} = People.create_api_token(ctx.member, %{name: "Owned"})
      long_name = String.duplicate("a", 256)

      assert {:error, changeset} = People.set_api_token_name(ctx.member, api_token.id, long_name)
      assert {"should be at most %{count} character(s)", _} = changeset.errors[:name]
    end
  end

  describe "authenticate_api_token/1" do
    setup do
      ctx =
        %{}
        |> Factory.setup()
        |> Factory.add_company_member(:member)

      {:ok, ctx}
    end

    test "it authenticates a valid token and returns token/person/account/company", ctx do
      assert {:ok, api_token, raw_token} = People.create_api_token(ctx.member, %{})

      assert {:ok, auth_context} = People.authenticate_api_token(raw_token)

      assert auth_context.token.id == api_token.id
      assert auth_context.person.id == ctx.member.id
      assert auth_context.account.id == ctx.member.account_id
      assert auth_context.company.id == ctx.company.id
    end

    test "it returns unauthorized for invalid or blank tokens" do
      assert {:error, :unauthorized} = People.authenticate_api_token("invalid")
      assert {:error, :unauthorized} = People.authenticate_api_token("")
      assert {:error, :unauthorized} = People.authenticate_api_token("   ")
      assert {:error, :unauthorized} = People.authenticate_api_token(nil)
    end

    test "it returns unauthorized when the person is suspended", ctx do
      assert {:ok, _api_token, raw_token} = People.create_api_token(ctx.member, %{})

      {:ok, _member} =
        People.update_person(ctx.member, %{
          suspended: true,
          suspended_at: DateTime.utc_now() |> DateTime.truncate(:second)
        })

      assert {:error, :unauthorized} = People.authenticate_api_token(raw_token)
    end

    test "it returns unauthorized when person has no account", ctx do
      person_without_account = person_fixture(%{company_id: ctx.company.id, full_name: "No Account Person"})
      assert person_without_account.account_id == nil

      assert {:ok, _api_token, raw_token} = People.create_api_token(person_without_account, %{})
      assert {:error, :unauthorized} = People.authenticate_api_token(raw_token)
    end

    test "it returns unauthorized when person has no company", ctx do
      person_without_company = person_fixture_with_account(%{company_id: ctx.company.id, full_name: "No Company Person"})
      assert {:ok, _api_token, raw_token} = People.create_api_token(person_without_company, %{})

      Repo.update_all(from(p in Person, where: p.id == ^person_without_company.id), set: [company_id: nil])

      assert {:error, :unauthorized} = People.authenticate_api_token(raw_token)
    end
  end

  describe "touch_last_used/1" do
    setup do
      ctx =
        %{}
        |> Factory.setup()
        |> Factory.add_company_member(:member)

      {:ok, ctx}
    end

    test "it updates once and throttles updates inside the window", ctx do
      assert {:ok, api_token, _raw_token} = People.create_api_token(ctx.member, %{})
      assert api_token.last_used_at == nil

      assert :ok = People.touch_last_used(api_token)

      first = Repo.get!(ApiToken, api_token.id)
      assert first.last_used_at != nil

      assert :ok = People.touch_last_used(first)

      second = Repo.get!(ApiToken, api_token.id)
      assert second.last_used_at == first.last_used_at
    end
  end

  describe "data constraints" do
    setup do
      ctx =
        %{}
        |> Factory.setup()
        |> Factory.add_company_member(:member)

      {:ok, ctx}
    end

    test "db default keeps read_only=true", ctx do
      id = Ecto.UUID.generate()
      token_hash = :crypto.hash(:sha256, "default-read-only")

      Repo.query!(
        "INSERT INTO api_tokens (id, person_id, token_hash, inserted_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW())",
        [Ecto.UUID.dump!(id), Ecto.UUID.dump!(ctx.member.id), token_hash]
      )

      token = Repo.get!(ApiToken, id)
      assert token.read_only == true
    end

    test "token_hash must be unique", ctx do
      shared_hash = :crypto.hash(:sha256, "same-hash")

      attrs = %{
        person_id: ctx.member.id,
        token_hash: shared_hash,
        read_only: true
      }

      assert {:ok, _token} =
               %ApiToken{}
               |> ApiToken.changeset(attrs)
               |> Repo.insert()

      assert {:error, changeset} =
               %ApiToken{}
               |> ApiToken.changeset(attrs)
               |> Repo.insert()

      assert "has already been taken" in errors_on(changeset).token_hash
    end

    test "person_id must reference an existing person" do
      attrs = %{
        person_id: Ecto.UUID.generate(),
        token_hash: :crypto.hash(:sha256, "missing-person"),
        read_only: true
      }

      assert {:error, changeset} =
               %ApiToken{}
               |> ApiToken.changeset(attrs)
               |> Repo.insert()

      assert "does not exist" in errors_on(changeset).person_id
    end
  end
end
