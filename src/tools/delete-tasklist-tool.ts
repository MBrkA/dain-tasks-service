import { ToolConfig } from "@dainprotocol/service-sdk";
import { z } from "zod";
import { getTokenStore } from "../token-store";
import axios from "axios";

import {
  AlertUIBuilder,
  CardUIBuilder, 
  OAuthUIBuilder,
} from "@dainprotocol/utils";

export const deleteTaskListConfig: ToolConfig = {
  id: "delete-tasklist",
  name: "Delete Task List",
  description: "Deletes the authenticated user's specified task list",
  input: z.object({
    tasklistId: z.string().describe("Task list identifier"),
  }),
  output: z.object({}).optional(),
  handler: async ({ tasklistId }, agentInfo, { app }) => {
    const tokens = getTokenStore().getToken(agentInfo.id);

    if (!tokens) {
      const authUrl = await app.oauth2?.generateAuthUrl("google", agentInfo.id);
      if (!authUrl) {
        throw new Error("Failed to generate authentication URL");
      }
      const oauthUI = new OAuthUIBuilder()
        .title("Google Authentication")
        .content("Please authenticate with Google to access your tasks")
        .logo("https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png")
        .url(authUrl)
        .provider("google");

      return {
        text: "Authentication required",
        data: undefined,
        ui: oauthUI.build(),
      };
    }

    try {
      await axios.delete(
        `https://tasks.googleapis.com/tasks/v1/users/@me/lists/${tasklistId}`,
        {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        }
      );

      const cardUI = new CardUIBuilder()
        .title("Task List Deleted")
        .content("The task list was successfully deleted")
        .build();

      return {
        text: "Task list deleted successfully",
        data: undefined,
        ui: cardUI,
      };
    } catch (error: any) {
      const alertUI = new AlertUIBuilder()
        .variant("error")
        .title("Error")
        .message(error.response?.data?.error?.message || error.message);

      return {
        text: "Failed to delete task list",
        data: undefined,
        ui: alertUI.build(),
      };
    }
  },
};
