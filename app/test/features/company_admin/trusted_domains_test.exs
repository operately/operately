defmodule Operately.Features.CompanyAdmin.TrustedDomainsTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.CompanyAdminSteps, as: Steps

  setup ctx, do: Steps.setup(ctx, as: ctx[:role])

  set_app_config(:billing_enabled, true)

  @tag role: :owner
  feature "adding a trusted email domain", ctx do
    ctx
    |> Steps.open_company_trusted_email_domains_page()
    |> Steps.add_trusted_email_domain("@dmif.com")
    |> Steps.assert_trusted_email_domain_added("@dmif.com")
  end

  @tag role: :owner
  feature "removing a trusted email domain", ctx do
    ctx
    |> Steps.given_the_company_has_trusted_email_domains(["@dmif.com"])
    |> Steps.open_company_trusted_email_domains_page()
    |> Steps.remove_trusted_email_domain("@dmif.com")
    |> Steps.assert_truested_email_domain_list_empty()
  end
end
