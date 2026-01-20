defmodule Operately.InviteLinksTest do
  use Operately.DataCase

  import Mock

  alias Operately.InviteLinks
  alias Operately.InviteLinks.InviteLink
  alias Operately.People
  alias Operately.PeopleFixtures
  alias Operately.Support.Factory
  import Operately.InviteLinksFixtures

  setup ctx do
    ctx
    |> Factory.setup()
  end

  describe "invite_links" do
    test "create_invite_link/1 creates a link with valid data", ctx do
      attrs = %{
        company_id: ctx.company.id,
        author_id: ctx.creator.id
      }

      assert {:ok, invite_link} = InviteLinks.create_invite_link(attrs)
      assert invite_link.company_id == ctx.company.id
      assert invite_link.author_id == ctx.creator.id
      assert invite_link.type == :company_wide
      assert invite_link.is_active == true
      assert invite_link.use_count == 0
      assert invite_link.token != nil
      assert String.length(invite_link.token) >= 32
      assert invite_link.allowed_domains == []
    end

    test "create_personal_invite_link/1 creates a personal link", ctx do
      person = PeopleFixtures.person_fixture_with_account(%{company_id: ctx.company.id})

      assert {:ok, invite_link} =
               InviteLinks.create_personal_invite_link(%{
                 company_id: ctx.company.id,
                 author_id: ctx.creator.id,
                 person_id: person.id
               })

      assert invite_link.type == :personal
      assert invite_link.person_id == person.id
    end

    test "get_invite_link_by_token/1 returns the correct link", ctx do
      {:ok, invite_link} =
        InviteLinks.create_invite_link(%{
          company_id: ctx.company.id,
          author_id: ctx.creator.id
        })

      {:ok, found_link} = InviteLinks.get_invite_link_by_token(invite_link.token)
      assert found_link.id == invite_link.id
    end

    test "get_invite_link_by_token/1 returns nil for invalid token", _ctx do
      assert InviteLinks.get_invite_link_by_token("invalid-token") == {:error, :not_found}
    end

    test "list_invite_links_for_company/1 returns links for the company", ctx do
      # Create a link for the company
      {:ok, invite_link} =
        InviteLinks.create_invite_link(%{
          company_id: ctx.company.id,
          author_id: ctx.creator.id
        })

      # Create another company and link to ensure filtering works
      ctx = Factory.add_company(ctx, :other_company, ctx.account)
      other_creator = Ecto.assoc(ctx.other_company, :people) |> Operately.Repo.all() |> hd()

      {:ok, _other_link} =
        InviteLinks.create_invite_link(%{
          company_id: ctx.other_company.id,
          author_id: other_creator.id
        })

      links = InviteLinks.list_invite_links_for_company(ctx.company.id)
      assert length(links) == 1
      assert hd(links).id == invite_link.id
    end

    test "revoke_invite_link/1 marks link as inactive", ctx do
      {:ok, invite_link} =
        InviteLinks.create_invite_link(%{
          company_id: ctx.company.id,
          author_id: ctx.creator.id
        })

      assert invite_link.is_active == true

      {:ok, revoked_link} = InviteLinks.revoke_invite_link(invite_link)
      assert revoked_link.is_active == false
    end

    test "increment_use_count/1 increases the count", ctx do
      {:ok, invite_link} =
        InviteLinks.create_invite_link(%{
          company_id: ctx.company.id,
          author_id: ctx.creator.id
        })

      assert invite_link.use_count == 0

      {:ok, updated_link} = InviteLinks.increment_use_count(invite_link)
      assert updated_link.use_count == 1
    end

    test "create_invite_link/1 stores normalized allowed domains when provided", ctx do
      {:ok, invite_link} =
        InviteLinks.create_invite_link(%{
          company_id: ctx.company.id,
          author_id: ctx.creator.id,
          allowed_domains: ["Example.com", " acme.org ", "example.com"]
        })

      assert invite_link.allowed_domains == ["example.com", "acme.org"]
    end

    test "create_invite_link/1 rejects invalid domains", ctx do
      assert {:error, changeset} =
               InviteLinks.create_invite_link(%{
                 company_id: ctx.company.id,
                 author_id: ctx.creator.id,
                 allowed_domains: ["invalid domain"]
               })

      assert "contains invalid domain invalid domain" in errors_on(changeset).allowed_domains
    end
  end

  describe "invite_link validation" do
    test "is_valid?/1 returns false for inactive links", ctx do
      {:ok, invite_link} =
        InviteLinks.create_invite_link(%{
          company_id: ctx.company.id,
          author_id: ctx.creator.id
        })

      {:ok, revoked_link} = InviteLinks.revoke_invite_link(invite_link)
      assert InviteLinks.InviteLink.is_valid?(revoked_link) == false
    end

    test "is_valid?/1 returns true for active", ctx do
      {:ok, invite_link} =
        InviteLinks.create_invite_link(%{
          company_id: ctx.company.id,
          author_id: ctx.creator.id
        })

      assert InviteLinks.InviteLink.is_valid?(invite_link) == true
    end
  end

  describe "join_company_via_invite_link/2" do
    test "creates a new person for a valid invite", ctx do
      ctx = Factory.add_account(ctx, :new_account)

      {:ok, invite_link} =
        InviteLinks.create_invite_link(%{
          company_id: ctx.company.id,
          author_id: ctx.creator.id
        })

      assert {:ok, person} = InviteLinks.join_company_via_invite_link(ctx.new_account, invite_link.token)
      assert person.account_id == ctx.new_account.id
      assert person.company_id == ctx.company.id

      reloaded_link = Repo.get!(InviteLink, invite_link.id)
      assert reloaded_link.use_count == 1

      assert People.get_person(ctx.new_account, ctx.company).id == person.id
    end

    test "returns existing person when the account is already in the company", ctx do
      {:ok, invite_link} = InviteLinks.create_invite_link(%{company_id: ctx.company.id, author_id: ctx.creator.id})

      existing_person = People.get_person(ctx.account, ctx.company)
      refute is_nil(existing_person)

      assert {:ok, person} = InviteLinks.join_company_via_invite_link(ctx.account, invite_link.token)
      assert person.id == existing_person.id

      reloaded_link = Repo.get!(InviteLink, invite_link.id)
      assert reloaded_link.use_count == 0
    end

    test "returns error when invite token cannot be found", ctx do
      assert InviteLinks.join_company_via_invite_link(ctx.account, "missing-token") == {:error, :invite_token_not_found}
    end

    test "returns error when the invite link is inactive", ctx do
      ctx = Factory.add_account(ctx, :new_account)

      {:ok, invite_link} =
        InviteLinks.create_invite_link(%{
          company_id: ctx.company.id,
          author_id: ctx.creator.id
        })

      {:ok, revoked_link} = InviteLinks.revoke_invite_link(invite_link)

      assert InviteLinks.join_company_via_invite_link(ctx.new_account, revoked_link.token) == {:error, :invite_token_inactive}
    end

    test "returns error when person creation fails", ctx do
      ctx = Factory.add_account(ctx, :new_account)

      {:ok, invite_link} =
        InviteLinks.create_invite_link(%{
          company_id: ctx.company.id,
          author_id: ctx.creator.id
        })

      changeset = Operately.People.Person.changeset(%Operately.People.Person{}, %{})

      with_mock Operately.People, [:passthrough], create_person: fn _attrs -> {:error, changeset} end do
        assert InviteLinks.join_company_via_invite_link(ctx.new_account, invite_link.token) == {:error, :person_creation_failed}
        assert_called(Operately.People.create_person(:_))
      end

      reloaded_link = Repo.get!(InviteLink, invite_link.id)
      assert reloaded_link.use_count == 0
    end

    test "returns error when updating the invite link fails", ctx do
      ctx = Factory.add_account(ctx, :new_account)

      {:ok, invite_link} =
        InviteLinks.create_invite_link(%{
          company_id: ctx.company.id,
          author_id: ctx.creator.id
        })

      with_mock Operately.InviteLinks, [:passthrough], increment_use_count: fn _invite_link -> {:error, :db_error} end do
        assert InviteLinks.join_company_via_invite_link(ctx.new_account, invite_link.token) == {:error, :invite_link_update_failed}
        assert_called(Operately.InviteLinks.increment_use_count(:_))
      end

      reloaded_link = Repo.get!(InviteLink, invite_link.id)
      assert reloaded_link.use_count == 0
    end

    test "returns error when the account email domain is not allowed", ctx do
      account = PeopleFixtures.account_fixture(%{email: "blocked@other.com"})

      {:ok, invite_link} =
        InviteLinks.create_invite_link(%{
          company_id: ctx.company.id,
          author_id: ctx.creator.id,
          allowed_domains: ["allowed.com"]
        })

      assert InviteLinks.join_company_via_invite_link(account, invite_link.token) ==
               {:error, :invite_token_domain_not_allowed}
    end

    test "allows joining when the account email domain is allowed", ctx do
      account = PeopleFixtures.account_fixture(%{email: "user@allowed.com"})

      {:ok, invite_link} =
        InviteLinks.create_invite_link(%{
          company_id: ctx.company.id,
          author_id: ctx.creator.id,
          allowed_domains: ["allowed.com"]
        })

      assert {:ok, person} = InviteLinks.join_company_via_invite_link(account, invite_link.token)
      assert person.account_id == account.id

      reloaded_link = Repo.get!(InviteLink, invite_link.id)
      assert reloaded_link.use_count == 1
    end

    test "joins company via personal invite link for invited account", ctx do
      member =
        PeopleFixtures.person_fixture_with_account(%{
          company_id: ctx.company.id,
          has_open_invitation: true
        })

      invite_link =
        personal_invite_link_fixture(%{
          company_id: ctx.company.id,
          author_id: ctx.creator.id,
          person_id: member.id
        })

      member = Repo.preload(member, :account)
      account = member.account

      assert is_nil(account.first_login_at)

      assert {:ok, person} = InviteLinks.join_company_via_invite_link(account, invite_link.token)
      assert person.id == member.id

      reloaded_account = Repo.get!(Operately.People.Account, account.id)
      assert reloaded_account.first_login_at

      reloaded_link = Repo.reload(invite_link)
      refute reloaded_link.is_active
    end

    test "returns error when personal invite link belongs to different account", ctx do
      member =
        PeopleFixtures.person_fixture_with_account(%{
          company_id: ctx.company.id,
          has_open_invitation: true
        })

      invite_link =
        personal_invite_link_fixture(%{
          company_id: ctx.company.id,
          author_id: ctx.creator.id,
          person_id: member.id
        })

      other_account = PeopleFixtures.account_fixture(%{})

      assert InviteLinks.join_company_via_invite_link(other_account, invite_link.token) ==
               {:error, :invite_token_invalid}
    end

    test "allows joining when personal invite link member already logged in", ctx do
      member =
        PeopleFixtures.person_fixture_with_account(%{
          company_id: ctx.company.id,
          has_open_invitation: true
        })

      invite_link =
        personal_invite_link_fixture(%{
          company_id: ctx.company.id,
          author_id: ctx.creator.id,
          person_id: member.id
        })

      member = Repo.preload(member, :account)
      account = member.account
      {:ok, _} = Operately.People.mark_account_first_login(account)
      reloaded_account = Repo.get!(Operately.People.Account, account.id)

      assert {:ok, person} = InviteLinks.join_company_via_invite_link(account, invite_link.token)
      assert person.id == member.id

      latest_account = Repo.get!(Operately.People.Account, account.id)
      assert latest_account.first_login_at == reloaded_account.first_login_at

      reloaded_link = Repo.reload(invite_link)
      refute reloaded_link.is_active
    end
  end
end
