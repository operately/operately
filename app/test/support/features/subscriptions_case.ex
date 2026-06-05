defmodule Operately.Support.Features.SubscriptionsCase do
  defmacro __using__(_) do
    quote do
      alias Operately.Support.Features.SubscriptionsSteps, as: Steps

      setup ctx do
        ctx
        |> Operately.Support.Factory.setup()
        |> Operately.Support.Factory.add_space(:space)
      end

      defp test_current_subscriptions_widget(ctx, resource) do
        ctx
        |> Steps.assert_current_subscribers(%{count: 5, resource: resource})
        |> Steps.open_current_subscriptions_form()
        |> Steps.toggle_person_checkbox(ctx.bob)
        |> Steps.toggle_person_checkbox(ctx.jane)
        |> Steps.save_people_selection()
        |> Steps.assert_current_subscribers(%{count: 3, resource: resource})
        |> Steps.unsubscribe()
        |> Steps.assert_current_subscribers(%{count: 2, resource: resource})
        |> Steps.open_current_subscriptions_form()
        |> Steps.deselect_everyone()
        |> Steps.save_people_selection()
        |> Steps.assert_current_subscribers(%{count: 0, resource: resource})
        |> Steps.open_current_subscriptions_form()
        |> Steps.select_everyone()
        |> Steps.close_form_without_saving()
        |> Steps.assert_current_subscribers(%{count: 0, resource: resource})
        |> Steps.subscribe()
        |> Steps.assert_current_subscribers(%{count: 1, resource: resource})
        |> Steps.open_current_subscriptions_form()
        |> Steps.select_everyone()
        |> Steps.save_people_selection()
        |> Steps.assert_current_subscribers(%{count: 5, resource: resource})
      end
    end
  end
end
