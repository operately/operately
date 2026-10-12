defmodule Operately.Features.CuratedTemplateCreationTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.CuratedTemplateCreationSteps, as: Steps
  alias Operately.Support.Features.SignupSteps

  set_app_config(:allow_signup_with_email, true)
  set_app_config(:allow_login_with_email, true)
  set_app_config(:allow_login_with_google, true)

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_curated_template(:template, published: true)
  end

  feature "a signed-in user creates a goal only after submitting", ctx do
    ctx = Factory.add_curated_template(ctx, :template, type: :goal, published: true)

    ctx
    |> UI.login_as(ctx.creator)
    |> Steps.visit_template()
    |> Steps.assert_setup_without_creation()
    |> Steps.create_resource(:goal)
  end

  feature "a signed-in user creates a project only after submitting", ctx do
    ctx = Factory.add_curated_template(ctx, :template, type: :project, published: true)

    ctx
    |> UI.login_as(ctx.creator)
    |> Steps.visit_template()
    |> Steps.assert_setup_without_creation()
    |> Steps.create_resource(:project)
  end

  feature "a signed-in user creates a kpi only after submitting", ctx do
    ctx = Factory.add_curated_template(ctx, :template, type: :kpi, published: true)

    ctx
    |> UI.login_as(ctx.creator)
    |> Steps.visit_template()
    |> Steps.assert_setup_without_creation()
    |> Steps.create_resource(:kpi)
  end

  feature "multiple companies require a selection", ctx do
    ctx = UI.login_as(ctx, ctx.creator)
    ctx = Factory.add_company(ctx, :other_company, ctx.account, name: "Other company")

    ctx
    |> Steps.visit_template()
    |> UI.assert_has(testid: "template-company-picker")
    |> Steps.choose_company()
    |> Steps.assert_setup_without_creation()
  end

  feature "password login and signup cross-links preserve the template", ctx do
    ctx
    |> Steps.visit_template()
    |> UI.assert_has(testid: "login-page")
    |> UI.click(css: "a[href^='/sign_up?']")
    |> UI.assert_has(testid: "sign-up-page")
    |> UI.click(css: "a[href^='/log_in?']")
    |> Steps.password_login()
    |> Steps.assert_setup_without_creation()
  end

  feature "email verification and new company creation resume the template", ctx do
    ctx
    |> Steps.visit_template()
    |> UI.click(css: "a[href^='/sign_up?']")
    |> SignupSteps.choose_signup_with_email()
    |> SignupSteps.fill_in_details()
    |> SignupSteps.fill_in_activation_code_from_email()
    |> Steps.create_company()
    |> Steps.assert_setup_without_creation()
  end

  feature "Google handoff retains the destination", ctx do
    ctx
    |> Steps.visit_template()
    |> Steps.assert_google_handoff()
    |> Steps.complete_google_login()
    |> Steps.assert_setup_without_creation()
  end
end
