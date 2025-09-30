defmodule Operately.InviteLinksTest do
  use Operately.DataCase

  alias Operately.InviteLinks
  alias Operately.Support.Factory

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
      assert invite_link.is_active == true
      assert invite_link.use_count == 0
      assert invite_link.token != nil
      assert String.length(invite_link.token) >= 32
      assert invite_link.expires_at != nil
    end

    test "create_invite_link/1 sets expiration to 7 days from creation", ctx do
      attrs = %{
        company_id: ctx.company.id,
        author_id: ctx.creator.id
      }

      {:ok, invite_link} = InviteLinks.create_invite_link(attrs)
      
      # Check that expires_at is approximately 7 days from now
      seven_days_from_now = DateTime.add(DateTime.utc_now(), 7 * 24 * 60 * 60, :second)
      time_diff = DateTime.diff(invite_link.expires_at, seven_days_from_now, :second)
      
      # Allow for a few seconds difference due to execution time
      assert abs(time_diff) <= 5
    end

    test "get_invite_link_by_token/1 returns the correct link", ctx do
      {:ok, invite_link} = InviteLinks.create_invite_link(%{
        company_id: ctx.company.id,
        author_id: ctx.creator.id
      })

      found_link = InviteLinks.get_invite_link_by_token(invite_link.token)
      assert found_link.id == invite_link.id
    end

    test "get_invite_link_by_token/1 returns nil for invalid token", _ctx do
      assert InviteLinks.get_invite_link_by_token("invalid-token") == nil
    end

    test "list_invite_links_for_company/1 returns links for the company", ctx do
      # Create a link for the company
      {:ok, invite_link} = InviteLinks.create_invite_link(%{
        company_id: ctx.company.id,
        author_id: ctx.creator.id
      })

      # Create another company and link to ensure filtering works
      ctx = Factory.add_company(ctx, :other_company, ctx.account)
      other_creator = Ecto.assoc(ctx.other_company, :people) |> Operately.Repo.all() |> hd()
      
      {:ok, _other_link} = InviteLinks.create_invite_link(%{
        company_id: ctx.other_company.id,
        author_id: other_creator.id
      })

      links = InviteLinks.list_invite_links_for_company(ctx.company.id)
      assert length(links) == 1
      assert hd(links).id == invite_link.id
    end

    test "revoke_invite_link/1 marks link as inactive", ctx do
      {:ok, invite_link} = InviteLinks.create_invite_link(%{
        company_id: ctx.company.id,
        author_id: ctx.creator.id
      })

      assert invite_link.is_active == true

      {:ok, revoked_link} = InviteLinks.revoke_invite_link(invite_link)
      assert revoked_link.is_active == false
    end

    test "increment_use_count/1 increases the count", ctx do
      {:ok, invite_link} = InviteLinks.create_invite_link(%{
        company_id: ctx.company.id,
        author_id: ctx.creator.id
      })

      assert invite_link.use_count == 0

      {:ok, updated_link} = InviteLinks.increment_use_count(invite_link)
      assert updated_link.use_count == 1
    end
  end

  describe "invite_link validation" do
    test "is_expired?/1 returns true for expired links", ctx do
      expired_time = DateTime.add(DateTime.utc_now(), -1, :day)
      
      {:ok, invite_link} = InviteLinks.create_invite_link(%{
        company_id: ctx.company.id,
        author_id: ctx.creator.id,
        expires_at: expired_time 
      })

      assert InviteLinks.InviteLink.is_expired?(invite_link) == true
    end

    test "is_expired?/1 returns false for non-expired links", ctx do
      {:ok, invite_link} = InviteLinks.create_invite_link(%{
        company_id: ctx.company.id,
        author_id: ctx.creator.id
      })

      assert InviteLinks.InviteLink.is_expired?(invite_link) == false
    end

    test "is_valid?/1 returns false for inactive links", ctx do
      {:ok, invite_link} = InviteLinks.create_invite_link(%{
        company_id: ctx.company.id,
        author_id: ctx.creator.id
      })

      {:ok, revoked_link} = InviteLinks.revoke_invite_link(invite_link)
      assert InviteLinks.InviteLink.is_valid?(revoked_link) == false
    end

    test "is_valid?/1 returns false for expired links", ctx do
      expired_time = DateTime.add(DateTime.utc_now(), -1, :day)
      
      {:ok, invite_link} = InviteLinks.create_invite_link(%{
        company_id: ctx.company.id,
        author_id: ctx.creator.id,
        expires_at: expired_time
      })

      assert InviteLinks.InviteLink.is_valid?(invite_link) == false
    end

    test "is_valid?/1 returns true for active, non-expired links", ctx do
      {:ok, invite_link} = InviteLinks.create_invite_link(%{
        company_id: ctx.company.id,
        author_id: ctx.creator.id
      })

      assert InviteLinks.InviteLink.is_valid?(invite_link) == true  
    end
  end
end