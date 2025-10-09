defmodule Operately.Features.InvitePeopleTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.CompanyAdminSteps
  alias Operately.Support.Features.InvitePeopleSteps

  setup ctx do
    ctx
    |> CompanyAdminSteps.given_a_company_exists()
    |> CompanyAdminSteps.given_i_am_logged_in(as: :admin)
  end

  feature "home page invite button opens invite page and generates a link", ctx do
    ctx
    |> InvitePeopleSteps.open_invite_page_from_home()
    |> InvitePeopleSteps.generate_invite_link()
    |> InvitePeopleSteps.assert_link_metadata_visible()
  end

  feature "invite page links to manage people list", ctx do
    ctx
    |> InvitePeopleSteps.open_invite_page_from_admin()
    |> InvitePeopleSteps.follow_manage_people_link()
  end
end
