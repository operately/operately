defmodule Mix.Tasks.Operation.GenActivityItem do

  def gen(ctx) do
    Mix.Operately.generate_file(ctx.activity_item_file_path, fn _ ->
      """
      import * as People from "@/models/people";

      import type { Activity } from "@/models/activities";
      import type { ActivityContent#{ctx.activity_item_handler_name} } from "@/api";
      import type { ActivityHandler } from "../interfaces";

      const #{ctx.activity_item_handler_name}: ActivityHandler = {
        pageHtmlTitle(_activity: Activity) {
          throw new Error("Not implemented");
        },

        pagePath(_activity: Activity) {
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
          return null;
        },

        NotificationLocation(_props: { activity: Activity }) {
          return null;
        },
      };

      function content(activity: Activity): ActivityContent#{ctx.activity_item_handler_name} {
        return activity.content as #{ctx.activity_item_handler_name};
      }

      export default #{ctx.activity_item_handler_name};
      """
    end)
  end

end
