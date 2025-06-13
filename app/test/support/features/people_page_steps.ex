defmodule Operately.Support.Features.PeoplePageSteps do
  use Operately.FeatureCase

  step :visit_person_page, ctx, person do
    id = Paths.person_id(person)

    ctx
    |> UI.click(testid: "company-dropdown")
    |> UI.click(testid: "company-dropdown-people")
    |> UI.click(testid: "person-#{id}")
  end

  step :click_on_person_card, ctx, person do
    id = Paths.person_id(person)

    ctx
    |> UI.click(testid: "person-card-#{id}")
  end

  step :assert_activity_visible_on_feed, ctx, attrs do
    text = "#{attrs.name} created the #{attrs.project_name} project"

    ctx
    |> UI.find(UI.query(testid: "profile-feed"), fn el ->
      el
      |> UI.assert_text(text)
    end)
  end

  step :click_about_tab, ctx do
    UI.click(ctx, testid: "tab-about")
  end

  step :click_activity_tab, ctx do
    UI.click(ctx, testid: "tab-activity")
  end
end
