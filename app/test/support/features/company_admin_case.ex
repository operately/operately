defmodule Operately.Support.Features.CompanyAdminCase do
  defmacro __using__(_) do
    quote do
      alias Operately.Billing
      alias Operately.Billing.Plans
      alias Operately.People
      alias Operately.Support.Factory
      alias Operately.Support.Features.CompanyAdminSteps, as: Steps
      alias Operately.Support.Features.UI.Emails

      import Operately.BlobsFixtures

      setup ctx do
        ctx
        |> Operately.Support.Features.CompanyAdminSteps.given_a_company_exists()
        |> Operately.Support.Features.CompanyAdminSteps.given_i_am_logged_in(as: ctx[:role])
      end

      defp enable_billing_for_company(ctx) do
        Billing.create_product(%{
          provider: "polar",
          plan_family: "team",
          billing_interval: "monthly",
          polar_product_id: "feature-team-monthly-#{ctx.company.id}",
          active: true
        })

        Factory.enable_feature(ctx, "billing")
      end

      defp fill_company_to_member_limit(ctx) do
        needed_people = max(20 - Billing.active_member_count(ctx.company), 0)

        if needed_people > 0 do
          Enum.reduce(1..needed_people, ctx, fn index, acc ->
            Factory.add_company_member(acc, :"limit_member_#{index}", name: "Limit Member #{index}")
          end)
        else
          ctx
        end
      end

      defp fill_company_to_one_below_member_limit(ctx) do
        needed_people = max(19 - Billing.active_member_count(ctx.company), 0)

        if needed_people > 0 do
          Enum.reduce(1..needed_people, ctx, fn index, acc ->
            Factory.add_company_member(acc, :"almost_limit_member_#{index}", name: "Almost Limit Member #{index}")
          end)
        else
          ctx
        end
      end

      defp fill_company_to_near_member_limit(ctx) do
        needed_people = max(18 - Billing.active_member_count(ctx.company), 0)

        if needed_people > 0 do
          Enum.reduce(1..needed_people, ctx, fn index, acc ->
            Factory.add_company_member(acc, :"near_limit_member_#{index}", name: "Near Limit Member #{index}")
          end)
        else
          ctx
        end
      end

      defp fill_company_to_near_storage_limit(ctx) do
        author = ctx[:owner] || ctx[:admin] || ctx[:member] || ctx.creator

        blob_fixture(%{
          company_id: ctx.company.id,
          author_id: author.id,
          status: :uploaded,
          size: trunc(Plans.storage_limit_bytes(:free) * 0.95)
        })

        ctx
      end

      defp fill_company_beyond_member_limit(ctx) do
        ctx
        |> fill_company_to_member_limit()
        |> Factory.add_company_member(:over_limit_member, name: "Over Limit Member")
      end

      defp fill_company_beyond_storage_limit(ctx) do
        author = ctx[:owner] || ctx[:admin] || ctx[:member] || ctx.creator

        blob_fixture(%{
          company_id: ctx.company.id,
          author_id: author.id,
          status: :uploaded,
          size: trunc(Plans.storage_limit_bytes(:free) * 1.05)
        })

        ctx
      end

      defp assert_no_person_added(ctx, email) do
        refute People.get_person_by_email(ctx.company, email)
        ctx
      end

      defp assert_limit_reached_email(ctx, :member_count, recipients) do
        subject = "#{ctx.company.name} has reached its member limit"
        Enum.each(recipients, &Emails.assert_email_sent(subject, &1))

        ctx
      end

      defp assert_limit_reached_email_sent_once(ctx, :member_count) do
        subject = "#{ctx.company.name} has reached its member limit"

        attempts(ctx, 20, fn ->
          emails = Enum.filter(Emails.list_sent_emails(), &(&1.subject == subject))
          assert length(emails) == 1
        end)

        ctx
      end

      defp assert_member_still_suspended(ctx, key) do
        person = Map.fetch!(ctx, key) |> Operately.Repo.reload()

        assert person.suspended
        assert person.suspended_at != nil

        ctx
      end
    end
  end
end
