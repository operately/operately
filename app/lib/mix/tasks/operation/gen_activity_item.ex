defmodule Mix.Tasks.Operation.GenActivityItem do
  def gen(ctx) do
    gen_file(ctx)
    gen_import(ctx)
  end

  def gen_file(ctx) do
    Mix.Operately.generate_file(ctx.activity_item_file_path, fn _ ->
      """
      import * as People from "@/models/people";

      import { Paths } from "@/routes/paths";
      import type { Activity } from "@/models/activities";
      import type { ActivityContent#{ctx.activity_item_handler_name} } from "@/api";
      import type { ActivityHandler } from "../interfaces";

      const #{ctx.activity_item_handler_name}: ActivityHandler = {
        pageHtmlTitle(_activity: Activity) {
          throw new Error("Not implemented");
        },

        pagePath(_paths: Paths, _activity: Activity) {
          throw new Error("Not implemented");
        },

        PageTitle(_props: { activity: any }) {
          throw new Error("Not implemented");
        },

        PageContent(_props: { activity: Activity }) {
          throw new Error("Not implemented");
        },

        PageOptions(_props: { activity: Activity }) {
          return null;
        },

        FeedItemTitle(_props: { activity: Activity }) {
          return null;
        },

        FeedItemContent(_props: { activity: Activity; page: any }) {
          return null;
        },

        feedItemAlignment(_activity: Activity): "items-start" | "items-center" {
          return "items-center";
        },

        commentCount(_activity: Activity): number {
          throw new Error("Not implemented");
        },

        hasComments(_activity: Activity): boolean {
          throw new Error("Not implemented");
        },

        NotificationTitle(_props: { activity: Activity }) {
          return <></>;
        },

        NotificationLocation(_props: { activity: Activity }) {
          return null;
        },
      };

      function content(activity: Activity): ActivityContent#{ctx.activity_item_handler_name} {
        return activity.content as ActivityContent#{ctx.activity_item_handler_name};
      }

      export default #{ctx.activity_item_handler_name};
      """
    end)
  end

  defp gen_import(ctx) do
    file = "assets/js/features/activities/index.tsx"

    # import handler

    Mix.Operately.inject_into_file(
      file,
      "import #{ctx.activity_item_name} from './#{ctx.activity_item_name}';",
      last_index_of(file, "import ")
    )

    # connect handler to the activity item
    Mix.Operately.inject_into_file(
      file,
      "    .with(\"#{ctx.activity_action_name}\", () => #{ctx.activity_item_name})",
      last_index_of(file, ".with")
    )

    # add to loaded activities

    Mix.Operately.inject_into_file(
      file,
      "  \"#{ctx.activity_action_name}\",",
      last_index_of(file, "DISPLAYED_IN_FEED = [")
    )
  end

  defp last_index_of(file, str) do
    file
    |> File.read!()
    |> String.split("\n")
    |> Enum.with_index()
    |> Enum.reverse()
    |> Enum.find(fn {line, _index} -> String.contains?(line, str) end)
    |> case do
      nil -> raise "Could not find the last index of '#{str}' in #{file}"
      {_, index} -> index + 1
    end
  end
end
