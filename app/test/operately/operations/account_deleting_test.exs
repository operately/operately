defmodule Operately.Operations.AccountDeletingTest do
  use Operately.DataCase

  import Ecto.Query

  alias Operately.Operations.AccountDeleting
  alias Operately.People
  alias Operately.People.Account
  alias Operately.People.AccountToken
  alias Operately.People.ApiToken
  alias Operately.People.CliAuthSession
  alias Operately.Support.Factory

  describe "run/1" do
    test "anonymizes the account, suspends people, and revokes auth artifacts", ctx do
      ctx =
        ctx
        |> Factory.setup()
        |> Factory.add_company_owner(:other_owner)
        |> Factory.add_account(:other_site_admin)
        |> Factory.add_api_token(:creator_token, :creator)

      {:ok, _} = Account.promote_to_admin(ctx.account)
      {:ok, _} = Account.promote_to_admin(ctx.other_site_admin)

      session_token = People.generate_account_session_token(ctx.account)
      {:ok, _cli_session, bootstrap_token} = CliAuthSession.create_authenticated_session(ctx.account)

      raw_api_token = ctx.creator_token
      api_token_hash = ApiToken.hash_token(raw_api_token)

      assert People.get_account_by_session_token(session_token)
      assert {:ok, _} = CliAuthSession.authenticate(bootstrap_token)
      assert {:ok, _} = People.authenticate_api_token(raw_api_token)

      assert {:ok, deleted_account} = AccountDeleting.run(Repo.get!(Account, ctx.account.id))

      persisted_account =
        Repo.one!(
          from(a in Account,
            where: a.id == ^ctx.account.id and not is_nil(a.deleted_at)
          ),
          with_deleted: true
        )

      persisted_person = Repo.get!(Operately.People.Person, ctx.creator.id)

      assert deleted_account.id == ctx.account.id
      assert persisted_account.full_name == "Deleted Account"
      assert persisted_account.email == "deleted+account-#{ctx.account.id}@operately.invalid"
      assert persisted_account.hashed_password == nil
      refute persisted_account.site_admin
      assert persisted_account.deleted_at

      assert persisted_person.full_name == "Deleted User"
      assert persisted_person.email == "deleted+person-#{ctx.creator.id}@operately.invalid"
      assert persisted_person.suspended
      assert persisted_person.suspended_at
      assert persisted_person.title == nil
      assert persisted_person.avatar_url == nil
      assert persisted_person.avatar_blob_id == nil
      assert persisted_person.timezone == nil
      assert persisted_person.description == nil

      assert Repo.aggregate(from(t in AccountToken, where: t.account_id == ^ctx.account.id), :count) == 0
      assert Repo.aggregate(from(s in CliAuthSession, where: s.account_id == ^ctx.account.id), :count) == 0
      assert Repo.get_by(ApiToken, token_hash: api_token_hash) == nil

      assert People.get_account_by_email(ctx.account.email) == nil
      assert People.get_account_by_session_token(session_token) == nil
      assert {:error, :unauthorized} = CliAuthSession.authenticate(bootstrap_token)
      assert {:error, :unauthorized} = People.authenticate_api_token(raw_api_token)
    end

    test "blocks deletion when the account is the last active owner of a company", ctx do
      ctx =
        ctx
        |> Factory.setup()
        |> Factory.add_account(:other_site_admin)

      {:ok, _} = Account.promote_to_admin(ctx.account)
      {:ok, _} = Account.promote_to_admin(ctx.other_site_admin)

      assert {:error, {:last_owner, [company_name]}} = AccountDeleting.run(Repo.get!(Account, ctx.account.id))
      assert company_name == ctx.company.name
    end

    test "blocks deletion when the account is the last site admin", ctx do
      ctx =
        ctx
        |> Factory.setup()
        |> Factory.add_company_owner(:other_owner)

      {:ok, _} = Account.promote_to_admin(ctx.account)

      assert {:error, :last_site_admin} = AccountDeleting.run(Repo.get!(Account, ctx.account.id))
    end
  end
end
