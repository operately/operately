defmodule Operately.Features.SiteMessagesTest do
  use Operately.FeatureCase

  alias Operately.SiteMessages
  alias Operately.Support.Features.CompanyAdminSteps, as: Steps
  alias Operately.Support.RichText

  setup ctx, do: Steps.setup(ctx, as: ctx[:role])

  @tag role: :owner
  feature "active site messages appear on company pages and can be dismissed", ctx do
    {:ok, message} =
      SiteMessages.create(%{
        title: "Platform update",
        description: RichText.rich_text("We are shipping a new feature."),
        all_companies: true,
        active: true
      })

    ctx =
      ctx
      |> Map.put(:site_message, message)
      |> Steps.visit_company_home_page()
      |> Steps.assert_site_message_banner_visible()
      |> Steps.assert_site_message_banner_text("Platform update")
      |> Steps.assert_site_message_banner_text("We are shipping a new feature.")
      |> Steps.visit_company_admin_page()
      |> Steps.assert_site_message_banner_visible()
      |> Steps.dismiss_site_message_banner()
      |> Steps.assert_site_message_dismissed_in_local_storage()
      |> Steps.visit_company_home_page()
      |> Steps.refute_site_message_banner_visible()
  end

  @tag role: :owner
  feature "users see site messages one at a time", ctx do
    {:ok, first_message} =
      SiteMessages.create(%{
        title: "First message",
        description: RichText.rich_text("Dismiss me first."),
        all_companies: true,
        active: true
      })

    {:ok, _second_message} =
      SiteMessages.create(%{
        title: "Second message",
        description: RichText.rich_text("Shown after the first is dismissed."),
        all_companies: true,
        active: true
      })

    ctx =
      ctx
      |> Map.put(:site_message, first_message)
      |> Steps.visit_company_home_page()
      |> Steps.assert_site_message_banner_text("First message")
      |> Steps.refute_site_message_banner_text("Second message")
      |> Steps.dismiss_site_message_banner()
      |> Steps.assert_site_message_banner_text("Second message")
  end

  @tag role: :owner
  feature "companies without active site messages do not show a banner", ctx do
    ctx
    |> Steps.visit_company_home_page()
    |> Steps.refute_site_message_banner_visible()
    |> Steps.visit_company_admin_page()
    |> Steps.refute_site_message_banner_visible()
  end
end
