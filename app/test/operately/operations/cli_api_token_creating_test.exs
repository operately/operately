defmodule Operately.Operations.CliApiTokenCreatingTest do
  use Operately.DataCase, async: true

  alias Operately.Operations.CliApiTokenCreating
  alias Operately.People
  alias Operately.People.CliAuthSession

  setup do
    {:ok, Factory.setup(%{})}
  end

  describe "run/4" do
    test "creates an api token for the selected company and consumes the bootstrap session", ctx do
      {:ok, session, _bootstrap_token} = CliAuthSession.create_authenticated_session(ctx.account)

      assert {:ok, company, api_token, raw_token} =
               CliApiTokenCreating.run(session, ctx.account, ctx.company.short_id, false)

      assert company.id == ctx.company.id
      assert api_token.person_id == ctx.creator.id
      assert api_token.read_only == false
      assert is_binary(raw_token)

      assert {:ok, auth_context} = People.authenticate_api_token(raw_token)
      assert auth_context.token.id == api_token.id
      assert auth_context.person.id == ctx.creator.id
      assert auth_context.company.id == ctx.company.id

      assert Repo.get!(CliAuthSession, session.id).status == :consumed
    end

    test "returns not_found when the company does not belong to the bootstrap session account", ctx do
      ctx =
        ctx
        |> Factory.add_account(:other_account)
        |> then(fn ctx -> Factory.add_company(ctx, :other_company, ctx.other_account, name: "Other Company") end)

      {:ok, session, _bootstrap_token} = CliAuthSession.create_authenticated_session(ctx.account)

      assert {:error, :not_found} =
               CliApiTokenCreating.run(session, ctx.account, ctx.other_company.short_id, true)
    end

    test "returns unauthorized when the bootstrap session has already been consumed", ctx do
      {:ok, session, _bootstrap_token} = CliAuthSession.create_authenticated_session(ctx.account)

      Repo.update!(CliAuthSession.changeset(session, %{status: :consumed}))

      assert {:error, :unauthorized} =
               CliApiTokenCreating.run(session, ctx.account, ctx.company.short_id, true)
    end

    test "returns unauthorized when the bootstrap session is expired", ctx do
      {:ok, session, _bootstrap_token} = CliAuthSession.create_authenticated_session(ctx.account)

      expired_at =
        DateTime.utc_now()
        |> DateTime.add(-60, :second)
        |> DateTime.truncate(:second)

      Repo.update!(CliAuthSession.changeset(session, %{expires_at: expired_at}))

      assert {:error, :unauthorized} =
               CliApiTokenCreating.run(session, ctx.account, ctx.company.short_id, true)
    end

    test "returns forbidden when the bootstrap session is not authenticated", ctx do
      {:ok, session, _bootstrap_token} = CliAuthSession.create_pending_google_session()

      assert {:error, :forbidden} =
               CliApiTokenCreating.run(session, ctx.account, ctx.company.short_id, true)
    end

    test "returns unauthorized when the bootstrap session belongs to another account", ctx do
      ctx = Factory.add_account(ctx, :other_account)
      {:ok, session, _bootstrap_token} = CliAuthSession.create_authenticated_session(ctx.account)

      assert {:error, :unauthorized} =
               CliApiTokenCreating.run(session, ctx.other_account, ctx.company.short_id, true)
    end
  end
end
